type Job<T>={key?:string;work:()=>Promise<T>;waiters:{resolve:(v:T)=>void;reject:(e:Error)=>void}[]};
/** Preserve mutation order, coalesce pending navigation/stake edits, fail closed on disconnect. */
export class ActionQueue<T> {
  private pending:Job<T>[]=[];
  private running=false;
  enqueue(work:()=>Promise<T>,key?:string):Promise<T>{
    return new Promise((resolve,reject)=>{
      const existing=key?this.pending.find(j=>j.key===key):undefined;
      if(existing){existing.work=work;existing.waiters.push({resolve,reject});return;}
      if(this.pending.length>=12){reject(new Error('Too many pending actions. Wait for the current action or stop voice control.'));return;}
      this.pending.push({key,work,waiters:[{resolve,reject}]});void this.drain();
    });
  }
  clear(message='Pending actions cancelled. No automatic retry was queued.'){
    const jobs=this.pending.splice(0);for(const job of jobs)for(const w of job.waiters)w.reject(new Error(message));
  }
  private async drain(){
    if(this.running)return;this.running=true;
    try {while(this.pending.length){const job=this.pending.shift()!;try{const value=await job.work();for(const w of job.waiters)w.resolve(value);}catch(e){for(const w of job.waiters)w.reject(e as Error);this.clear('Connection failed. Pending actions were cancelled; check the latest state before trying again.');break;}}}
    finally{this.running=false;}
  }
}
