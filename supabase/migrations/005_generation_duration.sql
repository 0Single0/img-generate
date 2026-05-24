alter table public.generation_records
add column if not exists completed_at timestamptz,
add column if not exists duration_ms integer;
