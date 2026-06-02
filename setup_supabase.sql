-- Run this in Supabase SQL Editor

create table if not exists depop_listings (
  id text primary key,
  query text,
  title text,
  price real,
  description text,
  seller text,
  image_url text,
  listing_url text,
  sold integer default 0,
  ai_match integer default 0,
  ai_reason text,
  score integer default 0,
  first_seen timestamptz default now(),
  sold_at timestamptz
);

create table if not exists depop_price_history (
  id bigint generated always as identity primary key,
  listing_id text references depop_listings(id),
  price real,
  recorded_at timestamptz default now()
);

create table if not exists depop_sellers (
  username text primary key,
  match_count integer default 0,
  last_seen timestamptz default now()
);
