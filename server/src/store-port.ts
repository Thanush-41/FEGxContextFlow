import type {TaskSession,ActionResult} from '../../shared/contracts.js';
export interface CacheStore { cache(id:string,body?:unknown):unknown }
export interface ActionStore {
  hash(value:string):string;
  get(id:string):TaskSession;
  save(session:TaskSession):void;
  previous(owner:string,id:string,fingerprint:string):ActionResult|undefined;
  record(owner:string,id:string,fingerprint:string,result:ActionResult):void;
  transaction<T>(fn:()=>T):T;
}
