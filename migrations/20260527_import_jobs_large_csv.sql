-- Production-grade import jobs and large CSV support.

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  progress integer not null default 0,
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  created_active integer not null default 0,
  created_draft integer not null default 0,
  duplicates integer not null default 0,
  errors_count integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  source text,
  filename text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_import_jobs_status_created on import_jobs(status, created_at desc);

alter table products
  add column if not exists image_status text default 'remote',
  add column if not exists search_text text;

create table if not exists price_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  marketplace text,
  price numeric not null,
  old_price numeric,
  detected_at timestamptz not null default now()
);

create index if not exists idx_price_snapshots_product_detected on price_snapshots(product_id, detected_at desc);
create index if not exists idx_price_snapshots_marketplace_detected on price_snapshots(marketplace, detected_at desc);

create extension if not exists pg_trgm;
create index if not exists idx_products_search_text_trgm on products using gin (search_text gin_trgm_ops);
create index if not exists idx_products_title_trgm on products using gin (title gin_trgm_ops);

create unique index if not exists idx_products_source_external_unique
  on products(source_provider, external_product_id)
  where external_product_id is not null and deleted_at is null;

create index if not exists idx_products_original_url_dedupe on products(original_url) where original_url is not null and deleted_at is null;
