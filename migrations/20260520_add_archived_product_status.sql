-- Migration: allow archived products and keep archived rows out of public lists.

alter table products
  drop constraint if exists products_status_check;

alter table products
  add constraint products_status_check
  check (status in ('draft', 'active', 'archived'));

create index if not exists products_status_idx on products(status);
