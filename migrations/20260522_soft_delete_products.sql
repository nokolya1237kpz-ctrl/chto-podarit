alter table if exists products
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_reason text;

create index if not exists idx_products_deleted_at on products(deleted_at);
