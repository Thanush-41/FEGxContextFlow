import {readFileSync,writeFileSync,mkdirSync,chmodSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {parse} from '../server/node_modules/dotenv/lib/main.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const mobile=existsSync(root+'mobile/.env')?parse(readFileSync(root+'mobile/.env')):{},server=parse(readFileSync(root+'server/.env'));
const config={...server,SUPABASE_URL:server.SUPABASE_URL||mobile.CASINO_SUPABASE_URL,SUPABASE_ACCESS_TOKEN:server.SUPABASE_ACCESS_TOKEN||mobile.ACCESS_TOKEN_SECRET};
const ref=new URL(config.SUPABASE_URL).hostname.split('.')[0];
if(!/^[a-z]{20}$/.test(ref)||!config.SUPABASE_ACCESS_TOKEN?.startsWith('sbp_'))throw new Error('Valid project URL and deployment access token required.');
const secrets=Object.values({...mobile,...server,...config}).filter(x=>x.length>15);
function redacted(text){for(const value of secrets)text=text.replaceAll(value,'[redacted]');return text;}
async function management(path,data,method='POST'){
 const form=data instanceof FormData;
 const response=await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`,{method,headers:{authorization:`Bearer ${config.SUPABASE_ACCESS_TOKEN}`,'user-agent':'ContextFlow-Setup/1.0',...(form?{}:{'content-type':'application/json'})},...(data===undefined?{}:{body:form?data:JSON.stringify(data)}),signal:AbortSignal.timeout(60000)});
 const text=await response.text();if(!response.ok)throw new Error(`Supabase ${path}: HTTP ${response.status} ${redacted(text).slice(0,1000)}`);return text?JSON.parse(text):null;
}
// Persist only in ignored server configuration, without echoing any credential.
for(const [name,value] of Object.entries(config))if(!(name in server))server[name]=value;
writeFileSync(root+'server/.env',Object.entries(server).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n',{mode:0o600});chmodSync(root+'server/.env',0o600);
await management('',undefined,'GET');console.log('Verified deployment access to the configured project.');
if(!process.argv.includes('--function-only')){
 await management('/database/query',{query:readFileSync(root+'supabase/migrations/202609090001_contextflow.sql','utf8')});console.log('Applied ContextFlow tables, RLS, rate limits and atomic receipt transaction.');
 await management('/secrets',['AZURE_OPENAI_ENDPOINT','AZURE_OPENAI_API_KEY','AZURE_OPENAI_REALTIME_DEPLOYMENT'].map(name=>({name,value:config[name]})));console.log('Configured Azure secrets in the Edge runtime.');
}
const form=new FormData();form.append('metadata',JSON.stringify({name:'ContextFlow API',entrypoint_path:'index.ts',verify_jwt:false}));form.append('file',new Blob([readFileSync(root+'supabase/functions/contextflow-api/index.ts')],{type:'application/typescript'}),'index.ts');
const deployed=await management('/functions/deploy?slug=contextflow-api',form);
const url=config.SUPABASE_URL+'/functions/v1/contextflow-api';
mkdirSync(root+'artifacts',{recursive:true});writeFileSync(root+'artifacts/supabase-deployment.json',JSON.stringify({at:new Date().toISOString(),slug:deployed.slug,version:deployed.version,status:deployed.status,baseUrl:url},null,2));
console.log(`Deployed ${deployed.slug}, version ${deployed.version}, status ${deployed.status}.`);
