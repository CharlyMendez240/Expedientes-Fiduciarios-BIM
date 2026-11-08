create table if not exists login_attempts (
  subject text not null,
  channel text not null check (channel in ('password', 'code')),
  failures integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now(),
  primary key (subject, channel)
);
