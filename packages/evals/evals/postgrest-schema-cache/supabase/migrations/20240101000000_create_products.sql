-- Initial products table
create table if not exists products (
  id bigint primary key generated always as identity,
  name text not null,
  price numeric(10, 2) not null default 0
);

alter table products enable row level security;
