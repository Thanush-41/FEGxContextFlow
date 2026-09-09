import 'reflect-metadata';
import 'dotenv/config';
import { Body, Controller, Get, Post, Req, Param, Module, HttpException, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import type { Request } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Store } from './store.js';
import { Feed } from './feed.js';
import { Actions, HandoffSchema } from './actions.js';
import { Voice, modelOutput } from './voice.js';

const store=new Store(),feed=new Feed(store),actions=new Actions(store,feed),voice=new Voice(actions);
const pendingCommands=new Map<string,AbortController>();
const sockets=new Map<WebSocket,string>();
function owner(req:Request) {const token=req.headers.authorization?.replace(/^Bearer /,'')||'';const s=store.authenticate(token);if(!s)throw new HttpException('Demo session required.',401);return s.id;}
const rates=new Map<string,{time:number,count:number}>();
function limit(id:string,max=180){const now=Date.now(),r=rates.get(id);if(!r||now-r.time>60000){rates.set(id,{time:now,count:1});return;}if(++r.count>max)throw new HttpException('Too many requests. Please wait a moment.',429);}
async function attempt<T>(fn:()=>T|Promise<T>){try{return await fn();}catch(e){if(e instanceof HttpException)throw e;throw new HttpException({message:e instanceof z.ZodError?'Invalid request fields.':(e as Error).message},HttpStatus.BAD_REQUEST);}}
function packet(id:string,includeEvents=false){return {type:'state',result:actions.result(store.get(id),'sync'),...(includeEvents?{events:feed.events,feed:feed.status}:{})};}
function broadcast(id?:string,includeEvents=false){for(const [ws,owner]of sockets)if((!id||id===owner)&&ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify(packet(owner,includeEvents)));}
actions.onChange=r=>broadcast(r.session.id);
feed.onChange=()=>{for(const id of new Set(sockets.values())){try{actions.execute(id,{id:randomUUID(),type:'refresh_state'});}catch{}}broadcast(undefined,true);};

@Controller('api')
class API {
  @Get('health') health(){return {ok:true,demoOnly:true,protocolVersion:1,voiceConfigured:!!process.env.AZURE_OPENAI_API_KEY,feed:feed.status};}
  @Post('bootstrap') bootstrap(@Req() req:Request){limit(`bootstrap:${req.ip}`,20);const previous=store.authenticate(req.headers.authorization?.replace(/^Bearer /,'')||'');const data=previous?{token:req.headers.authorization!.slice(7),session:previous}:store.create();return {...data,snapshot:actions.snapshot(data.session),events:feed.events,feed:feed.status};}
  @Get('state') state(@Req()req:Request){return packet(owner(req),true);}
  @Post('actions') action(@Req()req:Request,@Body()body:unknown){const id=owner(req);limit(id);if((body as any)?.type==='session_status'&&['ended','paused','offline'].includes((body as any)?.payload?.status))pendingCommands.get(id)?.abort();return attempt(()=>actions.execute(id,body));}
  @Post('feed/refresh') async refresh(@Req()req:Request){owner(req);await feed.refresh();return {events:feed.events,feed:feed.status};}
  @Get('events/:id') async event(@Req()req:Request,@Param('id')id:string){owner(req);return {event:await feed.details(id)};}
  @Post('handoffs') handoff(@Req()req:Request,@Body()body:unknown){const id=owner(req);limit(id);return attempt(()=>{const h=HandoffSchema.parse(body);return actions.execute(id,{id:`handoff-${h.handoffId}`,type:'handoff',payload:h as unknown as Record<string,unknown>},'handoff');});}
  @Post('voice/connect') connect(@Req()req:Request,@Body()body:{offerSdp:string}){const id=owner(req);limit(`connect:${id}`,5);return attempt(()=>voice.connect(id,z.string().min(50).max(100000).parse(body.offerSdp)));}
  @Post('voice/tools') tool(@Req()req:Request,@Body()body:{callId:string;name:string;arguments:Record<string,unknown>}){const id=owner(req);limit(id);return attempt(()=>{const r=voice.tool(id,z.string().max(200).parse(body.callId),body.name,body.arguments||{});return {...r,voiceOutput:modelOutput(r)};});}
  @Post('voice/confirm') confirm(@Req()req:Request,@Body()body:{id:string;reviewId:string;utterance:string}){const id=owner(req);limit(id);return attempt(()=>actions.execute(id,{id:body.id,type:'confirm_bet',payload:{reviewId:body.reviewId,utterance:body.utterance}},'voice'));}
  @Post('voice/command') command(@Req()req:Request,@Body()body:{text:string;id:string}){const id=owner(req);limit(id);return attempt(async()=>{
    pendingCommands.get(id)?.abort();const controller=new AbortController();pendingCommands.set(id,controller);
    const close=()=>controller.abort();req.res?.on('close',close);
    try{const r=actions.execute(id,{id:body.id,type:'command',payload:{text:z.string().max(4000).parse(body.text)}},'voice');
      if(r.outcome==='clarification'&&r.message==='I need a little more detail. Name the event and the action you want.'){
        await voice.interpret(id,body.text,controller.signal);return actions.result(store.get(id),body.id);
      }return r;
    }finally{req.res?.off('close',close);if(pendingCommands.get(id)===controller)pendingCommands.delete(id);}
  });}

}
@Module({controllers:[API]})class AppModule{}
const app=await NestFactory.create(AppModule,{logger:['error','warn'],bodyParser:false});
app.use(json({limit:'128kb'}));
app.enableCors({origin:false});
const port=Number(process.env.PORT||3001);
await app.listen(port,'::');
const wss=new WebSocketServer({server:app.getHttpServer(),path:'/api/stream',maxPayload:4096});
wss.on('connection',(ws,req)=>{
  const s=store.authenticate(req.headers.authorization?.replace(/^Bearer /,'')||'');
  if(!s){ws.close(1008,'Unauthorized');return;}
  sockets.set(ws,s.id);ws.send(JSON.stringify(packet(s.id,true)));ws.on('close',()=>sockets.delete(ws));
});
const timer=setInterval(()=>void feed.refresh(),30000);timer.unref();void feed.refresh();
console.log(`ContextFlow demo backend listening on :${port}. Secrets and transcripts are not logged.`);
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{clearInterval(timer);wss.close();void app.close().then(()=>process.exit(0));});
