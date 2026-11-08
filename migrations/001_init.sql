create table if not exists users (
  id text primary key,
  email text not null unique,
  name text not null,
  role text not null check (role in ('ejecutivo', 'cliente')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id text not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists businesses (
  id text primary key,
  folio text not null unique,
  nombre text not null,
  tipo_contrato text not null,
  credito_bim boolean not null default false,
  descripcion text not null default '',
  patrimonio_tipo text not null default '',
  patrimonio_valor text not null default '',
  patrimonio_desc text not null default '',
  honorarios_aceptacion text not null default '',
  honorarios_admin text not null default '',
  fines text not null default '',
  ejecutivo_id text not null references users(id),
  formatos jsonb not null default '[]'::jsonb,
  status text not null default 'borrador',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists participants (
  id text primary key,
  business_id text not null references businesses(id) on delete cascade,
  tipo_persona text not null check (tipo_persona in ('PF', 'PM')),
  nacionalidad text not null check (nacionalidad in ('nacional', 'extranjero')),
  rol_negocio text not null,
  nombre text not null,
  rfc text not null default '',
  curp text not null default '',
  email text not null default '',
  telefono text not null default '',
  domicilio text not null default '',
  fecha_nacimiento text not null default '',
  nacionalidad_pais text not null default 'México',
  actividad_economica text not null default '',
  datos_extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id text primary key,
  business_id text not null references businesses(id) on delete cascade,
  participant_id text not null unique references participants(id) on delete cascade,
  invite_token text not null unique,
  status text not null default 'pendiente' check (status in ('pendiente', 'cargado', 'validado')),
  cliente_user_id text references users(id),
  notas text not null default '',
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists documents (
  id text primary key,
  request_id text not null references requests(id) on delete cascade,
  doc_key text not null,
  label text not null,
  file_name text not null,
  mime_type text not null,
  content_base64 text not null,
  extracted jsonb not null default '{}'::jsonb,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists generated_forms (
  id text primary key,
  business_id text not null references businesses(id) on delete cascade,
  participant_id text references participants(id) on delete cascade,
  format_key text not null,
  title text not null,
  html_content text not null,
  source_trace jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_businesses_ejecutivo on businesses(ejecutivo_id);
create index if not exists idx_participants_business on participants(business_id);
create index if not exists idx_requests_token on requests(invite_token);
create index if not exists idx_documents_request on documents(request_id);
create index if not exists idx_forms_business on generated_forms(business_id);
