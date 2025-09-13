create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamp with time zone default now(),
  last_login timestamp with time zone
);

create table if not exists public.documents (
  id uuid primary key,
  user_id uuid references public.users(id) on delete set null,
  original_pdf_name text not null,
  signed_pdf_url text,
  qr_code_url text,
  metadata jsonb,
  status text check (status in ('draft','signed','downloaded')) default 'draft',
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone not null,
  ip_hash text
);

create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  image_url text not null,
  created_at timestamp with time zone default now()
);
