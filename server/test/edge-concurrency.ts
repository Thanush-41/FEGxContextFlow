import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const {baseUrl}=JSON.parse(readFileSync('../artifacts/supabase-deployment.json','utf8'));let token='';
const timings:number[]=[];
async function request(path:string,body?:unknown){const t=performance.now();const r=await fetch(`${baseUrl}/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json','x-region':'ap-northeast-2',authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.message);timings.push(Math.round(performance.now()-t));return d;}
const act=(type:string,payload={},id=randomUUID())=>request('actions',{id,type,payload});
const b=await request('bootstrap',{});token=b.token;
await act('select_outcome',{selectionId:'e1-winner-0'});await act('set_stake',{stakeMinor:500});
const review=(await act('prepare_bet')).session.review;await act('review_read',{reviewId:review.id});
const body={id:randomUUID(),reviewId:review.id,utterance:'Confirm demo bet'};
const results=await Promise.all(Array.from({length:5},()=>request('voice/confirm',body)));
assert.ok(results.every(r=>r.session.walletMinor===124500));assert.equal(new Set(results.map(r=>r.session.tickets[0].id)).size,1);
await Promise.all(['today','sports','menu'].map(route=>act('navigate',{route})));
const state=(await request('state')).result.session;assert.equal(state.revision,8);assert.equal(state.tickets.length,1);
const report={at:new Date().toISOString(),passed:['five simultaneous identical confirmations produce one debit and one receipt','concurrent state updates commit without lost revisions'],requestTimingsMs:timings,finalRevision:state.revision};
writeFileSync('../artifacts/edge-concurrency.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
