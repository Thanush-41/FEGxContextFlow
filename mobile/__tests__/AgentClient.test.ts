import {AgentClient} from '../src/agent';
jest.mock('react-native',()=>({NativeModules:{},Platform:{OS:'ios'},NativeEventEmitter:class{}}));
const state=(revision:number,route='live')=>({id:'same-session',revision,route}) as any;
const response=(body:any)=>({ok:true,json:async()=>body}) as Response;
it('awaits a pending bootstrap even when a saved token is already present',async()=>{
 const client=new AgentClient();client.token='saved';let release!:(r:Response)=>void;
 globalThis.fetch=jest.fn().mockImplementationOnce(()=>new Promise<Response>(r=>release=r)).mockResolvedValue(response({session:state(2,'casino')}));
 const connecting=client.connect();const action=client.action('navigate',{route:'casino'});
 await Promise.resolve();expect(fetch).toHaveBeenCalledTimes(1);
 release(response({token:'saved',session:state(1),events:[],feed:{status:'demo'}}));
 await connecting;await action;expect(fetch).toHaveBeenCalledTimes(2);expect(client.session?.route).toBe('casino');
});
it('a delayed bootstrap cannot overwrite a newer streamed state',async()=>{
 const client=new AgentClient();let release!:(r:Response)=>void;
 globalThis.fetch=jest.fn(()=>new Promise<Response>(r=>release=r));const connecting=client.connect();
 client.accept({result:{session:state(8,'game')} as any});
 release(response({token:'saved',session:state(6),events:[],feed:{status:'demo'}}));await connecting;
 expect(client.session?.revision).toBe(8);expect(client.session?.route).toBe('game');
});
it('ignores a late packet belonging to a previous demo session even if its revision is higher',()=>{
 const client=new AgentClient();client.session=state(2);
 client.accept({result:{session:{...state(900,'event'),id:'old-session'}} as any});
 expect(client.session?.id).toBe('same-session');expect(client.session?.route).toBe('live');
});
