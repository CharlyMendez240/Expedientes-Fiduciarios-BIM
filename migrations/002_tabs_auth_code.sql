-- Documentos del expediente por pestaña (carga del ejecutivo o del cliente)
create table if not exists business_documents (
  id text primary key,
  business_id text not null references businesses(id) on delete cascade,
  tab_key text not null,
  doc_key text not null,
  label text not null,
  file_name text not null,
  mime_type text not null,
  content_base64 text not null,
  extracted jsonb not null default '{}'::jsonb,
  uploaded_by text not null,
  request_id text references requests(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_business_documents_biz on business_documents(business_id);
create index if not exists idx_business_documents_tab on business_documents(business_id, tab_key);

-- Código de autenticación para acceso del cliente por correo
alter table requests add column if not exists auth_code text;
alter table requests add column if not exists auth_code_expires timestamptz;
alter table requests add column if not exists email_sent_at timestamptz;
alter table requests add column if not exists cliente_nombre text not null default '';
alter table requests add column if not exists cliente_email text not null default '';

create unique index if not exists idx_requests_auth_code on requests(auth_code) where auth_code is not null;

-- Buzón simulado de correos enviados (demo)
create table if not exists outbound_emails (
  id text primary key,
  to_email text not null,
  to_name text not null,
  subject text not null,
  body_html text not null,
  auth_code text not null,
  business_id text references businesses(id) on delete cascade,
  request_id text references requests(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_outbound_emails_to on outbound_emails(to_email);
