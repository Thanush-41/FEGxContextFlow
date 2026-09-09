/** Real HTTP/WebSocket transport; simulated handoff and confirmation inputs. No microphone claim. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync,mkdirSync} from 'node:fs';
import {WebSocket} from 'ws';
import {ActionResultSchema} from '../../shared/schemas.js';

const base=process.env.CONTEXTFLOW_TEST_URL||'http://127.0.0.1:3001';
let token='';const timings:Record<string,number>={};
async function request(path:string,body?:unknown){const start=performance.now();const r=await fetch(`${base}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-region':'ap-northeast-2',authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(25000)});const data=await r.json() as any;if(!r.ok)throw new Error(data.message||`HTTP ${r.status}`);timings[path]=Number((performance.now()-start).toFixed(1));return data;}
const act=(type:string,payload:Record<string,unknown>={},id=randomUUID())=>request('actions',{id,type,payload});
const boot=await request('bootstrap',{});token=boot.token;
assert.ok(boot.events.some((e:any)=>e.source==='demo'));
let packet:any;
const ws=new WebSocket(base.replace(/^http/,'ws')+'/api/stream',{headers:{'x-region':'ap-northeast-2',authorization:`Bearer ${token}`}});
ws.on('message',raw=>{packet=JSON.parse(String(raw))});
await new Promise<void>((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
try{
 const now=new Date().toISOString();
 const handoff={version:1,handoffId:randomUUID(),sessionId:boot.session.id,createdAt:now,instruction:'Open Northbridge FC and add home win with 10 demo credits',research:{summary:'Contract-test research about a fictional event. No prediction or guarantee.',sources:[{title:'Synthetic QA notes',retrievedAt:now}]},candidateEvents:['e1']};
 let r=ActionResultSchema.parse(await request('handoffs',handoff));
 assert.equal(r.session.eventId,'e1');assert.equal(r.session.slip.selections.length,1);
 r=await request('voice/command',{id:randomUUID(),text:'change that to five'});assert.equal(r.session.slip.stakeMinor,500);timings.followUpAction=timings['voice/command'];
 const duplicate=await request('handoffs',handoff);assert.equal(duplicate.session.slip.stakeMinor,500);assert.equal(duplicate.session.slip.selections.length,1);
 await request('voice/command',{id:randomUUID(),text:'show the stats'});assert.equal((await request('state')).result.session.eventView,'Stats');
 const review=(await act('prepare_bet')).session.review;assert.ok(review.dialog.includes('5.00 demo credits'));
 await assert.rejects(()=>request('voice/tools',{callId:randomUUID(),name:'execute_action',arguments:{type:'confirm_bet',payload:{reviewId:review.id}}}),/Unsupported voice action/);
 await assert.rejects(()=>request('voice/confirm',{id:randomUUID(),reviewId:review.id,utterance:'Confirm demo bet'}),/full review/);
 // Explicitly simulated native readback + user transcript, for contract testing only.
 await act('review_read',{reviewId:review.id});
 const confirm={id:randomUUID(),reviewId:review.id,utterance:'Confirm demo bet'};
 const receipt=await request('voice/confirm',confirm);const retry=await request('voice/confirm',confirm);
 assert.equal(receipt.session.tickets.length,1);assert.equal(retry.session.walletMinor,124500);assert.equal(retry.session.tickets[0].id,receipt.session.tickets[0].id);
 for(let i=0;i<100&&packet?.result?.snapshot?.receipt!==receipt.session.tickets[0].id;i++)await new Promise(r=>setTimeout(r,50));
 assert.equal(packet.result.snapshot.receipt,receipt.session.tickets[0].id);
 const resumed=await request('bootstrap',{});assert.equal(resumed.session.id,boot.session.id);assert.equal(resumed.session.walletMinor,124500);
 await act('copy_selections',{selectionIds:['e1-winner-0','e3-winner-0']});
 assert.equal((await request('state')).result.session.slip.selections.length,2);
 await act('settings',{paused:true});await assert.rejects(()=>act('prepare_bet'),/paused/);
 const report={at:new Date().toISOString(),transport:base.includes('supabase.co')?'Real Supabase Edge HTTP + WebSocket':'Real NestJS HTTP + WebSocket',handoffAndSpeechInputs:'Synthetic contract fixtures; no Siri research or human microphone used',passed:['handoff with separate instruction','follow-up stake','stats navigation','duplicate handoff','model placement denied','readback gate','single receipt and debit','same receipt in WebSocket snapshot','bootstrap restoration','Arena copy','paused play'],liveEvents:boot.events.filter((e:any)=>e.source==='live').length,fictionalEvents:boot.events.filter((e:any)=>e.source==='demo').length,timingsMs:timings,receipt:receipt.session.tickets[0].id};
 mkdirSync('../artifacts',{recursive:true});writeFileSync(base.includes('supabase.co')?'../artifacts/edge-http-smoke.json':'../artifacts/http-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{ws.close();}
