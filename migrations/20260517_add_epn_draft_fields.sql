-- Migration: add ePN draft support fields to products table

alter table if exists products
  add column if not exists epn_token text,
  add column if not exists advertiser_name text,
  add column if not exists status text not null default 'active',
  add column if not exists source_provider text not null default 'manual';

alter table if exists products
  alter column status set default 'active',
  alter column source_provider set default 'manual';
