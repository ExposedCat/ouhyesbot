import { Database as SQLiteDatabase } from "@db/sqlite";
import { type ColumnType, Kysely, sql } from "@kysely/kysely";
import { DenoSqlite3Dialect } from "@marshift/kysely-deno-sqlite3";

type ReadonlyColumn<T> = ColumnType<T, T, never>;

export type DatabaseSchema = {
	chats: {
		id: ReadonlyColumn<number>;
	};
};

export type Database = Kysely<DatabaseSchema>;

async function migrate(database: Database) {
	await sql`PRAGMA foreign_keys = ON`.execute(database);
	await sql`PRAGMA journal_mode = WAL`.execute(database);

	await database.schema
		.createTable("chats")
		.ifNotExists()
		.addColumn("id", "integer", (column) => column.primaryKey())
		.execute();
}

export function initDatabase() {
	const connect = async (): Promise<Database> => {
		const database = new Kysely<DatabaseSchema>({
			dialect: new DenoSqlite3Dialect({
				database: new SQLiteDatabase(
					Deno.env.get("SQLITE_PATH") ?? "telegram-bot.sqlite",
					{ int64: true },
				),
			}),
		});

		await migrate(database);
		return database;
	};

	return connect;
}
