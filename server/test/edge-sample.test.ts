import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../edge/handler.js';
import {newSession} from '../src/new-session.js';
test('Edge bootstrap, refresh, detail and internal routes never request production or cached sports data',async()=>{
 const saved=newSession(),calls:string[]=[];const old=globalThis.fetch;
 process.env.SUPABASE_URL='https://sample-project.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='synthetic-key';
 globalThis.fetch=async(input)=>{const url=String(input);calls.push(url);let body:unknown=[];
  if(url.includes('contextflow_limit'))body=true;
  if(url.includes('contextflow_context'))body={session:saved.session};
  if(url.includes('contextflow_sessions?'))body=[{body:saved.session}];
  if(url.includes('contextflow_cache'))throw Error('Cached production sports data must not be accessed');
  if(!url.startsWith('https://sample-project.invalid/rest/'))throw Error('Unexpected network request');
  return new Response(JSON.stringify(body),{status:200,headers:{'content-type':'application/json'}});
 };
 try{for(const [path,method] of [['bootstrap','POST'],['feed/refresh','POST'],['events/e1','GET'],['events/production-cache','GET'],['internal/feed','POST']]){const response=await handle(new Request('https://test.invalid/api/'+path,{method,headers:{authorization:'Bearer sample-token'},...(method==='POST'?{body:'{}'}:{})}));assert.ok([200,401].includes(response.status));if(path==='bootstrap'||path==='feed/refresh'){const body=await response.json();assert.ok(body.events.every((e:any)=>e.source==='demo'));assert.equal(body.feed.status,'demo');}}
 assert.equal(calls.some(u=>u.includes('/offer')||u.includes('contextflow_cache')||u.includes('/functions/')),false);
 }finally{globalThis.fetch=old;}
});
