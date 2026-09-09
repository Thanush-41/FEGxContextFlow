import type {Event, Sport} from './contracts.js';

export type EventFilter={sport:Sport;period:string;query?:string};
/** One ordering for the visible list and voice references such as “the first match”. */
export function visibleEvents<T extends Pick<Event,'sport'|'live'|'hours'|'a'|'b'|'league'>>(events:T[],filter:EventFilter){
 const terms=(filter.query||'').toLowerCase().trim().split(/\s+/).filter(Boolean);
 return events.filter(e=>(filter.sport==='all'||e.sport===filter.sport)
  &&(filter.period==='live'?e.live:filter.period==='3h'?!e.live&&e.hours<=3:e.hours<24)
  &&terms.every(t=>`${e.a} ${e.b} ${e.league} ${e.sport}`.toLowerCase().includes(t)));
}
export function navigationRequest(input:string):EventFilter|undefined{
 const t=input.toLowerCase().replace(/[.!?]+$/,'').trim();
 if(!/^(?:please )?(?:show|list|browse|find|open|take me to|go to)\b/.test(t))return;
 if(!/\b(?:matches|games|events|live|today|football|cricket|basketball|tennis|esports)\b/.test(t))return;
 if(/\b(?:first|second|third|fourth|stats|statistics|odds|markets|win|draw|bet|stake)\b/.test(t))return;
 const sport=(['football','cricket','basketball','tennis','esports'] as Sport[]).find(s=>t.includes(s))||'all';
 let rest=t.replace(/\b(?:please|show|list|browse|find|open|take|me|to|go|all|the|out|matches|match|games|events|event|that|are|is|happening|currently|right|now|live|today|todays|for|in|next|three|3|hours|hour|football|cricket|basketball|tennis|esports)\b/g,'').replace(/['’]/g,'').trim();
 return {sport,period:/\b(?:live|currently|now)\b/.test(t)?'live':/\b(?:three|3) hours?\b/.test(t)?'3h':'today',query:rest||undefined};
}
