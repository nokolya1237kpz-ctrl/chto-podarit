-- Compare MVP: parser cache, search snapshots and click logging.

create table if not exists parser_cache (
  url text primary key,
  body text not null,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists price_search_results (
  result_key text primary key,
  query text,
  title text,
  marketplace text,
  price numeric,
  old_price numeric,
  url text,
  image_url text,
  source_provider text,
  checked_at timestamptz not null default now()
);

create table if not exists product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  marketplace text,
  url text,
  source_page text,
  clicked_at timestamptz not null default now()
);

create index if not exists product_clicks_clicked_idx on product_clicks(clicked_at desc);
create index if not exists price_search_results_query_idx on price_search_results(query);
