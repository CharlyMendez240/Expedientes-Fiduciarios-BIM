-- Regiones y roles ampliados
create table if not exists regions (
  id text primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (role in ('superusuario', 'ejecutivo', 'cliente'));

alter table users add column if not exists region_id text references regions(id);
alter table businesses add column if not exists region_id text references regions(id);

-- Documentos solicitados al cliente (selección del ejecutivo sobre pestaña 2)
alter table requests add column if not exists requested_docs jsonb not null default '[]'::jsonb;

-- Parametrización de formatos
create table if not exists format_templates (
  id text primary key,
  format_key text not null unique,
  title text not null,
  code text not null default '',
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists format_fields (
  id text primary key,
  template_id text not null references format_templates(id) on delete cascade,
  field_key text not null,
  label text not null,
  source_type text not null check (source_type in ('manual_negocio', 'manual_cliente', 'documento', 'fijo')),
  source_path text not null default '',
  default_value text not null default '',
  sort_order int not null default 0,
  unique (template_id, field_key)
);

create index if not exists idx_users_region on users(region_id);
create index if not exists idx_businesses_region on businesses(region_id);
create index if not exists idx_format_fields_template on format_fields(template_id);
