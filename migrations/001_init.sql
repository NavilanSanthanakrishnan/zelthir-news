create table if not exists users (
  id text primary key,
  email text not null unique,
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists login_codes (
  id text primary key,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists login_codes_email_idx on login_codes(email);

create table if not exists sessions (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists sessions_user_id_idx on sessions(user_id);

create table if not exists profiles (
  user_id text primary key references users(id) on delete cascade,
  display_name text,
  persona text not null default 'general_reader',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profile_interests (
  user_id text not null references users(id) on delete cascade,
  interest_id text not null,
  weight integer not null default 1,
  created_at timestamptz not null default now(),
  primary key (user_id, interest_id)
);

create table if not exists profile_locations (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  type text not null,
  city text,
  state text,
  country text not null default 'US',
  label text not null,
  weight integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists profile_locations_user_id_idx on profile_locations(user_id);
