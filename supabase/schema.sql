-- Enable extensions
create extension if not exists "pgcrypto";

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  description text,
  price numeric not null,
  old_price numeric,
  currency text default 'RUB',

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

  recipients text[] default '{}',
  budget text,
  interests text[] default '{}',
  occasions text[] default '{}',
  gift_types text[] default '{}',

  wow_rating int default 7,
  risk_level text default 'medium',
  tags text[] default '{}',

  is_best_price boolean default false,
  discount_percent int,
  is_active boolean default true,
  status text default 'active' check (status in ('draft', 'active', 'archived')),
  source_provider text default 'manual',
  source_type text default 'manual',
  last_price_checked_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes on products
create index if not exists products_is_active_idx on products(is_active);
create index if not exists products_marketplace_idx on products(marketplace);
create index if not exists products_budget_idx on products(budget);
create index if not exists products_source_type_idx on products(source_type);

-- Affiliate sources table
create table if not exists affiliate_sources (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  type text not null,
  marketplace text,
  base_url text,
  api_base_url text,

  is_enabled boolean default true,

  admitad_campaign_id text,
  admitad_website_id text,

  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes on affiliate_sources
create index if not exists affiliate_sources_type_idx on affiliate_sources(type);
create index if not exists affiliate_sources_marketplace_idx on affiliate_sources(marketplace);

-- Product sync logs table
create table if not exists product_sync_logs (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null,
  status text not null,
  message text not null,
  synced_count int,
  failed_count int,
  duration_ms int,
  created_at timestamp with time zone default now()
);

-- Update trigger function
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
before update on products
for each row
execute function set_updated_at();

drop trigger if exists affiliate_sources_set_updated_at on affiliate_sources;
create trigger affiliate_sources_set_updated_at
before update on affiliate_sources
for each row
execute function set_updated_at();

-- Row level security policies
alter table products enable row level security;
alter table affiliate_sources enable row level security;

-- Public read-only access to active products
create policy "public_read_active_products" on products
for select using (is_active = true);

-- Disable all public access to affiliate_sources
create policy "no_public_access" on affiliate_sources
for all using (false);
