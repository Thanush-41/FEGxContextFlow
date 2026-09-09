import demoCatalog from '../fixtures/demo.json' with {type:'json'};
import type { Event, Market, Sport } from '../../shared/contracts.js';
import {enrichDemoEvent} from '../../shared/demo-details.js';
import type { CacheStore } from './store-port.js';

const BASE='https://api.psk.hr/offer';
// This submission build has no production sports-data mode.
export const HACKATHON_SAMPLE_ONLY=true;
export class Feed {
  events: Event[];
  status={status:'demo',updatedAt:new Date().toISOString(),message:'Sample data only · fictional events and credits. No production sports feed.'};
  private refreshing?: Promise<void>;
  private lastFetch=0;
  onChange=()=>{};
  lastError?:string;
  readonly enabled=false;
  constructor(private store:CacheStore, _requestedLive=false) {
    const demo=structuredClone(demoCatalog) as Event[];
    this.events = demo.map(enrichDemoEvent); // Never read cached production events in the submission build.
  }
  get(id:string) { return this.events.find(e=>e.id===id); }
  search(query='',sport?:string) {
    const terms=query.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(t=>t&&!['show','me','the','match','live','today','please','versus','vs'].includes(t));
    return this.events.filter(e=>(!sport||sport==='all'||e.sport===sport) && terms.every(t=>`${e.a} ${e.b} ${e.league} ${e.sport} ${(e.players||[]).map(p=>p.name).join(' ')}`.toLowerCase().includes(t))).slice(0,25);
  }
  async refresh(force=false) {
    if(!this.enabled)return;
    if(this.refreshing)return this.refreshing;
    if(!force&&Date.now()-this.lastFetch<20_000)return;
    this.lastFetch=Date.now();
    this.refreshing=this.load().finally(()=>{this.refreshing=undefined;});return this.refreshing;
  }
  private async json(path:string) {
    if(HACKATHON_SAMPLE_ONLY)throw new Error('Production sports requests are disabled in this build.');
    const r=await fetch(BASE+path,{signal:AbortSignal.timeout(6000),headers:{accept:'application/json','user-agent':'ContextFlow-Demo/1.0'}});
    if(!r.ok)throw new Error(`Provider HTTP ${r.status}`);return r.json();
  }
  private async load() {
    const results=await Promise.allSettled([
      this.json('/structure/api/v1_0/widget/live/fixtures'),
      this.json('/structure/api/v1_0/widget/upcoming/ufo%3Asprt%3A00/fixtures')
    ]);
    this.lastError=results.filter(r=>r.status==='rejected').map(r=>(r as PromiseRejectedResult).reason?.message||'Network unavailable').join('; ')||undefined;
    const live:Event[]=[];
    for(const r of results) if(r.status==='fulfilled') live.push(...this.map(r.value));
    if(live.length){
      const unique=[...new Map(live.map(e=>[e.id,e])).values()];
      // The offer has no scores. Obtain actual scoreboards for featured/live events;
      // unavailable scoreboards remain absent rather than generated.
      const candidates=unique.filter(e=>e.live).slice(0,12);
      for(let i=0;i<candidates.length;i+=3) await Promise.allSettled(candidates.slice(i,i+3).map(async e=>{
        try { this.score(e,await this.json(`/stats-v2/api/v2_0/fixture/${encodeURIComponent(e.id)}/scoreboard`)); } catch {}
      }));
      this.events=[...unique,...this.events.filter(e=>e.source==='demo')];
      this.store.cache('live-events',unique);
      this.status={status:'live',updatedAt:new Date().toISOString(),message:'Live offer · fictional credits. Scores update when provided.'};
    }else if(results.some(r=>r.status==='fulfilled')){
      this.events=this.events.filter(e=>e.source==='demo');this.store.cache('live-events',[]);
      this.status={status:'empty',updatedAt:new Date().toISOString(),message:'No live offer available. Fictional demo events remain available.'};
    }else this.status={...this.status,status:'offline',message:'Live feed unavailable. Cached events show their last update; demo events remain available.'};
    this.onChange();
  }
  async details(id:string) {
    const e=this.get(id);if(!e)return;
    if(this.enabled&&!HACKATHON_SAMPLE_ONLY&&e.source==='live') {
      await Promise.allSettled([
        this.json(`/stats-v2/api/v2_0/fixture/${encodeURIComponent(id)}/scoreboard`).then(d=>this.score(e,d)),
        this.json(`/markets/api/v1_0/fixture/${encodeURIComponent(id)}/markets`).then(d=>{const m=this.markets(Array.isArray(d)?d:d.markets||[],e);if(m.length){e.markets=m;e.fetchedAt=new Date().toISOString();}})
      ]);
    }
    return e;
  }
  score(e:Event,d:any) {
    const scores=d.summaryScoreboards||{};
    const values=Object.values(scores) as any[];
    const home=scores.HOME||scores.home||values[0],away=scores.AWAY||scores.away||values[1];
    if(home?.score!==undefined&&away?.score!==undefined)e.score=[String(home.score),String(away.score)];
    e.stage=d.overview?.gameTime||d.overview?.status||'Live · stage unavailable';
  }
  markets(rows:any[],e:Pick<Event,'id'|'a'|'b'>):Market[] {
    return rows.filter(m=>m.id&&m.outcomes?.length).map(m=>({id:m.id,name:m.name||'Market',options:m.outcomes.filter((o:any)=>o.id&&Number.isFinite(o.odds)&&o.odds>1).map((o:any)=>({id:o.id,eventId:e.id,marketId:m.id,market:m.name||'Market',label:o.name==='1'?e.a:o.name==='2'?e.b:o.name==='X'?'Draw':o.longName||o.name||'Outcome',odds:o.odds,previous:o.previousOdds,suspended:o.displayType!=='OPEN'}))})).filter(m=>m.options.length);
  }
  map(d:any):Event[] {
    return (d.fixtures||[]).flatMap((f:any)=>{
      const a=f.participants?.find((p:any)=>p.type==='HOME')?.name,b=f.participants?.find((p:any)=>p.type==='AWAY')?.name;if(!a||!b||!f.id)return [];
      const sp=d.sports?.find((s:any)=>s.id===f.sportId);
      const types:Record<string,Sport>={soccer:'football',basketball:'basketball',tennis:'tennis',cricket:'cricket',esports:'esports','e-sport':'esports'};
      const sport=types[sp?.type]||(f.sportId==='ufo:sprt:00'?'football':null);if(!sport)return [];
      const markets=this.markets((d.markets||[]).filter((m:any)=>m.fixtureId===f.id),{id:f.id,a,b});
      const start=new Date(f.startDatetime||Date.now());
      return [{id:f.id,sport,league:d.tournaments?.find((t:any)=>t.id===f.tournamentId)?.name||'Live offer',country:f.categorySeoName?.replaceAll('-',' ')||'International',a,b,short:[a.slice(0,3).toUpperCase(),b.slice(0,3).toUpperCase()],colors:['#9DC4FF','#A8B4D5'],score:['–','–'],stage:'Score not supplied',live:f.kind==='LIVE',suspended:f.status!=='ACTIVE'||!markets.some(m=>m.options.some(o=>!o.suspended)),odds:markets[0]?.options.map(o=>o.odds)||[],time:start.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),hours:Math.max(0,(start.getTime()-Date.now())/3600000),popularity:200-(f.sportOrder||0),source:'live' as const,sourceName:'Public sports offer',fetchedAt:new Date().toISOString(),startsAt:start.toISOString(),markets}];
    });
  }
}
