-- Platform expansion: trends metadata and price history.

alter table products
  add column if not exists trend_source text,
  add column if not exists trend_label text,
  add column if not exists trend_score integer,
  add column if not exists originality_score integer,
  add column if not exists professions text[] default '{}',
  add column if not exists age_groups text[] default '{}';

create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  current_price numeric not null,
  old_price numeric,
  checked_at timestamptz not null default now()
);

create index if not exists price_history_product_checked_idx on price_history(product_id, checked_at desc);
create index if not exists products_trend_score_idx on products(trend_score desc nulls last);
