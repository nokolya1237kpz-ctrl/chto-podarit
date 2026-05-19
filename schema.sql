-- Supabase schema for ЧтоПодарить

create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric not null,
  old_price numeric,
  currency text not null default 'RUB',
  marketplace text not null,
  original_url text not null,
  affiliate_url text,
  admitad_deeplink text,
  admitad_campaign_id text,
  admitad_offer_id text,
  epn_token text,
  advertiser_name text,
  external_product_id text,
  image_url text,
  recipients text[] not null default '{}',
  budget text not null default '',
  interests text[] not null default '{}',
  occasions text[] not null default '{}',
  gift_types text[] not null default '{}',
  tags text[] not null default '{}',
  wow_rating integer not null default 7,
  risk_level text not null default 'medium',
  is_best_price boolean not null default false,
  discount_percent integer,
  is_active boolean not null default true,
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  source_provider text not null default 'manual',
  source_type text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists products_external_source_idx on products (external_product_id, source_provider);

create table if not exists product_sources (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  name text not null,
  enabled boolean not null default false,
  api_base_url text,
  affiliate_id text,
  campaign_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  status text not null,
  message text not null,
  synced_count integer,
  failed_count integer,
  duration_ms integer,
  created_at timestamptz not null default now()
);
