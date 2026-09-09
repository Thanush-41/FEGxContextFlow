import {ActionQueue} from './ActionQueue';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { ActionResult, Bootstrap, ContextHandoff, Event, TaskSession } from '../../shared/contracts';

export type VoiceState = { status: string; muted: boolean; recording?:boolean; action?:string; transcript: string; reply?: string; error?: string; connectionMs?: number };
const native = NativeModules.ContextFlowVoice;
type Packet={result?:ActionResult;events?:Event[];feed?:Bootstrap['feed']};
const id=()=>`${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export class AgentClient {
  baseUrl=native?.defaultApiUrl || (Platform.OS==='android'?'http://10.0.2.2:3001':'http://127.0.0.1:3001');
  token=''; session?:TaskSession; events:Event[]=[];
  feed:Bootstrap['feed']={status:'offline',message:'Connect to the sample-data backend to use the demo and voice.'};
  voice:VoiceState={status:'idle',muted:false,transcript:''};
  turns:{role:'You'|'ContextFlow';text:string}[]=[];
  private listeners=new Set<()=>void>();
  private connection?:Promise<Bootstrap>;
  private queue=new ActionQueue<ActionResult>();
  private commandAbort?:AbortController;
  private actionAbort?:AbortController;
  constructor(){
    if(native){const emitter=new NativeEventEmitter(native);emitter.addListener('ContextFlowState',(packet:Packet)=>this.accept(packet));emitter.addListener('ContextFlowVoice',(...args:readonly Object[])=>{const next=args[0] as Partial<VoiceState>;for(const [key,role] of [['transcript','You'],['reply','ContextFlow']] as const){if(next[key]&&next[key]!==this.voice[key])this.turns=[...this.turns,{role,text:next[key]!}].slice(-12);}this.voice={...this.voice,...next};this.emit();});}
  }
  subscribe(fn:()=>void){this.listeners.add(fn);return ()=>{this.listeners.delete(fn);};}
  private emit(){this.listeners.forEach(fn=>fn());}
  accept(packet:Packet){
    if(packet.result&&this.session&&packet.result.session.id!==this.session.id)return;
    if(packet.result&&(!this.session||packet.result.session.revision>=this.session.revision))this.session=packet.result.session;
    if(packet.events)this.events=packet.events;if(packet.feed)this.feed=packet.feed;this.emit();
  }
  async request<T>(path:string,body?:unknown,signal?:AbortSignal):Promise<T>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),path==='actions'?8000:25000);
    const abort=()=>controller.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)controller.abort();
    try{const r=await fetch(`${this.baseUrl}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json',...(this.baseUrl.includes('.supabase.co')?{'x-region':'ap-northeast-2'}:{}),...(this.token?{authorization:`Bearer ${this.token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:controller.signal});const d=await r.json();if(!r.ok)throw new Error(typeof d.message==='string'?d.message:'The action could not be completed.');return d;}catch(e){throw new Error((e as Error).name==='AbortError'?'Connection timed out. Your saved task is unchanged.':(e as Error).message);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
  }
  async connect(){
    if(this.connection)return this.connection;
    this.connection=(async()=>{
      if(native){const saved=await native.getCredentials();this.token=saved.token||this.token;this.baseUrl=saved.baseUrl||this.baseUrl;}
      const b=await this.request<Bootstrap>('bootstrap',{});this.token=b.token;if(!this.session||this.session.id!==b.session.id||b.session.revision>=this.session.revision)this.session=b.session;this.events=b.events;this.feed=b.feed;
      if(native)await native.configure(this.baseUrl,this.token);
      this.emit();return b;
    })().catch(e=>{this.voice={...this.voice,status:'offline',error:e.message};this.feed={status:'offline',message:'Backend offline · cached demo preview. Open voice connection settings to reconnect.'};this.emit();throw e;}).finally(()=>{this.connection=undefined;});return this.connection;
  }
  action(type:string,payload:Record<string,unknown>={}){
    return this.queue.enqueue(async()=>{if(this.connection||!this.token)await this.connect();const controller=new AbortController();this.actionAbort=controller;try{const r=await this.request<ActionResult>('actions',{id:id(),type,payload},controller.signal);this.accept({result:r});if(native?.syncState)await native.syncState(JSON.stringify(r));return r;}finally{if(this.actionAbort===controller)this.actionAbort=undefined;}},['navigate','set_stake'].includes(type)?type:undefined);
  }
  async refresh(){if(this.connection||!this.token)await this.connect();this.accept(await this.request<Packet>('feed/refresh',{}));}
  async details(eventId:string){const d=await this.request<{event?:Event}>(`events/${encodeURIComponent(eventId)}`);if(d.event){this.events=this.events.map(e=>e.id===eventId?d.event!:e);this.emit();}}
  async start(){if(['connecting','listening','thinking','speaking','review'].includes(this.voice.status))return;this.voice={...this.voice,status:'connecting',error:undefined,transcript:'',reply:undefined};this.emit();try{if(!native)throw new Error('Native voice is unavailable. Rebuild the application.');if(this.connection||!this.token)await this.connect();await native.start();}catch(e){this.voice={...this.voice,status:'offline',error:(e as Error).message};this.emit();throw e;}}
  voiceError(message:string){this.voice={...this.voice,error:message};this.emit();}
  async stop(){this.commandAbort?.abort();this.actionAbort?.abort();this.queue.clear();if(native)await native.stop();else await this.action('session_status',{status:'ended'});}
  async mute(){if(native)await native.setMuted(!this.voice.muted);}
  async review(){const r=await this.action('prepare_bet');if(native&&['listening','speaking','review','thinking'].includes(this.voice.status))await native.readReview(JSON.stringify(r.session.review));return r;}
  async command(text:string){
    this.commandAbort?.abort();
    if(native?.sendText&&['listening','speaking','review','thinking'].includes(this.voice.status)){
      await this.action('record_instruction',{text});await native.sendText(text);return;
    }
    const controller=new AbortController();this.commandAbort=controller;
    this.turns=[...this.turns,{role:'You',text} as const].slice(-12);this.emit();
    try{
      if(this.connection||!this.token)await this.connect();
      const r=await this.request<ActionResult>('voice/command',{id:id(),text},controller.signal);
      if(controller.signal.aborted)return;
      this.accept({result:r});this.turns=[...this.turns,{role:'ContextFlow',text:r.message} as const].slice(-12);this.emit();
      if(r.session.review&&native)await native.readReview(JSON.stringify(r.session.review));return r;
    }catch(e){if(!controller.signal.aborted)throw e;}
    finally{if(this.commandAbort===controller)this.commandAbort=undefined;}
  }
  async handoff(summary:string,instruction:string,url?:string,sourceTitle?:string){
    if(this.connection||!this.token)await this.connect();const now=new Date().toISOString();
    const h:ContextHandoff={version:1,handoffId:id(),sessionId:this.session?.id,instruction,research:{summary,sources:sourceTitle||url?[{title:sourceTitle||'Shared research',...(url?{url}:{}),retrievedAt:now}]:[]},createdAt:now};
    const r=await this.request<ActionResult>('handoffs',h);this.accept({result:r});return r;
  }
  async setServer(url:string){if(!/^https?:\/\//.test(url))throw new Error('Enter a valid backend URL.');await this.stop().catch(()=>{});this.baseUrl=url.replace(/\/$/,'');this.token='';if(native)await native.configure(this.baseUrl,'');return this.connect();}
}
export const agent=new AgentClient();
