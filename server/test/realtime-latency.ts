/** Optional live Azure check using synthetic speech and an isolated in-memory demo task. */
import 'dotenv/config';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {WebSocket} from 'ws';
import {Store} from '../src/store.js';
import {Feed} from '../src/feed.js';
import {Actions} from '../src/actions.js';
import {Voice} from '../src/voice.js';
const wav=readFileSync(process.argv[2]||'/tmp/contextflow-voice-command.wav');
let pcm:Buffer|undefined;
for(let offset=12;offset+8<wav.length;){const size=wav.readUInt32LE(offset+4);if(wav.toString('ascii',offset,offset+4)==='data'){pcm=wav.subarray(offset+8,offset+8+size);break;}offset+=8+size+(size%2);}
if(!pcm)throw new Error('Supply a 24 kHz mono PCM16 WAV saying Show live football.');
const store=new Store(':memory:'),feed=new Feed(store,false),actions=new Actions(store,feed),voice=new Voice(actions),{session}=store.create();
const endpoint=process.env.AZURE_OPENAI_ENDPOINT!.replace(/\/$/,''),model=process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT!,key=process.env.AZURE_OPENAI_API_KEY!;
const started=performance.now();let readyMs=0,committedAt=0,phase='warming',pending=false,done=false;
const ws=new WebSocket(`${endpoint.replace(/^http/,'ws')}/openai/v1/realtime?model=${encodeURIComponent(model)}`,{headers:{'api-key':key}});
const send=(x:unknown)=>ws.send(JSON.stringify(x));
const timer=setTimeout(()=>finish(new Error('Live latency check timed out.')),45000);
function finish(error?:Error){if(done)return;done=true;clearTimeout(timer);ws.close();store.db.close();if(error){console.error(error.message);process.exitCode=1;}}
async function streamSpeech(){phase='speech';for(let n=0;n<pcm!.length;n+=2400){if(done)return;send({type:'input_audio_buffer.append',audio:pcm!.subarray(n,n+2400).toString('base64')});await new Promise(r=>setTimeout(r,50));}committedAt=performance.now();send({type:'input_audio_buffer.commit'});send({type:'response.create'});}
ws.on('open',()=>send({type:'session.update',session:{...voice.session(session),output_modalities:['text'],audio:{input:{format:{type:'audio/pcm',rate:24000},transcription:{model:'whisper-1'},turn_detection:null}}}}));
ws.on('message',raw=>{try{
 const e=JSON.parse(String(raw));
 if(e.type==='session.updated'&&phase==='warming'){readyMs=performance.now()-started;send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:'Read get_session and say ready. Wait for my next spoken instruction before taking an action.'}]}});send({type:'response.create'});}
 if(e.type==='response.function_call_arguments.done'){
   const result=voice.tool(session.id,e.call_id,e.name,JSON.parse(e.arguments));
   send({type:'conversation.item.create',item:{type:'function_call_output',call_id:e.call_id,output:JSON.stringify(result)}});pending=true;
   if(phase==='speech'&&e.name==='execute_action'){
     const state=store.get(session.id);if(state.route!=='live'||state.sport!=='football')throw new Error('Speech did not produce the expected live-football action.');
     const report={at:new Date().toISOString(),input:'Synthetic Show live football speech, streamed as PCM16 over real Azure WSS',dispatcher:'Isolated in-memory demo task; no wallet or device task modified',connectionToSessionReadyMs:Math.round(readyMs),warmSpeechCommitToActionMs:Math.round(performance.now()-committedAt),result:state.lastAction,scope:'Excludes mobile microphone, WebRTC transport, native UI, and the 500 ms native VAD silence window'};
     mkdirSync('../artifacts',{recursive:true});writeFileSync('../artifacts/realtime-latency.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));finish();
   }
 }
 if(e.type==='response.done'&&!done){if(pending){pending=false;send({type:'response.create'});}else if(phase==='warming')void streamSpeech();}
 if(e.type==='error')finish(new Error(`Azure realtime returned an error (${e.error?.code||'unknown'}). No secret response was logged.`));
}catch(e){finish(e as Error);}});
ws.on('error',()=>finish(new Error('Azure realtime connection failed.')));
