import type {AlertCandidate, DeliveryDecision, DemoProfileId, Eligibility, NotificationPreferences, TaskSession} from './contracts.js';

export const demoProfileIds:DemoProfileId[]=['unknown','eligible-adult','unverified','underage','at-risk','self-excluded'];
export function eligibilityRecord(profileId:DemoProfileId='unknown',now=new Date().toISOString()):Eligibility {
  return {profileId,adultVerified:['eligible-adult','at-risk','self-excluded'].includes(profileId),excluded:profileId==='self-excluded',atRisk:profileId==='at-risk',source:'synthetic-register',checkedAt:now};
}
export function eligible(record?:Eligibility){return !!record&&record.adultVerified&&!record.excluded&&!record.atRisk;}
export function notificationDefaults():NotificationPreferences {return {optionalConsent:false,timeZone:'UTC',quietStartHour:22,quietEndHour:8,maxDaily:3,minIntervalMinutes:60};}
export function normalizeSession(s:TaskSession):TaskSession {
  const old=s.notificationPreferences;
  // No consent timestamp means there is no evidence of affirmative opt-in.
  s.notificationPreferences={...notificationDefaults(),...(old||{}),optionalConsent:old?.optionalConsent===true&&!!old.consentUpdatedAt,quietStartHour:22,quietEndHour:8,maxDaily:3,minIntervalMinutes:60};
  const id=s.eligibility?.profileId;
  s.eligibility=eligibilityRecord(id&&demoProfileIds.includes(id)?id:'unknown',s.eligibility?.checkedAt||new Date().toISOString());
  s.deliveryDecisions ||= [];
  return s;
}
export function localClock(now:number,timeZone:string){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const get=(k:string)=>parts.find(p=>p.type===k)?.value||'';
  return {day:`${get('year')}-${get('month')}-${get('day')}`,hour:Number(get('hour'))};
}
export function decideDelivery(s:TaskSession,c:AlertCandidate,now=Date.now()):DeliveryDecision {
  const prefs=s.notificationPreferences||notificationDefaults(),history=s.deliveryDecisions||[];
  let clock;try{clock=localClock(now,prefs.timeZone);}catch{clock={day:'unknown',hour:0};}
  let reason='allowed';
  const created=Date.parse(c.createdAt),expires=Date.parse(c.expiresAt);
  if(!Number.isFinite(created)||!Number.isFinite(expires)||created>now+5000||expires<=now||now-created>120000)reason='stale';
  else if(history.some(d=>d.id===c.id))reason='duplicate';
  else if(c.kind==='safety_reminder'&&s.reminderMinutes<=0)reason='not_requested';
  else if(c.kind==='optional_event'){
    const record=eligibilityRecord(s.eligibility?.profileId||'unknown');
    if(!eligible(record))reason='restricted_profile';
    else if(s.paused)reason='play_paused';
    else if(!prefs.optionalConsent||!prefs.consentUpdatedAt)reason='consent_off';
    else if(!c.eventId||!s.watchEvents?.includes(c.eventId))reason='event_not_followed';
    else if(clock.day==='unknown')reason='unknown_time_zone';
    else if(clock.hour>=prefs.quietStartHour||clock.hour<prefs.quietEndHour)reason='quiet_hours';
    else {
      const allowed=history.filter(d=>d.allowed&&d.kind==='optional_event');
      if(allowed.filter(d=>{try{return localClock(Date.parse(d.decidedAt),prefs.timeZone).day===clock.day}catch{return true}}).length>=prefs.maxDaily)reason='daily_cap';
      else if(allowed.some(d=>now-Date.parse(d.decidedAt)<prefs.minIntervalMinutes*60000))reason='minimum_interval';
    }
  }
  return {id:c.id,kind:c.kind,allowed:reason==='allowed',reason,decidedAt:new Date(now).toISOString(),expiresAt:c.expiresAt,localDay:clock.day};
}
