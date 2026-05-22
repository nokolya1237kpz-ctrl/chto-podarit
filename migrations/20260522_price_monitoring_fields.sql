alter table if exists products
  add column if not exists price_last_checked_at timestamptz,
  add column if not exists price_check_status text,
  add column if not exists price_stale boolean default false;

create index if not exists idx_products_price_last_checked_at on products(price_last_checked_at);
