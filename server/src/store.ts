import {normalizeSession} from '../../shared/safeguards.js';
import {newSession} from './new-session.js';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type { TaskSession, ActionResult } from '../../shared/contracts.js';

export class Store {
  db: DatabaseSync;
  constructor(path = process.env.CONTEXTFLOW_DB || './data/contextflow.sqlite') {
    if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS actions (owner TEXT NOT NULL, id TEXT NOT NULL, fingerprint TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(owner,id));
      CREATE TABLE IF NOT EXISTS cache (id TEXT PRIMARY KEY, body TEXT NOT NULL);`);
    // A process restart cannot preserve microphone ownership or a spoken confirmation.
    for (const row of this.db.prepare('SELECT id,body FROM sessions').all()) {
      const s = normalizeSession(JSON.parse(String(row.body)) as TaskSession);
      s.review = undefined; s.status = 'offline'; s.revision++;
      this.save(s);
    }
  }
  hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  create() {
    const {token,session}=newSession();
    this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(session.id,this.hash(token),JSON.stringify(session));
    return { token, session };
  }
  authenticate(token: string) {
    const row = this.db.prepare('SELECT body FROM sessions WHERE token_hash=?').get(this.hash(token));
    return row ? normalizeSession(JSON.parse(String(row.body)) as TaskSession) : undefined;
  }
  get(id: string): TaskSession {
    const row = this.db.prepare('SELECT body FROM sessions WHERE id=?').get(id);
    if (!row) throw new Error('Session not found.');
    return normalizeSession(JSON.parse(String(row.body)));
  }
  save(s: TaskSession) { this.db.prepare('UPDATE sessions SET body=? WHERE id=?').run(JSON.stringify(s),s.id); }
  previous(owner: string,id: string,fingerprint: string): ActionResult | undefined {
    const row = this.db.prepare('SELECT fingerprint,result FROM actions WHERE owner=? AND id=?').get(owner,id);
    if (!row) return;
    if (row.fingerprint !== fingerprint) throw new Error('This action ID was already used for a different request.');
    return JSON.parse(String(row.result));
  }
  record(owner: string,id: string,fingerprint: string,result: ActionResult) { this.db.prepare('INSERT INTO actions VALUES(?,?,?,?)').run(owner,id,fingerprint,JSON.stringify(result)); }
  transaction<T>(fn:()=>T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try { const v=fn(); this.db.exec('COMMIT'); return v; } catch(e) { this.db.exec('ROLLBACK'); throw e; }
  }
  cache(id: string,body?: unknown): unknown {
    if (body !== undefined) { this.db.prepare('INSERT OR REPLACE INTO cache VALUES(?,?)').run(id,JSON.stringify(body)); return body; }
    const row=this.db.prepare('SELECT body FROM cache WHERE id=?').get(id);return row?JSON.parse(String(row.body)):undefined;
  }
}
