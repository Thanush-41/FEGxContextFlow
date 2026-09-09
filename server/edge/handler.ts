import {createHash} from 'node:crypto';
import {Actions,ActionSchema,HandoffSchema} from '../src/actions.js';
import {normalizeSession} from '../../shared/safeguards.js';
import {Feed,HACKATHON_SAMPLE_ONLY} from '../src/feed.js';
import {Voice,modelOutput,isAllowedVoiceAction} from '../src/voice.js';
import {newSession} from '../src/new-session.js';
import type {ActionStore} from '../src/store-port.js';
import type {ActionResult,TaskSession} from '../../shared/contracts.js';
import {z} from 'zod';

declare const Deno:any;
declare const EdgeRuntime:{waitUntil:(p:Promise<unknown>)=>void};
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
class APIError extends Error {constructor(message:string,readonly status=400){super(message)}}
async function db(path:string,body?:unknown,method=body===undefined?'GET':'POST',prefer='return=representation'){
  const r=await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`,{method,signal:AbortSignal.timeout(8000),headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY!,authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'content-type':'application/json',prefer},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const text=await r.text();const value=text?JSON.parse(text):null;
  if(!r.ok)throw new APIError(r.status>=500?'Database temporarily unavailable. No automatic retry was queued.':value?.message||'The database action failed.',r.status>=500?503:400);
  return value;
}
// The same synchronous action engine computes a candidate state. Only the
// Postgres row-lock/CAS transaction may publish it or issue its receipt.
class SnapshotStore implements ActionStore {
  fingerprint=''; result?:ActionResult;
  constructor(private session:TaskSession){}
  hash=hash;
  get(id:string){if(id!==this.session.id)throw new Error('Session not found.');return structuredClone(this.session)}
  save(s:TaskSession){this.session=structuredClone(s)}
  previous(){return undefined}
  record(_owner:string,_id:string,fingerprint:string,result:ActionResult){this.fingerprint=fingerprint;this.result=result}
  transaction<T>(fn:()=>T){return fn()}
}
const cache=new Map<string,unknown>();
function background(p:Promise<unknown>){if(typeof EdgeRuntime!=='undefined')EdgeRuntime.waitUntil(p.catch(()=>{}));else void p.catch(()=>{});}
const europeanFeed=process.env.SB_REGION==='eu-central-1';
const feed=new Feed({cache(id,body){if(body!==undefined){cache.set(id,body);background(db('contextflow_cache?on_conflict=id',{id,body,updated_at:new Date().toISOString()},'POST','resolution=merge-duplicates'));return body;}return cache.get(id);}},europeanFeed);
let loaded:Promise<void>|undefined,lastRefresh=0;
async function readFeedCache(){
  if(HACKATHON_SAMPLE_ONLY)return;
  const rows=await db('contextflow_cache?id=eq.live-events&select=body,updated_at');
  if(rows[0]){cache.set('live-events',rows[0].body);feed.events=[...rows[0].body,...feed.events.filter(e=>e.source==='demo')];feed.status={status:Date.now()-Date.parse(rows[0].updated_at)<120000?'live':'offline',updatedAt:rows[0].updated_at,message:Date.now()-Date.parse(rows[0].updated_at)<120000?'Live offer · fictional credits.':'Live feed is stale. Showing the last received update.'};}
}
async function regionalFeed(eventId?:string){
  if(HACKATHON_SAMPLE_ONLY)return eventId?{event:await feed.details(eventId)}:{events:feed.events,feed:feed.status};
  if(europeanFeed){await readFeedCache().catch(()=>{});if(eventId){const event=await feed.details(eventId);if(event?.source==='live')await db('contextflow_cache?on_conflict=id',{id:'live-events',body:feed.events.filter(e=>e.source==='live'),updated_at:feed.status.updatedAt},'POST','resolution=merge-duplicates');return {event};}await feed.refresh();return {events:feed.events,feed:feed.status,diagnostics:feed.lastError};}
  const r=await fetch(`${process.env.SUPABASE_URL}/functions/v1/contextflow-api/api/internal/feed`,{method:'POST',headers:{authorization:`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,'content-type':'application/json','x-region':'eu-central-1'},body:JSON.stringify({eventId}),signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new APIError('The live feed is temporarily unavailable.',503);
  const data=await r.json();if(data.events){feed.events=data.events;feed.status=data.feed;}
  return data;
}
async function ensureFeed(){
  if(HACKATHON_SAMPLE_ONLY)return;
  if(!loaded)loaded=readFeedCache().catch(()=>{});
  await loaded;
  if(Date.now()-lastRefresh>30000){lastRefresh=Date.now();background(readFeedCache().then(()=>regionalFeed()).catch(()=>{}));}
}
async function sessionFor(token:string){if(!token)return undefined;const rows=await db(`contextflow_sessions?token_hash=eq.${hash(token)}&select=body`);return rows[0]?.body?normalizeSession(rows[0].body):undefined;}
async function current(owner:string){const rows=await db(`contextflow_sessions?id=eq.${encodeURIComponent(owner)}&select=body`);if(!rows[0])throw new APIError('Demo session required.',401);return normalizeSession(rows[0].body as TaskSession);}
function engine(s:TaskSession){return new Actions(new SnapshotStore(s),feed)}
function packet(s:TaskSession,events=false){return {type:'state',result:engine(s).result(s,'sync'),...(events?{events:feed.events,feed:feed.status}:{})}}
async function limit(id:string,max=180){if(!await db('rpc/contextflow_limit',{p_id:hash(id),p_max:max}))throw new APIError('Too many requests. Please wait a moment.',429)}
async function previous(owner:string,id:string){const rows=await db(`contextflow_actions?owner=eq.${encodeURIComponent(owner)}&id=eq.${encodeURIComponent(id)}&select=fingerprint,result`);return rows[0];}
async function execute(owner:string,raw:unknown,origin:'touch'|'tool'|'voice'|'handoff'='touch',prepared?:{session:TaskSession;previous?:any},commandGuard?:string){
  const a=ActionSchema.parse(raw),fp=hash(JSON.stringify({...a,origin}));
  for(let attempt=0;attempt<5;attempt++){
    const [s,old]=attempt===0&&prepared?[prepared.session,prepared.previous]:await Promise.all([current(owner),previous(owner,a.id)]);
    if(old){if(old.fingerprint!==fp)throw new APIError('This action ID was already used for a different request.');return {...old.result,session:s,snapshot:engine(s).snapshot(s),duplicate:true};}
    const state=new SnapshotStore(s),actions=new Actions(state,feed),r=actions.execute(owner,a,origin);
    const committed=await db('rpc/contextflow_commit',{p_owner:owner,p_expected:s.revision,p_id:a.id,p_fingerprint:state.fingerprint,p_result:{...r,...(commandGuard?{commandGuard}:{})}});
    if(committed.conflict)continue;
    const result=committed.result as ActionResult;
    if(committed.session){result.session=committed.session;result.snapshot=engine(committed.session).snapshot(committed.session);}
    return {...result,duplicate:!!committed.duplicate};
  }
  throw new APIError('Your session changed several times. Check the latest state and retry this action.',409);
}
async function tool(owner:string,callId:string,name:string,args:Record<string,unknown>,prepared?:{session:TaskSession;previous?:any},commandGuard?:string){
  const s=prepared?.session||await current(owner),voice=new Voice(engine(s));
  // Validate the identical restricted tool catalog before committing through Postgres.
  if(name==='execute_action'){
    if(!isAllowedVoiceAction(args.type))throw new APIError('Unsupported voice action.');
    const r=await execute(owner,{id:`voice-${callId}`,type:args.type,payload:args.payload},'tool',prepared,commandGuard);return {...r,voiceOutput:modelOutput(r)};
  }
  const r=voice.tool(owner,callId,name,args);return {...r,voiceOutput:modelOutput(r)};
}
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function body(req:Request){const text=await req.text();if(text.length>131072)throw new APIError('Request too large.',413);try{return JSON.parse(text||'{}')}catch{throw new APIError('Invalid JSON.')}}
const commands=new Map<string,AbortController>();
export async function handle(req:Request):Promise<Response>{
  try{
    const url=new URL(req.url),path=url.pathname.split('/api/')[1]||'';
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'authorization, content-type'}});
    if(path==='internal/feed'&&req.method==='POST'){if(!europeanFeed||req.headers.get('authorization')!==`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`)throw new APIError('Internal feed access required.',401);const b=await body(req);return json(await regionalFeed(b.eventId));}
    if(path==='health')return json({ok:true,demoOnly:true,protocolVersion:1,backend:'supabase-edge-postgres',feedError:feed.lastError,voiceConfigured:!!process.env.AZURE_OPENAI_API_KEY,feed:feed.status});
    const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
    if(path==='bootstrap'&&req.method==='POST'){
      await limit('bootstrap:'+(req.headers.get('x-forwarded-for')||'unknown'),30);await ensureFeed();
      const old=await sessionFor(token),data=old?{token,session:old}:newSession();
      if(!old)await db('contextflow_sessions',{id:data.session.id,token_hash:hash(data.token),revision:0,body:data.session});
      return json({...data,snapshot:engine(data.session).snapshot(data.session),events:feed.events,feed:feed.status});
    }
    const b=req.method==='POST'?await body(req):{};
    const actionId=path==='actions'||path==='voice/command'||path==='voice/confirm'?b.id:path==='voice/tools'&&b.name==='execute_action'?`voice-${b.callId}`:path==='handoffs'?`handoff-${b.handoffId}`:null;
    const context=token?await db('rpc/contextflow_context',{p_token_hash:hash(token),p_action_id:actionId}):null;
    if(context?.session)context.session=normalizeSession(context.session);
    const s=context?.session as TaskSession|undefined;if(!s)throw new APIError('Demo session required.',401);await ensureFeed();
    if(path==='stream'&&req.headers.get('upgrade')?.toLowerCase()==='websocket'){
      const {socket,response}=Deno.upgradeWebSocket(req);let closed=false,busy=false,revision=-1,tick=0;
      const push=async()=>{if(closed||busy)return;busy=true;try{const next=await current(s.id);if(next.revision!==revision||tick%15===0){if(socket.readyState===1)socket.send(JSON.stringify(packet(next,tick%15===0)));revision=next.revision;}tick++;if(tick%15===0){await ensureFeed();await execute(s.id,{id:crypto.randomUUID(),type:'refresh_state'});}}catch{socket.close(1011,'State unavailable')}finally{busy=false;}};
      const timer=setInterval(()=>void push(),2000),expiry=setTimeout(()=>socket.close(1000,'Refresh connection'),110000);
      socket.onopen=()=>void push();socket.onclose=()=>{closed=true;clearInterval(timer);clearTimeout(expiry)};socket.onerror=()=>{closed=true;clearInterval(timer);clearTimeout(expiry)};return response;
    }
    if(path==='state'&&req.method==='GET')return json(packet(s,true));
    if(path.startsWith('events/')&&req.method==='GET')return json(await regionalFeed(decodeURIComponent(path.slice(7))));
    if(req.method!=='POST')throw new APIError('Route not found.',404);
    if(path==='actions'){
      if(b.type==='session_status'&&['ended','paused','offline'].includes(b.payload?.status)){commands.get(s.id)?.abort();await db('contextflow_commands?owner=eq.'+s.id,{active:false},'PATCH');}
      return json(await execute(s.id,b,'touch',context));
    }
    if(path==='feed/refresh')return json(await regionalFeed());
    if(path==='handoffs'){const h=HandoffSchema.parse(b);return json(await execute(s.id,{id:`handoff-${h.handoffId}`,type:'handoff',payload:h},'handoff',context))}
    if(path==='voice/connect'){commands.get(s.id)?.abort();await db('contextflow_commands?owner=eq.'+s.id,{active:false},'PATCH');await limit('connect:'+s.id,5);return json(await new Voice(engine(s)).connect(s.id,z.string().min(50).max(100000).parse(b.offerSdp)))}
    if(path==='voice/tools')return json(await tool(s.id,z.string().min(1).max(200).parse(b.callId),b.name,b.arguments||{},context));
    if(path==='voice/confirm')return json(await execute(s.id,{id:b.id,type:'confirm_bet',payload:{reviewId:b.reviewId,utterance:b.utterance}},'voice',context));
    if(path==='voice/command'){
      if(context.previous)return json(await execute(s.id,{id:b.id,type:'command',payload:{text:z.string().max(4000).parse(b.text)}},'voice',context));
      await db('contextflow_commands?on_conflict=owner',{owner:s.id,request_id:b.id,active:true},'POST','resolution=merge-duplicates');
      commands.get(s.id)?.abort();const cancel=new AbortController();commands.set(s.id,cancel);req.signal.addEventListener('abort',()=>cancel.abort(),{once:true});
      try{
        const r=await execute(s.id,{id:b.id,type:'command',payload:{text:z.string().max(4000).parse(b.text)}},'voice',context);
        if(!r.duplicate&&r.outcome==='clarification'&&r.message==='I need a little more detail. Name the event and the action you want.'){
          const voice=new Voice(engine(r.session),async(...args)=>{const marker=await db('contextflow_commands?owner=eq.'+s.id+'&select=request_id,active');if(cancel.signal.aborted||!marker[0]?.active||marker[0].request_id!==b.id){cancel.abort();throw new APIError('Instruction cancelled.');}return tool(args[0],args[1],args[2],args[3],undefined,b.id)});
          await voice.interpret(s.id,b.text,cancel.signal);const final=await current(s.id);return json(engine(final).result(final,b.id));
        }return json(r);
      }finally{if(commands.get(s.id)===cancel)commands.delete(s.id);}
    }
    throw new APIError('Route not found.',404);
  }catch(e){return json({message:e instanceof z.ZodError?'Invalid request fields.':(e as Error).message},e instanceof APIError?e.status:400)}
}
