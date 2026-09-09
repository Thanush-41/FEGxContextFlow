import {build} from '../server/node_modules/esbuild/lib/main.js';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await build({stdin:{contents:"import {handle} from './server/edge/handler.ts'; Deno.serve(handle);",resolveDir:root,sourcefile:'contextflow-edge.ts',loader:'ts'},bundle:true,platform:'node',format:'esm',target:'es2022',outfile:root+'supabase/functions/contextflow-api/index.ts',external:['node:*','ws'],banner:{js:'// Generated from server/edge/handler.ts — do not edit.\nimport process from "node:process";'},plugins:[{name:'deno-ws',setup(b){b.onResolve({filter:/^ws$/},()=>({path:'npm:ws@8.21.3',external:true}))}}]});
console.log('Built ContextFlow Edge Function from the shared action engine.');
