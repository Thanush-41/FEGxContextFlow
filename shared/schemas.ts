import {z} from 'zod';

const id=z.string().trim().min(1).max(200);
const time=z.iso.datetime();
export const ContextHandoffSchema=z.object({
 version:z.literal(1),handoffId:id,sessionId:id.optional(),instruction:z.string().trim().max(4000),
 research:z.object({summary:z.string().max(16000),sources:z.array(z.object({title:z.string().max(200),url:z.url().refine(u=>/^https?:/.test(u)).optional(),retrievedAt:time})).max(20)}),
 candidateEvents:z.array(id).max(20).optional(),createdAt:time,
}).strict();
export const ActionSchema=z.object({id,type:id,expectedRevision:z.number().int().nonnegative().optional(),payload:z.record(z.string(),z.unknown()).optional()}).strict();
export const PickSchema=z.object({id,eventId:id,market:z.string(),marketId:z.string().optional(),label:z.string(),odds:z.number().positive(),previous:z.number().optional(),changed:z.boolean().optional(),suspended:z.boolean().optional()});
const TotalsSchema=z.object({stake:z.number(),totalStake:z.number(),totalOdds:z.number(),estimatedReturn:z.number(),profit:z.number(),bonus:z.number()});
const ReviewSchema=z.object({id,slipVersion:z.number().int(),digest:z.string(),expiresAt:time,dialog:z.string(),readbackComplete:z.boolean(),consumed:z.boolean().optional()});
const TicketSchema=z.object({id,selections:z.array(PickSchema),mode:z.enum(['single','accumulator']),totalStake:z.number(),estimatedReturn:z.number(),totalOdds:z.number(),placedAt:time,demoOnly:z.literal(true)});
const StatusSchema=z.enum(['idle','connecting','listening','thinking','speaking','review','paused','offline','ended']);
const EligibilitySchema=z.object({profileId:z.enum(['unknown','eligible-adult','unverified','underage','at-risk','self-excluded']),adultVerified:z.boolean(),excluded:z.boolean(),atRisk:z.boolean(),source:z.literal('synthetic-register'),checkedAt:time});
const PreferencesSchema=z.object({optionalConsent:z.boolean(),consentUpdatedAt:time.optional(),timeZone:z.string(),quietStartHour:z.literal(22),quietEndHour:z.literal(8),maxDaily:z.literal(3),minIntervalMinutes:z.literal(60)});
const DecisionSchema=z.object({id,kind:z.enum(['optional_event','safety_reminder','essential_mic']),allowed:z.boolean(),reason:z.string(),decidedAt:time,expiresAt:time,localDay:z.string()});
export const TaskSessionSchema=z.object({
 version:z.literal(1),id,revision:z.number().int().nonnegative(),route:z.string(),sport:z.enum(['all','football','cricket','basketball','tennis','esports']),period:z.string(),eventId:id.optional(),eventView:z.string().optional(),eventQuery:z.string().optional(),listRevision:z.number().int().optional(),
 slip:z.object({version:z.number().int(),selections:z.array(PickSchema),stakeMinor:z.number().int(),mode:z.enum(['single','accumulator']),totals:TotalsSchema}),
 walletMinor:z.number().int(),spentMinor:z.number().int(),limitMinor:z.number().int(),paused:z.boolean(),reminderMinutes:z.number().int(),reminderStartedAt:time,favorites:z.array(id),
 context:ContextHandoffSchema.optional(),unresolvedQuestion:z.string().optional(),pendingContext:ContextHandoffSchema.optional(),watchEvents:z.array(id).optional(),watchScores:z.record(z.string(),z.string()).optional(),
 notificationPreferences:PreferencesSchema.optional(),eligibility:EligibilitySchema.optional(),deliveryDecisions:z.array(DecisionSchema).optional(),lastInstruction:z.string().optional(),
 gamePointsMinor:z.number().int().optional(),lastGame:z.object({id,game:z.string(),symbol:z.string(),message:z.string()}).optional(),
 lastAction:z.string(),status:StatusSchema,review:ReviewSchema.optional(),tickets:z.array(TicketSchema),updatedAt:time,
});
export const ActionSnapshotSchema=z.object({version:z.literal(1),sessionId:id,revision:z.number().int(),status:StatusSchema,title:z.string(),score:z.string(),stage:z.string(),lastAction:z.string(),selectionCount:z.number().int(),review:z.string().optional(),receipt:z.string().optional(),optionalAlert:DecisionSchema.optional(),updatedAt:time});
export const ActionResultSchema=z.object({version:z.literal(1),actionId:id,revision:z.number().int(),outcome:z.enum(['completed','clarification','review','received']),message:z.string(),session:TaskSessionSchema,snapshot:ActionSnapshotSchema});
