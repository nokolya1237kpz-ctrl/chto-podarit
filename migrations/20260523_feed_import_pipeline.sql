alter table if exists products
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_reason text,
  add column if not exists import_status text,
  add column if not exists enrichment_status text,
  add column if not exists source_feed_id text,
  add column if not exists parse_errors text[];

create index if not exists idx_products_deleted_at_pipeline on products(deleted_at);
create index if not exists idx_products_import_status on products(import_status);
create index if not exists idx_products_source_feed_id on products(source_feed_id);
