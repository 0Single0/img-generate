import { promises as fs } from "fs";
import path from "path";
import { Client } from "pg";

type MigrationRow = {
  name: string;
};

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

const loadLocalEnv = async () => {
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    const envFile = await fs.readFile(envPath, "utf8");
    envFile
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .forEach((line) => {
        const separatorIndex = line.indexOf("=");

        if (separatorIndex === -1) {
          return;
        }

        const key = line.slice(0, separatorIndex).trim();
        const rawValue = line.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^["']|["']$/g, "");

        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
  } catch {
    // .env.local is optional in CI because variables can come from the platform.
  }
};

const getDatabaseUrl = () => {
  const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "SUPABASE_DB_URL is required. Copy the Supabase Postgres connection string into your local or deployment environment.",
    );
  }

  return databaseUrl;
};

const getMigrationFiles = async () => {
  const entries = await fs.readdir(migrationsDir);

  return entries
    .filter((entry) => entry.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => path.join(migrationsDir, entry));
};

const ensureMigrationTable = async (client: Client) => {
  await client.query(`
    create table if not exists public.schema_migrations (
      name text primary key,
      executed_at timestamptz not null default now()
    );
  `);
};

const getExecutedMigrations = async (client: Client) => {
  const result = await client.query<MigrationRow>(
    "select name from public.schema_migrations order by name asc",
  );

  return new Set(result.rows.map((row) => row.name));
};

const runMigration = async (client: Client, filePath: string) => {
  const name = path.basename(filePath);
  const sql = await fs.readFile(filePath, "utf8");

  console.log(`Running migration ${name}`);

  await client.query("begin");

  try {
    await client.query(sql);
    await client.query(
      "insert into public.schema_migrations (name) values ($1) on conflict (name) do nothing",
      [name],
    );
    await client.query("commit");
    console.log(`Finished migration ${name}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
};

const main = async () => {
  await loadLocalEnv();

  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();

  try {
    await ensureMigrationTable(client);
    const executed = await getExecutedMigrations(client);
    const files = await getMigrationFiles();
    let appliedCount = 0;

    for (const file of files) {
      const name = path.basename(file);

      if (executed.has(name)) {
        console.log(`Skipping migration ${name}`);
        continue;
      }

      await runMigration(client, file);
      appliedCount += 1;
    }

    console.log(`Migration complete. Applied ${appliedCount} new migration(s).`);
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
