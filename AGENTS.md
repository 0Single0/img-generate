# AGENTS.md

## Project Rules

- Use `pnpm` for all package and script commands.
- Do not run `pnpm build` automatically after code changes unless the user explicitly asks for a build.
- Keep code in `src/`; route files should compose feature components and avoid carrying business logic.
- Use App Router route groups for authenticated and unauthenticated areas.
- Prefer `type` for TypeScript declarations. Avoid `interface` unless a library contract requires it.
- Use arrow functions for business functions, component-internal methods, callbacks, and utilities when `this` binding is not needed.
- Wrap business event handlers and callbacks with `useCallback`.
- Wrap expensive or frequently changing derived values with `useMemo`.
- Split growing components by responsibility into child components, hooks, utilities, and local types.
- Put shared components in `src/components`, shared utilities in `src/lib`, shared state in `src/store`, and cross-feature types in `src/types`.
- Keep local UI state local. Use Zustand or Context only when state genuinely crosses route or feature boundaries.
- Use Supabase server helpers for auth/session reads. Do not mirror the authenticated user into a global auth store.
- Put normal API calls behind feature `api.ts` files or `src/services`. Do not scatter raw `axios` calls in pages.
- Use the Axios wrapper in `src/lib/http/client.ts` for standard JSON requests. Use `fetch` for SSE, streaming, and long-lived requests.
- Never expose service role keys or provider API keys in client components.
- Run database schema changes through `pnpm db:migrate`; never attempt runtime schema creation from route handlers.
- Keep `SUPABASE_DB_URL` server-only and out of committed env files.
