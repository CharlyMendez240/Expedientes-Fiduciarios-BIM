create table if not exists bim_flags (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table bim_flags add column if not exists updated_at timestamptz not null default now();
