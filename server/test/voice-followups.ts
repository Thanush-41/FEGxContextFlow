/** Real Azure conversation + hosted Edge tools. Synthetic audio; no human microphone claim. */
import 'dotenv/config';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {WebSocket} from 'ws';
import {Voice,modelOutput} from '../src/voice.js';
import {Store} from '../src/store.js';
import {Feed} from '../src/feed.js';
import {Actions} from '../src/actions.js';
const base=JSON.parse(readFileSync('../artifacts/supabase-deployment.json','utf8')).baseUrl;
let token='';async function api(path:string,body:any){const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'content-type':'application/json','x-region':'ap-northeast-2',authorization:'Bearer '+token},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});const v=await r.json();if(!r.ok)throw new Error(v.message);return v;}
const boot=await api('bootstrap',{});token=boot.token;if(process.argv.includes('--cancelled'))boot.session=(await api('actions',{id:crypto.randomUUID(),type:'settings',payload:{limitMinor:0}})).session;
const store=new Store(':memory:'),feed=new Feed(store,false),actions=new Actions(store,feed),voice=new Voice(actions);
function pcm(path:string){const wav=readFileSync(path);for(let p=12;p+8<wav.length;){const n=wav.readUInt32LE(p+4);if(wav.toString('ascii',p,p+4)==='data')return wav.subarray(p+8,p+8+n);p+=8+n+(n%2);}throw new Error('WAV data missing')}
const cancellation=process.argv.includes('--cancelled');
const cases=cancellation?[{text:'Set my stake to five.',stake:500},{text:'Change that to ten.',stake:1000},{text:'Change that to three.',stake:300}]:[{text:'Set my stake to five.',stake:500},{audio:pcm('/tmp/contextflow-ten.wav'),stake:1000},{audio:pcm('/tmp/contextflow-three.wav'),stake:300}];
let phase=-1,started=performance.now(),committed=0,finished=false,calls=0;
const measures:any[]=[];const handled=new Set<string>();
const ws=new WebSocket(process.env.AZURE_OPENAI_ENDPOINT!.replace(/\/$/,'').replace(/^http/,'ws')+'/openai/v1/realtime?model='+encodeURIComponent(process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT!),{headers:{'api-key':process.env.AZURE_OPENAI_API_KEY!}});
const send=(e:unknown)=>{if(!finished)ws.send(JSON.stringify(e));};
const timer=setTimeout(()=>end(new Error('Follow-up test timed out.')),110000);
function end(e?:Error){if(finished)return;finished=true;clearTimeout(timer);ws.close();store.db.close();if(e){console.error(e.message);process.exitCode=1}else{const report={at:new Date().toISOString(),scope:cancellation?'One real Azure connection with a cancelled function call followed by three typed instructions':'One real Azure connection; typed instruction then two synthetic speech follow-ups, using deployed Edge action functions',turns:measures,cancelledToolRecovery:cancellation?'An unfinished get_session call was closed with a cancelled output; following actions completed.':undefined,passed:true};writeFileSync(cancellation?'../artifacts/voice-cancelled-followups.json':'../artifacts/voice-followups.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}}
async function next(){phase++;if(phase===cases.length){end();return;}calls=0;const c=cases[phase];if(c.text){send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:c.text}]}});}else{for(let i=0;i<c.audio!.length;i+=2400){send({type:'input_audio_buffer.append',audio:c.audio!.subarray(i,i+2400).toString('base64')});await new Promise(r=>setTimeout(r,50));}send({type:'input_audio_buffer.commit'});}committed=performance.now();measures.push({input:c.text?'typed':'synthetic audio',expectedStakeMinor:c.stake});send({type:'response.create'});}
ws.on('open',()=>send({type:'session.update',session:{...voice.session(boot.session),output_modalities:['text'],audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'whisper-1'},turn_detection:null}}}}));
let ready=false;
ws.on('message',async raw=>{try{const e=JSON.parse(String(raw));if(e.type==='session.updated'&&!ready){ready=true;console.log('Azure connected in',Math.round(performance.now()-started),'ms');if(!cancellation){await next();return;}send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:'Call get_session now to refresh the app state.'}]}});send({type:'response.create',response:{tool_choice:{type:'function',name:'get_session'}}});}
 if(e.type==='error')throw new Error('Azure error: '+e.error?.code);
 if(e.type!=='response.done'||finished)return;
 if(handled.has(e.response.id))return;handled.add(e.response.id);assert.equal(e.response.status,'completed');
 const batch=(e.response.output||[]).filter((x:any)=>x.type==='function_call');
 if(phase<0){assert.ok(batch.length,'Cancelled-tool fixture needs a function call');for(const call of batch)send({type:'conversation.item.create',item:{type:'function_call_output',call_id:call.call_id,output:JSON.stringify({cancelled:true,message:'Previous turn interrupted. This call is closed; nothing remains queued. Follow the new user instruction.'})}});await next();return;}
 if(!batch.length){assert.ok(measures[phase].actionMs,'Turn ended without completing its action');measures[phase].replyMs=Math.round(performance.now()-committed);measures[phase].toolCalls=calls;await next();return;}
 for(const call of batch){assert.ok(++calls<=6,'Tool loop detected');const r=await api('voice/tools',{callId:call.call_id,name:call.name,arguments:JSON.parse(call.arguments||'{}')});if(call.name==='execute_action'){assert.equal(r.session.slip.stakeMinor,cases[phase].stake);measures[phase].actionMs=Math.round(performance.now()-committed);}send({type:'conversation.item.create',item:{type:'function_call_output',call_id:call.call_id,output:JSON.stringify(modelOutput(r))}});}
 send({type:'response.create'});
 }catch(e){end(e as Error)}});
ws.on('error',()=>end(new Error('Azure transport failed.')));
