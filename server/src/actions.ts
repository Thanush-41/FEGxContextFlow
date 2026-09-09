import { randomInt, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Action, ActionResult, ActionSnapshot, ContextHandoff, Pick, TaskSession, Totals } from '../../shared/contracts.js';
import type { ActionStore } from './store-port.js';
import {decideDelivery,eligible,eligibilityRecord,normalizeSession} from '../../shared/safeguards.js';
import {navigationRequest,visibleEvents} from '../../shared/event-navigation.js';
import { Feed } from './feed.js';
import { ActionSchema, ContextHandoffSchema } from '../../shared/schemas.js';
export { ActionSchema } from '../../shared/schemas.js';

const text=z.string().trim().min(1).max(200);
export const HandoffSchema=ContextHandoffSchema;
const routes=new Set(['live','today','sports','sport','event','search','slip','success','casino','menu','arena','wallet','history','openbets','responsible','reminders','notifications','settings','appearance','profile','promotions','odds','help','support','privacy','terms','exclusion','open','game']);
const money=(n:number)=>Number(n.toFixed(2));
export function calculate(selections:Pick[],stakeMinor:number,mode:'single'|'accumulator'):Totals {
  const stake=stakeMinor/100,totalOdds=selections.reduce((n,p)=>n*p.odds,1);
  const totalStake=mode==='single'?money(stake*selections.length):stake;
  const estimatedReturn=selections.length?money(stake*(mode==='single'?selections.reduce((n,p)=>n+p.odds,0):totalOdds)):0;
  return {stake,totalStake,totalOdds,estimatedReturn,profit:selections.length?money(estimatedReturn-totalStake):0,bonus:0};
}
export class Actions {
  onChange=(_result:ActionResult)=>{};
  constructor(readonly store:ActionStore,readonly feed:Feed) {}
  snapshot(s:TaskSession):ActionSnapshot {
    const e=s.eventId?this.feed.get(s.eventId):undefined;
    return {version:1,sessionId:s.id,revision:s.revision,status:s.status,title:e?`${e.a} · ${e.b}`:'ContextFlow voice',score:e?.score.join(' – ')||'',stage:e?.stage||'',lastAction:s.lastAction,selectionCount:s.slip.selections.length,review:s.review?.dialog,receipt:s.route==='success'?s.tickets[0]?.id:undefined,optionalAlert:s.deliveryDecisions?.at(-1),updatedAt:s.updatedAt};
  }
  result(s:TaskSession,id:string,outcome:ActionResult['outcome']='completed'):ActionResult { return {version:1,actionId:id,revision:s.revision,outcome,message:s.lastAction,session:s,snapshot:this.snapshot(s)}; }
  execute(owner:string,raw:unknown,origin:'touch'|'tool'|'voice'|'handoff'='touch'):ActionResult {
    const a=ActionSchema.parse(raw),fp=this.store.hash(JSON.stringify({...a,origin}));
    const cached=this.store.previous(owner,a.id,fp);
    if(cached)return {...cached,session:this.store.get(owner),snapshot:this.snapshot(this.store.get(owner))};
    const result=this.store.transaction(()=>{
      const s=normalizeSession(this.store.get(owner));
      if(a.expectedRevision!==undefined&&a.expectedRevision!==s.revision)throw new Error('Your session changed. Review the latest state and try again.');
      this.updatePrices(s);
      const outcome=this.dispatch(s,a,origin);
      s.revision++;s.updatedAt=new Date().toISOString();
      s.slip.totals=calculate(s.slip.selections,s.slip.stakeMinor,s.slip.mode);
      this.store.save(s);const r=this.result(s,a.id,outcome);this.store.record(owner,a.id,fp,r);return r;
    });
    this.onChange(result);return result;
  }
  private edit(s:TaskSession) { s.review=undefined;s.slip.version++; if(s.status==='review')s.status='listening'; }
  updatePrices(s:TaskSession) {
    let changed=false;
    s.slip.selections=s.slip.selections.map(p=>{
      const e=this.feed.get(p.eventId),current=e?.markets.flatMap(m=>m.options).find(o=>o.id===p.id);
      if(!current||e?.suspended){if(!p.suspended)changed=true;return {...p,suspended:true};}
      if(current.odds!==p.odds||!!current.suspended!==!!p.suspended){changed=true;return {...p,odds:current.odds,previous:p.previous??p.odds,changed:p.changed||current.odds!==p.odds,suspended:current.suspended};}
      return p;
    });
    if(changed)this.edit(s);
  }
  private pick(id:string,eventId?:string):Pick {
    const list=eventId?[this.feed.get(eventId)]:this.feed.events;
    const e=list.find(e=>e?.markets.some(m=>m.options.some(p=>p.id===id)));
    const p=e?.markets.flatMap(m=>m.options).find(p=>p.id===id);
    if(!p||!e)throw new Error('This selection is no longer available.');
    if(p.suspended||e.suspended)throw new Error('This market is suspended.');
    return {...p,changed:false,previous:undefined};
  }
  private assertEligible(s:TaskSession){if(!eligible(eligibilityRecord(s.eligibility?.profileId||'unknown')))throw new Error('Demo play unavailable: synthetic age or exclusion record does not permit play. Voice cannot override this record.');}
  private add(s:TaskSession,p:Pick) {
    this.assertEligible(s);
    if(s.slip.selections.some(x=>x.id===p.id))return;
    if(s.slip.selections.some(x=>x.eventId===p.eventId))throw new Error('One selection per event. Ask me to remove the existing selection first.');
    if(s.slip.selections.length>=20)throw new Error('A demo slip supports up to 20 selections.');
    this.edit(s);s.slip.selections.push(p);s.eventId=p.eventId;
  }
  private dispatch(s:TaskSession,a:Action,origin:string):ActionResult['outcome'] {
    const p=a.payload||{};
    if(['select_outcome','copy_selections','set_stake','set_mode','accept_odds','prepare_bet','confirm_bet','play_game'].includes(a.type))this.assertEligible(s);
    if(!s.pendingContext&&['navigate','set_stake','select_outcome','remove_selection','clear_slip'].includes(a.type))s.unresolvedQuestion=undefined;
    switch(a.type) {
      case 'demo_profile': {
        if(origin!=='touch')throw new Error('Synthetic profiles can only be selected in the on-screen test controls. Voice cannot override eligibility.');
        s.eligibility=eligibilityRecord(z.enum(['unknown','eligible-adult','unverified','underage','at-risk','self-excluded']).parse(p.profileId));
        this.edit(s);s.lastAction=`Synthetic register: ${s.eligibility.profileId}. No real identity verification.`;break;
      }
      case 'notification_preferences': {
        if(origin!=='touch')throw new Error('Change notification consent in the on-screen preferences.');
        const value=z.object({optionalConsent:z.boolean(),timeZone:z.string().max(80)}).strict().parse(p);
        try{new Intl.DateTimeFormat('en',{timeZone:value.timeZone}).format()}catch{throw new Error('Use the current device time zone.');}
        s.notificationPreferences={...s.notificationPreferences!,...value,consentUpdatedAt:new Date().toISOString()};
        s.lastAction=value.optionalConsent?'Optional alerts enabled. Quiet hours and delivery caps apply.':'Optional alerts off. Pending optional alerts are discarded.';break;
      }
      case 'record_instruction': {
        if(origin==='tool'||origin==='handoff')throw new Error('Only user input can update the instruction context.');
        s.lastInstruction=z.string().max(4000).parse(p.text);break;
      }
      case 'preview_alert': {
        if(origin!=='touch')throw new Error('Alert previews use the on-screen test control.');
        const now=Date.now();const eventId=text.parse(p.eventId);
        if(!this.feed.get(eventId))throw new Error('Sample event unavailable.');
        const decision=decideDelivery(s,{id:a.id,kind:'optional_event',eventId,createdAt:new Date(now).toISOString(),expiresAt:new Date(now+120000).toISOString()},now);
        s.deliveryDecisions=[...(s.deliveryDecisions||[]).filter(d=>now-Date.parse(d.decidedAt)<7*86400000),decision];
        s.lastAction=`Optional alert ${decision.allowed?'allowed':'suppressed'}: ${decision.reason.replaceAll('_',' ')}. ${decision.allowed?'A delivery attempt is reserved; device permission still applies.':''}`;break;
      }
      case 'play_game': {
        if(origin!=='touch')throw new Error('Casino games require their on-screen demo controls.');
        if(s.paused)throw new Error('Demo play is paused.');
        const game=z.enum(['dice','cards','rocket']).parse(p.gameId),stake=z.number().int().min(100).max(5000).parse(p.stakeMinor);
        if(stake%100)throw new Error('Use whole game points.');
        s.gamePointsMinor ??= 50000;
        if(stake>s.gamePointsMinor)throw new Error('Not enough game points.');
        if(s.spentMinor+stake>s.limitMinor)throw new Error('This exceeds your spending limit.');
        let symbol='',prefix='',multiplier=0;
        if(game==='dice'){const n=randomInt(1,7);symbol=['⚀','⚁','⚂','⚃','⚄','⚅'][n-1];prefix=`Rolled ${n}.`;multiplier=n>=4?1.8:0;}
        else if(game==='cards'){const n=randomInt(1,14);symbol=['A','2','3','4','5','6','7','8','9','10','J','Q','K'][n-1]+' ♧';prefix=`Drew ${symbol}.`;multiplier=n>=8?2:0;}
        else {const n=[1,1.2,1.5,2,3][randomInt(5)];symbol=n.toFixed(2)+'×';prefix=n===1?'Flight ended at launch.':'Flight complete.';multiplier=n===1?0:n;}
        const payout=Math.round(stake*multiplier);s.gamePointsMinor+=payout-stake;s.spentMinor+=stake;
        s.lastGame={id:a.id,game,symbol,message:`${prefix} ${payout?(payout/100).toFixed(2)+' GP returned · '+((payout-stake)/100).toFixed(2)+' GP net.':'No return. '+stake/100+' GP used.'}`};
        s.lastAction=s.lastGame.message;break;
      }
      case 'refresh_state': {
        s.watchScores ||= {};
        for(const id of s.watchEvents||[]){const e=this.feed.get(id);if(!e)continue;const score=e.score.join(' – ');const previous=s.watchScores[id];s.watchScores[id]=score;if(previous&&previous!==score){
          const now=Date.now(),decision=decideDelivery(s,{id:`score-${id}-${score}-${e.fetchedAt}`,kind:'optional_event',eventId:id,createdAt:new Date(now).toISOString(),expiresAt:new Date(now+120000).toISOString()},now);
          s.deliveryDecisions=[...(s.deliveryDecisions||[]).filter(d=>now-Date.parse(d.decidedAt)<7*86400000),decision];
          s.lastAction=`Score update: ${e.a} ${score} ${e.b}. Fictional demo event. Optional alert: ${decision.reason.replaceAll('_',' ')}.`;
        }}
        break;
      }
      case 'watch_event': {
        const id=text.parse(p.eventId);if(!this.feed.get(id))throw new Error('Event unavailable.');s.watchEvents ||= [];const enabled=p.enabled===undefined?!s.watchEvents.includes(id):z.boolean().parse(p.enabled);if(enabled)this.assertEligible(s);s.watchEvents=enabled?[...new Set([...s.watchEvents,id])]:s.watchEvents.filter(x=>x!==id);s.watchScores||={};s.watchScores[id]=this.feed.get(id)!.score.join(' – ');s.lastAction=enabled?'Following score changes while connected. No bets will be placed automatically.':'Match alerts stopped.';break;
      }
      case 'show_events': {
        s.sport=z.enum(['all','football','cricket','basketball','tennis','esports']).parse(p.sport||'all');
        s.period=z.enum(['live','today','3h']).parse(p.period||'live');
        s.eventQuery=z.string().max(200).parse(p.query||'');s.listRevision=(s.listRevision||0)+1;
        s.route='live';s.eventId=undefined;s.unresolvedQuestion=undefined;
        const list=visibleEvents(this.feed.events,{sport:s.sport,period:s.period,query:s.eventQuery});
        s.lastAction=list.length?`Showing ${list.length} ${s.period==='live'?'live ':''}${list.every(e=>e.source==='demo')?'sample ':''}matches${s.eventQuery?' for '+s.eventQuery:''}.`:`No ${s.period==='live'?'live ':''}matches found${s.eventQuery?' for '+s.eventQuery:''}. Try another team or time.`;
        break;
      }
      case 'navigate': {
        const route=text.parse(p.route);if(!routes.has(route))throw new Error('Unsupported destination.');
        if(p.eventId){const e=this.feed.get(text.parse(p.eventId));if(!e)throw new Error('Event unavailable.');s.eventId=e.id;}
        if(route==='event'&&!s.eventId)throw new Error('Choose a match to open.');
        s.route=route;
        if(['live','today','sports','sport'].includes(route))s.eventQuery='';
        if(route==='live'&&!p.sport&&!p.period){s.sport='all';s.period='live';}
        if(p.view)s.eventView=z.enum(['Popular','All markets','Goals & points','Players','Combos','Stats','Line-ups']).parse(p.view);
        if(p.sport)s.sport=z.enum(['all','football','cricket','basketball','tennis','esports']).parse(p.sport);
        if(p.period)s.period=z.enum(['live','today','3h']).parse(p.period);
        s.lastAction=route==='event'?`Opened ${this.feed.get(s.eventId!)?.a} vs ${this.feed.get(s.eventId!)?.b}.`:`Opened ${route}.`;break;
      }
      case 'select_outcome':this.add(s,this.pick(text.parse(p.selectionId),p.eventId as string));s.lastAction=`Added ${s.slip.selections.at(-1)?.label} to your slip.`;break;
      case 'remove_selection': {
        const id=p.selectionId?text.parse(p.selectionId):s.slip.selections[z.number().int().min(1).parse(p.position)-1]?.id;
        if(!id)throw new Error('Which selection should I remove?');
        this.edit(s);s.slip.selections=s.slip.selections.filter(x=>x.id!==id);s.lastAction='Selection removed.';break;
      }
      case 'copy_selections': {
        const ids=z.array(text).min(1).max(20).parse(p.selectionIds);
        const picks=ids.map(id=>this.pick(id));for(const pick of picks)this.add(s,pick);
        s.lastAction=`Added ${picks.length} reviewed selections. No demo bet has been placed.`;break;
      }
      case 'clear_slip':this.edit(s);s.slip.selections=[];s.lastAction='Your slip is clear.';break;
      case 'set_stake':this.edit(s);s.slip.stakeMinor=z.number().int().min(1).max(1_000_000).parse(p.stakeMinor);s.lastAction=`Stake set to ${(s.slip.stakeMinor/100).toFixed(2)} demo credits${s.slip.mode==='single'?' per selection':''}.`;break;
      case 'set_mode':this.edit(s);s.slip.mode=z.enum(['single','accumulator']).parse(p.mode);s.lastAction=`Slip changed to ${s.slip.mode}.`;break;
      case 'accept_odds':this.edit(s);s.slip.selections=s.slip.selections.map(x=>({...x,changed:false,previous:undefined}));s.lastAction='Current odds accepted. Review the slip before placing.';break;
      case 'favorite': {
        const id=text.parse(p.eventId);s.favorites=s.favorites.includes(id)?s.favorites.filter(x=>x!==id):[...s.favorites,id];s.lastAction='Favorites updated.';break;
      }
      case 'settings': {
        if(p.limitMinor!==undefined)s.limitMinor=z.number().int().min(0).max(1_000_000).parse(p.limitMinor);
        if(p.paused!==undefined)s.paused=z.boolean().parse(p.paused);
        if(p.reminderMinutes!==undefined){s.reminderMinutes=z.number().int().min(0).max(120).parse(p.reminderMinutes);s.reminderStartedAt=new Date().toISOString();}
        this.edit(s);s.lastAction=s.paused?'Demo play paused.':'Responsible-play controls updated.';break;
      }
      case 'prepare_bet': {
        this.validate(s);s.slip.totals=calculate(s.slip.selections,s.slip.stakeMinor,s.slip.mode);
        const selections=s.slip.selections.map((x,i)=>{const e=this.feed.get(x.eventId);return `${i+1}. ${e?.a} versus ${e?.b}. ${x.market}: ${x.label}, odds ${x.odds.toFixed(2)}.`;}).join(' ');
        const dialog=`Demo bet review. ${s.slip.mode}. ${selections} Total stake ${s.slip.totals.totalStake.toFixed(2)} demo credits. Estimated return ${s.slip.totals.estimatedReturn.toFixed(2)} demo credits. No real money. To place this exact demo bet, say Confirm demo bet. You can also change or cancel it.`;
        s.review={id:randomUUID(),slipVersion:s.slip.version,digest:this.store.hash(JSON.stringify(s.slip)),expiresAt:new Date(Date.now()+120_000).toISOString(),dialog,readbackComplete:false};s.status='review';s.route='slip';s.lastAction='Review ready. Your confirmation is required.';return 'review';
      }
      case 'review_read': {
        if(origin==='tool'||origin==='handoff')throw new Error('Only the native review renderer can acknowledge readback.');
        if(!s.review||s.review.id!==p.reviewId||Date.parse(s.review.expiresAt)<Date.now())throw new Error('The review changed or expired.');
        s.review.readbackComplete=true;s.review.expiresAt=new Date(Date.now()+30000).toISOString();s.lastAction='Listening for your confirmation or changes.';break;
      }
      case 'confirm_bet': {
        if(origin!=='voice'&&origin!=='touch')throw new Error('The user must confirm this demo bet.');
        if(origin==='voice'&&String(p.utterance).toLowerCase().replace(/[.!?,]/g,'').trim()!=='confirm demo bet')throw new Error('Say Confirm demo bet to confirm, or describe a change.');
        const r=s.review;if(!r||r.id!==p.reviewId||r.consumed||r.slipVersion!==s.slip.version||Date.parse(r.expiresAt)<Date.now())throw new Error('The review expired or changed. Please review your slip again.');
        if(origin==='voice'&&!r.readbackComplete)throw new Error('Wait until the full review has been read.');
        this.validate(s);s.slip.totals=calculate(s.slip.selections,s.slip.stakeMinor,s.slip.mode);
        if(r.digest!==this.store.hash(JSON.stringify(s.slip)))throw new Error('Your slip changed. A new review is required.');
        const t=s.slip.totals,ticket={id:`CF-${randomUUID().slice(0,8).toUpperCase()}`,selections:structuredClone(s.slip.selections),mode:s.slip.mode,totalStake:t.totalStake,estimatedReturn:t.estimatedReturn,totalOdds:t.totalOdds,placedAt:new Date().toISOString(),demoOnly:true as const};
        s.walletMinor-=Math.round(t.totalStake*100);s.spentMinor+=Math.round(t.totalStake*100);s.tickets.unshift(ticket);s.slip.selections=[];this.edit(s);s.route='success';s.lastAction=`Demo bet placed. Receipt ${ticket.id}. ${t.totalStake.toFixed(2)} demo credits used. Balance ${(s.walletMinor/100).toFixed(2)}.`;break;
      }
      case 'session_status': {
        if(origin==='tool')throw new Error('Session status is controlled by the device.');
        s.status=z.enum(['idle','connecting','listening','thinking','speaking','review','paused','offline','ended']).parse(p.status);
        if(['paused','offline','ended'].includes(s.status))s.review=undefined;
        if(s.status==='ended')s.lastAction='Voice ended. Your task is saved.';break;
      }
      case 'cancel':s.review=undefined;s.unresolvedQuestion=undefined;s.pendingContext=undefined;s.lastAction='Cancelled. Nothing was placed.';s.status='listening';break;
      case 'command':return this.command(s,z.string().max(4000).parse(p.text));
      case 'handoff': {
        const h=HandoffSchema.parse(p);if(h.sessionId&&h.sessionId!==s.id)throw new Error('This handoff belongs to a different session.');
        if(s.review||s.unresolvedQuestion){s.pendingContext=h;s.unresolvedQuestion='New research arrived. Continue with it and cancel the pending review?';s.lastAction=s.unresolvedQuestion;return 'clarification';}
        if(Date.now()-Date.parse(h.createdAt)>30*60_000){s.pendingContext=h;s.unresolvedQuestion='This handoff is over 30 minutes old. Use it as background context with current prices?';s.lastAction=s.unresolvedQuestion;return 'clarification';}
        s.context=h;return this.command(s,h.instruction,true);
      }
      case 'accept_context': {
        if(!s.pendingContext)throw new Error('There is no pending context.');
        s.review=undefined;s.context=s.pendingContext;s.pendingContext=undefined;s.unresolvedQuestion=undefined;return this.command(s,s.context.instruction,true);
      }
      default:throw new Error('Unsupported action.');
    }
    return 'completed';
  }
  validate(s:TaskSession) {
    this.assertEligible(s);
    const t=calculate(s.slip.selections,s.slip.stakeMinor,s.slip.mode);
    if(s.paused)throw new Error('Demo play is paused.');
    if(!Number.isSafeInteger(s.slip.stakeMinor)||s.slip.stakeMinor<1||s.slip.stakeMinor>1_000_000)throw new Error('Use a stake between 0.01 and 10,000 demo credits.');
    if(!s.slip.selections.length)throw new Error('Add a selection first.');
    if(s.slip.selections.some(x=>x.suspended))throw new Error('A selected market is suspended or unavailable.');
    if(s.slip.selections.some(x=>x.changed))throw new Error('Odds changed. Accept the new prices and review again.');
    for(const p of s.slip.selections){const e=this.feed.get(p.eventId);if(e?.source==='live'&&Date.now()-Date.parse(e.fetchedAt)>120_000)throw new Error('Live prices are stale. Refresh before placing a demo bet.');}
    if(Math.round(t.totalStake*100)>s.walletMinor)throw new Error('Not enough demo credits.');
    if(Math.round(t.totalStake*100)+s.spentMinor>s.limitMinor)throw new Error('This exceeds your spending limit.');
  }
  private command(s:TaskSession,input:string,received=false):ActionResult['outcome'] {
    s.lastInstruction=input;
    const t=input.toLowerCase().trim();
    const listRequest=navigationRequest(input);
    if(listRequest)return this.dispatch(s,{id:'internal',type:'show_events',payload:listRequest},'voice');
    if(/^(?:show|open|go to|take me to) (?:the )?(?:home(?: page)?|first page)[.!]?$/.test(t))return this.dispatch(s,{id:'internal',type:'show_events',payload:{}},'voice');
    if(/^(?:please )?(?:open|show|launch|go to)\b.*\b(?:instagram|facebook|whatsapp|youtube)\b/.test(t)){s.lastAction='I can control ContextFlow screens. Use Siri to open another app.';s.unresolvedQuestion=s.lastAction;return 'clarification';}
    const ordinal=t.match(/^(?:please )?(?:open|show|select|go to) (?:the )?(first|second|third|fourth|\d+)(?: (?:live )?(?:match|event|game|one))?[.!]?$/);
    if(ordinal){
      const position=({first:1,second:2,third:3,fourth:4} as Record<string,number>)[ordinal[1]]||Number(ordinal[1]);
      const event=visibleEvents(this.feed.events,{sport:s.sport,period:s.period,query:s.eventQuery})[position-1];
      if(!event){s.lastAction='That match is not in the current list. Choose a visible match.';s.unresolvedQuestion=s.lastAction;return 'clarification';}
      return this.dispatch(s,{id:'internal',type:'navigate',payload:{route:'event',eventId:event.id,view:'Popular'}},'voice');
    }
    if(/^(cancel|stop that|never mind)[.!]?$/.test(t)){s.review=undefined;s.lastAction='Cancelled. Nothing was placed.';return 'completed';}
    if(s.pendingContext&&/^(continue|use the new research|yes)[.!]?$/.test(t))return this.dispatch(s,{id:'internal',type:'accept_context'},'voice');
    if(/remove (?:the )?(first|second|third|\d+)(?: selection| pick)?/.test(t)){
      const m=t.match(/remove (?:the )?(first|second|third|\d+)/)!;return this.dispatch(s,{id:'internal',type:'remove_selection',payload:{position:({first:1,second:2,third:3} as any)[m[1]]||Number(m[1])}},'voice');
    }
    const nwords:Record<string,number>={one:1,two:2,three:3,four:4,five:5,ten:10,twenty:20,fifty:50,hundred:100};
    const amount=t.match(/(?:stake(?: of)?|with|to|for)\s*(\d+(?:\.\d{1,2})?|one|two|three|four|five|ten|twenty|fifty|hundred)(?:\s*(?:demo )?(?:credits|dco|dc))?/);
    const stakeOnly=/^(?:change (?:that|the stake)|set (?:my )?stake|stake)/.test(t);
    if(stakeOnly&&amount)return this.dispatch(s,{id:'internal',type:'set_stake',payload:{stakeMinor:Math.round((nwords[amount[1]]||Number(amount[1]))*100)}},'voice');
    const placement=/\b(?:place|submit)\b.*\b(?:bet|it|that)\b/.test(t);
    if(placement&&!/\b(?:home|away) (?:win|winner)\b|\bdraw\b/.test(t)){
      if(!s.slip.selections.length||(s.eventId&&!s.slip.selections.some(p=>p.eventId===s.eventId))){s.unresolvedQuestion='Which outcome would you like for this match: home win, away win, or another market?';s.lastAction=s.unresolvedQuestion;return 'clarification';}
      if(amount)this.dispatch(s,{id:'internal',type:'set_stake',payload:{stakeMinor:Math.round((nwords[amount[1]]||Number(amount[1]))*100)}},'voice');
      return this.dispatch(s,{id:'internal',type:'prepare_bet'},'voice');
    }
    if(/(?:review|what.?s in|show).*slip|prepare.*bet/.test(t))return this.dispatch(s,{id:'internal',type:t.includes('review')||t.includes('prepare')?'prepare_bet':'navigate',payload:{route:'slip'}},'voice');
    if(/show (?:the )?stat/.test(t)&&s.eventId){s.route='event';s.eventView='Stats';s.lastAction=this.feed.get(s.eventId)?.statistics?'Opened available match statistics.':'Opened the match. Detailed statistics are not supplied by this feed.';return 'completed';}
    const sp=['football','cricket','basketball','tennis','esports'].find(sp=>t.includes(sp));
    if(/(?:show|browse|open).*live/.test(t)&&sp){s.sport=sp as TaskSession['sport'];s.route='live';s.period='live';s.lastAction=`Showing live ${sp}.`;return 'completed';}
    const destination=t.match(/^(?:show|open|go to|take me to|browse) (?:my |the )?(live|today|sports|wallet|menu|settings|history|notifications|arena|responsible gaming)[.!]?$/);
    if(destination)return this.dispatch(s,{id:'internal',type:'navigate',payload:{route:destination[1]==='responsible gaming'?'responsible':destination[1]}},'voice');
    if(/^(?:clear|empty|remove all (?:from )?)(?: my| the)?(?: slip| selections| picks)[.!]?$/.test(t))return this.dispatch(s,{id:'internal',type:'clear_slip'},'voice');
    const candidate=received?s.context?.candidateEvents?.map(id=>this.feed.get(id)).filter(Boolean)||[]:[];
    const named=this.feed.events.filter(e=>t.includes(e.a.toLowerCase())||t.includes(e.b.toLowerCase()));
    if(named.length>1||(!named.length&&candidate.length>1)){s.unresolvedQuestion='More than one event matches. Which teams or league do you mean?';s.lastAction=s.unresolvedQuestion;return 'clarification';}
    const event=named.length===1?named[0]:candidate.length===1?candidate[0]:!received&&!s.unresolvedQuestion&&s.eventId?this.feed.get(s.eventId):undefined;
    if(event && (named.length===1 || received || /\b(?:this|that|it|match|event|home win|away win|draw)\b/.test(t))){
      s.eventId=event.id;s.route='event';
      const choice=/\b(?:add|select|pick|back|bet|place)\b/.test(t)&&(/home (?:win|winner)/.test(t)?event.a:/away (?:win|winner)/.test(t)?event.b:/\bdraw\b/.test(t)?'Draw':undefined);
      if(choice){const pick=event.markets.flatMap(m=>m.options).find(p=>p.label===choice);if(!pick){s.unresolvedQuestion='That outcome is not available. Which market would you like?';s.lastAction=s.unresolvedQuestion;return 'clarification';}if(s.slip.selections.some(p=>p.eventId===event.id&&p.id!==pick.id)){s.unresolvedQuestion='Your slip already has a different selection for this event. Should I remove it before adding the new choice?';s.lastAction=s.unresolvedQuestion;return 'clarification';}this.add(s,this.pick(pick.id,event.id));}
      if(amount&&choice){this.edit(s);s.slip.stakeMinor=Math.round((nwords[amount[1]]||Number(amount[1]))*100);}
      s.unresolvedQuestion=undefined;s.lastAction=choice?`Added ${choice}. Stake ${(s.slip.stakeMinor/100).toFixed(2)} demo credits. Ask to review your slip.`:`${received?'Research received. ':''}Opened ${event.a} versus ${event.b}.`;
      if(choice&&placement)return this.dispatch(s,{id:'internal',type:'prepare_bet'},'voice');
      return 'completed';
    }
    s.lastAction=received?'Research received. Continue by voice to choose an event or action.':'I need a little more detail. Name the event and the action you want.';
    s.unresolvedQuestion=s.lastAction;return received?'received':'clarification';
  }
}
