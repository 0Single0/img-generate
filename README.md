# Image Console

Next.js App Router image generation console with Supabase Auth, Supabase Storage, provider model settings, and generation history.

## Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill the values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_DB_URL=
APP_ENCRYPTION_KEY=
```

`SUPABASE_DB_URL` is server-only and must be the Supabase Postgres connection string. Do not expose it in client code.

## Database Migrations

Run migrations manually from the project:

```bash
pnpm db:migrate
```

The runner reads SQL files from `supabase/migrations`, executes them in filename order, and records completed files in `public.schema_migrations`.

For Vercel automatic migrations, add `SUPABASE_DB_URL` and `APP_ENCRYPTION_KEY` as project environment variables, then set the build command to:

```bash
pnpm vercel-build
```

This runs `pnpm db:migrate` before `next build`.

## Useful Commands

```bash
pnpm lint
pnpm build
pnpm db:migrate
```
