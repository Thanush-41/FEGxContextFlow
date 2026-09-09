/** Compensate only game rounds recorded during this task's observed iPhone UI test windows. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {parse} from '../server/node_modules/dotenv/lib/main.js';
const env=parse(readFileSync('server/.env')),ref=new URL(env.SUPABASE_URL).hostname.split('.')[0];
const original=new DatabaseSync('server/data/contextflow.sqlite',{readOnly:true});
const owner=original.prepare("select id from sessions where id like '2267fd%'").get()?.id;original.close();if(!owner)throw new Error('Original iPhone demo task unavailable.');
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
async function query(sql){const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{authorization:'Bearer '+env.SUPABASE_ACCESS_TOKEN,'user-agent':'ContextFlow-Setup/1.0','content-type':'application/json'},body:JSON.stringify({query:sql}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error(`QA cleanup HTTP ${r.status}`);return r.json();}
const windows=[];
for(const file of ['/tmp/contextflow-ios-edge-regression.log','/tmp/contextflow-ios-queue-resolved.log','/tmp/contextflow-ios-cloud-final.log']){
 const log=readFileSync(file,'utf8');const part=log.split("testCasinoAndArena]' started.")[1]?.split("testCasinoAndArena]' ")[0];if(!part)continue;
 const start=part.match(/Start Test at (\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d+)/)?.[1];const seconds=log.match(/testCasinoAndArena\]' (?:passed|failed) \(([\d.]+) seconds\)/)?.[1];
 if(start&&seconds){const from=new Date(start.replace(' ','T')+'+05:30');windows.push([from.toISOString(),new Date(from.getTime()+(Number(seconds)+1)*1000).toISOString()]);}
}
const predicate=windows.map(([a,b])=>`created_at between ${quote(a)} and ${quote(b)}`).join(' or ');
const rows=await query(`with history as (select id,created_at,result,coalesce((result#>>'{session,spentMinor}')::int,0)-coalesce(lag((result#>>'{session,spentMinor}')::int) over(order by (result#>>'{session,revision}')::int),0) spend,coalesce((result#>>'{session,gamePointsMinor}')::int,50000)-coalesce(lag(coalesce((result#>>'{session,gamePointsMinor}')::int,50000)) over(order by (result#>>'{session,revision}')::int),50000) points from contextflow_actions where owner=${quote(owner)}) select id,spend,points from history where result#>>'{session,lastGame,id}'=id and (${predicate}) order by created_at`);
const spend=rows.reduce((n,r)=>n+r.spend,0),points=rows.reduce((n,r)=>n+r.points,0);
console.log({testWindows:windows.length,identifiedGameRounds:rows.length,demoSpentToRestore:spend/100,gamePointsAdjustment:-points/100});
if(process.argv.includes('--apply')){
 if(rows.length!==5||spend!==5000)throw new Error('The expected five QA rounds did not match. No state changed.');
 const id='qa-compensation-20260909-voice-edge',fingerprint=createHash('sha256').update(JSON.stringify(rows)).digest('hex');
 const old=await query(`select id from contextflow_actions where owner=${quote(owner)} and id=${quote(id)}`);if(old.length){console.log('QA compensation already recorded.');process.exit(0);}
 const [row]=await query(`select body from contextflow_sessions where id=${quote(owner)}`);const s=row.body,revision=s.revision;
 s.spentMinor-=spend;s.gamePointsMinor=(s.gamePointsMinor??50000)-points;s.revision++;s.updatedAt=new Date().toISOString();s.review=undefined;s.status='ended';s.route='live';s.lastAction='QA game usage restored. Your spending limit is unchanged.';
 if(s.spentMinor<0||s.gamePointsMinor<0)throw new Error('Unexpected balance; no state changed.');
 const result={version:1,actionId:id,revision:s.revision,outcome:'completed',message:s.lastAction,session:s,snapshot:{version:1,sessionId:s.id,revision:s.revision,status:s.status,title:'ContextFlow',score:'',stage:'',lastAction:s.lastAction,selectionCount:s.slip.selections.length,updatedAt:s.updatedAt},qaCompensation:{actionIds:rows.map(r=>r.id),spendMinor:spend,gamePointsMinor:-points}};
 const [commit]=await query(`select contextflow_commit(${quote(owner)}::uuid,${revision},${quote(id)},${quote(fingerprint)},${quote(JSON.stringify(result))}::jsonb) result`);if(commit.result.conflict)throw new Error('Task changed during cleanup; retry after reviewing state.');
 writeFileSync('artifacts/qa-compensation.json',JSON.stringify({at:new Date().toISOString(),gameRounds:rows.length,restoredSpending:spend/100,limitUnchanged:s.limitMinor/100,walletUnchanged:s.walletMinor/100,recorded:true},null,2));console.log('Recorded an atomic QA compensation; original receipts, wallet and spending limit are unchanged.');
}
