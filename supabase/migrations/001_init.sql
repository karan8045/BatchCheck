create extension if not exists pg_trgm;

create table data_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_url text,
  published_month date,
  record_count int not null default 0,
  ingested_at timestamptz not null default now(),
  unique (name, published_month)
);

create table flagged_batches (
  id uuid primary key default gen_random_uuid(),
  drug_name text not null,
  drug_key text not null,
  manufacturer text,
  manufacturer_key text,
  batch_number text not null,
  batch_key text not null,
  alert_type text not null check (alert_type in ('NSQ','SPURIOUS','ADULTERATED','MISBRANDED','OTHER')),
  reason text,
  source_id uuid not null references data_sources(id) on delete cascade,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  unique (batch_key, drug_key, source_id)
);

create index flagged_batch_key_idx on flagged_batches (batch_key);
create index flagged_drug_trgm_idx on flagged_batches using gin (drug_key gin_trgm_ops);

alter table data_sources enable row level security;
alter table flagged_batches enable row level security;

create or replace function check_batch(p_batch_key text, p_drug_key text, p_mfr_key text)
returns table (
  id uuid, drug_name text, manufacturer text, batch_number text,
  alert_type text, reason text, source_name text, source_url text,
  published_month date, is_demo boolean, drug_sim real, mfr_sim real
)
language sql stable as $$
  select f.id, f.drug_name, f.manufacturer, f.batch_number,
         f.alert_type, f.reason, s.name, s.source_url,
         s.published_month, f.is_demo,
         similarity(f.drug_key, p_drug_key),
         coalesce(similarity(f.manufacturer_key, p_mfr_key), 0)
  from flagged_batches f
  join data_sources s on s.id = f.source_id
  where f.batch_key = p_batch_key
  order by similarity(f.drug_key, p_drug_key) desc
  limit 5;
$$;

