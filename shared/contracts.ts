/** Versioned cross-platform wire contracts. No secrets or platform dependencies. */
export type Sport = 'all' | 'football' | 'cricket' | 'basketball' | 'tennis' | 'esports';
export type Pick = { id: string; eventId: string; market: string; marketId?: string; label: string; odds: number; previous?: number; changed?: boolean; suspended?: boolean };
export type Market = { id: string; name: string; options: Pick[]; suspended?: boolean };
export type PlayerDetail = { id:string; name:string; team:'home'|'away'; number:number; position:string; starter:boolean };
export type EventMoment = { id:string; type:'goal'|'score'|'card'|'substitution'|'wicket'|'set'|'round'; clock:string; label:string; team?:'home'|'away'; player?:string; secondary?:string; score?:string };
export type Event = {
  id: string; sport: Sport; league: string; country: string; a: string; b: string;
  short: string[]; colors: string[]; score: string[]; stage: string; live: boolean;
  suspended?: boolean; odds: number[]; time: string; hours: number; popularity: number;
  source: 'live' | 'demo'; sourceName: string; fetchedAt: string; startsAt: string;
  markets: Market[]; statistics?: { label: string; home: string; away: string }[];
  players?:PlayerDetail[]; timeline?:EventMoment[];
};
export type Source = { title: string; url?: string; retrievedAt: string };
export type ContextHandoff = { version: 1; handoffId: string; sessionId?: string; instruction: string; research: { summary: string; sources: Source[] }; candidateEvents?: string[]; createdAt: string };
export type Totals = { stake: number; totalStake: number; totalOdds: number; estimatedReturn: number; profit: number; bonus: number };
export type Slip = { version: number; selections: Pick[]; stakeMinor: number; mode: 'single' | 'accumulator'; totals: Totals };
export type Review = { id: string; slipVersion: number; digest: string; expiresAt: string; dialog: string; readbackComplete: boolean; consumed?: boolean };
export type Ticket = { id: string; selections: Pick[]; mode: 'single' | 'accumulator'; totalStake: number; estimatedReturn: number; totalOdds: number; placedAt: string; demoOnly: true };
export type SessionStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'review' | 'paused' | 'offline' | 'ended';
export type TaskSession = {
  version: 1; id: string; revision: number; route: string; sport: Sport; period: string;
  eventId?: string; eventView?: string; eventQuery?:string; listRevision?:number; slip: Slip; walletMinor: number; spentMinor: number; limitMinor: number;
  paused: boolean; reminderMinutes: number; reminderStartedAt: string; favorites: string[];
  context?: ContextHandoff; unresolvedQuestion?: string; pendingContext?: ContextHandoff;
  notificationPreferences?:NotificationPreferences; eligibility?:Eligibility; deliveryDecisions?:DeliveryDecision[]; lastInstruction?:string;
  watchEvents?: string[]; watchScores?: Record<string,string>;
  gamePointsMinor?: number; lastGame?: {id:string;game:string;symbol:string;message:string};
  lastAction: string; status: SessionStatus; review?: Review; tickets: Ticket[]; updatedAt: string;
};
export type ActionSnapshot = { version: 1; sessionId: string; revision: number; status: SessionStatus; title: string; score: string; stage: string; lastAction: string; selectionCount: number; review?: string; receipt?: string; optionalAlert?:DeliveryDecision; updatedAt: string };
export type ActionResult = { version: 1; actionId: string; revision: number; outcome: 'completed' | 'clarification' | 'review' | 'received'; message: string; session: TaskSession; snapshot: ActionSnapshot; events?: Event[] };
export type Action = { id: string; type: string; expectedRevision?: number; payload?: Record<string, unknown> };
export type Bootstrap = { token: string; session: TaskSession; snapshot: ActionSnapshot; events: Event[]; feed: { status: string; updatedAt?: string; message: string } };

export type DemoProfileId = 'unknown' | 'eligible-adult' | 'unverified' | 'underage' | 'at-risk' | 'self-excluded';
export type Eligibility = {profileId:DemoProfileId; adultVerified:boolean; excluded:boolean; atRisk:boolean; source:'synthetic-register'; checkedAt:string};
export type NotificationPreferences = {optionalConsent:boolean; consentUpdatedAt?:string; timeZone:string; quietStartHour:22; quietEndHour:8; maxDaily:3; minIntervalMinutes:60};
export type AlertCandidate = {id:string; kind:'optional_event'|'safety_reminder'|'essential_mic'; createdAt:string; expiresAt:string; eventId?:string};
export type DeliveryDecision = {id:string; kind:AlertCandidate['kind']; allowed:boolean; reason:string; decidedAt:string; expiresAt:string; localDay:string};
