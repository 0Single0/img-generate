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

create table if not exists public.model_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model_option_id uuid references public.model_options(id),
  provider text not null,
  provider_label text,
  display_name text not null,
  model_id text not null,
  model_label text,
  base_url text not null,
  api_key_encrypted text,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_records (
  id uuid primary key default gen_random_uuid(),
  request_id text,
  user_id uuid not null references auth.users(id) on delete cascade,
  model_config_id uuid not null references public.model_configs(id) on delete cascade,
  provider text not null,
  model_id text not null,
  operation text not null check (operation in ('generation', 'edit')),
  prompt text not null,
  params jsonb not null default '{}'::jsonb,
  reference_image_paths text[] not null default '{}',
  output_image_paths text[] not null default '{}',
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create unique index if not exists generation_records_user_request_id_key
on public.generation_records (user_id, request_id)
where request_id is not null;

alter table public.model_configs enable row level security;
alter table public.generation_records enable row level security;

alter table public.model_options enable row level security;

drop policy if exists "Authenticated users can read enabled model options" on public.model_options;
create policy "Authenticated users can read enabled model options"
on public.model_options
for select
using (auth.role() = 'authenticated' and enabled = true);

drop policy if exists "Users can manage own model configs" on public.model_configs;
create policy "Users can manage own model configs"
on public.model_configs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "Users can manage own generation records" on public.generation_records;
create policy "Users can manage own generation records"
on public.generation_records
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('generation-assets', 'generation-assets', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own generation assets" on storage.objects;
create policy "Users can read own generation assets"
on storage.objects
for select
using (bucket_id = 'generation-assets' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can write own generation assets" on storage.objects;
create policy "Users can write own generation assets"
on storage.objects
for insert
with check (bucket_id = 'generation-assets' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update own generation assets" on storage.objects;
create policy "Users can update own generation assets"
on storage.objects
for update
using (bucket_id = 'generation-assets' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'generation-assets' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete own generation assets" on storage.objects;
create policy "Users can delete own generation assets"
on storage.objects
for delete
using (bucket_id = 'generation-assets' and auth.uid()::text = (storage.foldername(name))[1]);
