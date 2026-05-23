create table if not exists public.model_options (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null,
  provider_label text not null,
  model_id text not null,
  model_label text not null,
  default_base_url text not null,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (provider_key, model_id)
);

alter table public.model_options enable row level security;

drop policy if exists "Authenticated users can read enabled model options" on public.model_options;
create policy "Authenticated users can read enabled model options"
on public.model_options
for select
using (auth.role() = 'authenticated' and enabled = true);

alter table public.model_configs
add column if not exists model_option_id uuid references public.model_options(id),
add column if not exists provider_label text,
add column if not exists model_label text;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'generation_records_provider_check'
  ) then
    alter table public.generation_records drop constraint generation_records_provider_check;
  end if;
end $$;

insert into public.model_options
  (provider_key, provider_label, model_id, model_label, default_base_url, enabled, sort_order)
values
  ('chatgpt', 'ChatGPT', 'image2', 'image2', 'https://api.openai.com/v1', true, 10),
  ('openai', 'OpenAI', 'gpt-image-2', 'GPT Image 2', 'https://api.openai.com/v1', true, 20),
  ('seedream', 'Seedream', 'seedance-v1', 'Seedance V1', 'https://ark.cn-beijing.volces.com/api/v3', true, 30),
  ('seedream', 'Seedream', 'doubao-seedream-5-0-260128', 'Doubao Seedream 5.0', 'https://ark.cn-beijing.volces.com/api/v3', true, 40)
on conflict (provider_key, model_id) do update
set provider_label = excluded.provider_label,
    model_label = excluded.model_label,
    default_base_url = excluded.default_base_url,
    enabled = excluded.enabled,
    sort_order = excluded.sort_order;

update public.model_configs as config
set model_option_id = option.id,
    provider_label = option.provider_label,
    model_label = option.model_label
from public.model_options as option
where config.model_option_id is null
  and config.provider = option.provider_key
  and config.model_id = option.model_id;
