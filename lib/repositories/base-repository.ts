import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { db as defaultDb } from '../../../../../src/lib/server/db';

export abstract class BaseRepository {
	protected db: BetterSQLite3Database<any>;

	constructor(db?: BetterSQLite3Database<any>) {
		this.db = db || defaultDb;
	}
}
