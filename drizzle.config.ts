import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './lib/server/db/schema/tables.ts',
	out: './drizzle',
	dialect: 'sqlite',
	dbCredentials: {
		url: 'dev.db'
	}
});
