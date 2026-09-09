import {randomBytes,randomUUID} from 'node:crypto';
import {notificationDefaults,eligibilityRecord} from '../../shared/safeguards.js';
import type {TaskSession} from '../../shared/contracts.js';
export function newSession(){
    const token = randomBytes(32).toString('base64url');
    const now = new Date().toISOString();
    const session: TaskSession = {
      version: 1, id: randomUUID(), revision: 0, route: 'live', sport: 'all', period: 'live',
      slip: { version: 0, selections: [], stakeMinor: 1000, mode: 'accumulator', totals: { stake: 10, totalStake: 10, totalOdds: 1, estimatedReturn: 0, profit: 0, bonus: 0 } },
      walletMinor: 125000, spentMinor: 0, limitMinor: 10000, paused: false, reminderMinutes: 0, reminderStartedAt: now, favorites: [],
      notificationPreferences:notificationDefaults(),eligibility:eligibilityRecord(),deliveryDecisions:[],
      lastAction: 'Sample data ready. Choose a synthetic eligibility profile in Settings.', status: 'idle', tickets: [], updatedAt: now,
    };
    return {token,session};
}
