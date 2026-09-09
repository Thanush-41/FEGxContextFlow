import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {parse} from '../server/node_modules/dotenv/lib/main.js';
const env=parse(readFileSync(new URL('../server/.env',import.meta.url)));
const ref=new URL(env.SUPABASE_URL).hostname.split('.')[0];
const source=new DatabaseSync(new URL('../server/data/contextflow.sqlite',import.meta.url).pathname,{readOnly:true});
const quote=x=>"'"+String(x).replaceAll("'","''")+"'";
async function sql(query){const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:'POST',headers:{authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'content-type':'application/json','user-agent':'ContextFlow-Setup/1.0'},body:JSON.stringify({query}),signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`State migration HTTP ${r.status}. No private record was logged.`);return r.json();}
const sessions=source.prepare('select id,token_hash,body from sessions').all();
for(const row of sessions){const body=JSON.parse(row.body);body.review=undefined;body.status='offline';body.revision++;await sql(`insert into public.contextflow_sessions(id,token_hash,revision,body) values(${quote(row.id)},${quote(row.token_hash)},${body.revision},${quote(JSON.stringify(body))}::jsonb) on conflict(id) do nothing;`);}
const actions=source.prepare('select owner,id,fingerprint,result from actions').all();
for(let i=0;i<actions.length;i+=30){const part=actions.slice(i,i+30);await sql('insert into public.contextflow_actions(owner,id,fingerprint,result) values '+part.map(r=>`(${quote(r.owner)},${quote(r.id)},${quote(r.fingerprint)},${quote(r.result)}::jsonb)`).join(',')+' on conflict(owner,id) do nothing;');}
await sql("insert into public.contextflow_tickets(id,owner,body) select ticket->>'id',s.id,ticket from public.contextflow_sessions s cross join lateral jsonb_array_elements(s.body->'tickets') ticket on conflict(id) do nothing;");
const cached=source.prepare("select body from cache where id='live-events'").get();if(cached)await sql(`insert into public.contextflow_cache(id,body) values('live-events',${quote(cached.body)}::jsonb) on conflict(id) do nothing;`);
source.close();console.log(`Migrated ${sessions.length} demo sessions and ${actions.length} idempotency records. Existing cloud records were preserved. Local source remains available.`);
