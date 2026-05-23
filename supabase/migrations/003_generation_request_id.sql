alter table public.generation_records
add column if not exists request_id text;

create unique index if not exists generation_records_user_request_id_key
on public.generation_records (user_id, request_id)
where request_id is not null;
