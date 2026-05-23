alter table public.model_options
add column if not exists icon text;

alter table public.model_configs
add column if not exists provider_icon text;

update public.model_options
set icon = 'https://openai.com/favicon.ico'
where provider_key = 'openai'
  and coalesce(icon, '') = '';

update public.model_configs
set provider_icon = 'https://openai.com/favicon.ico'
where provider = 'openai'
  and coalesce(provider_icon, '') = '';

update public.model_configs as config
set provider_icon = option.icon
from public.model_options as option
where config.model_option_id = option.id
  and coalesce(option.icon, '') <> '';
