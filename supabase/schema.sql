-- Japan Trip Planner - Supabase Schema
-- Run this in Supabase SQL Editor

-- trips
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,  -- '東京' | '大阪' | '京都' | '福岡' | '沖繩' | '札幌'
  days int not null,
  depart_date date not null,
  passengers int not null,
  invite_code char(6) not null unique,
  created_by text not null,
  created_at timestamptz default now()
);

-- trip_members
create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_name text not null,
  joined_at timestamptz default now()
);

-- itinerary_items
create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day int not null,
  spot_id text not null,
  spot_name text not null,
  spot_emoji text not null,
  spot_type text not null,
  duration int not null,  -- minutes
  order_index int not null default 0,
  added_by text not null,
  created_at timestamptz default now()
);

-- chat_messages
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  role text not null,  -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz default now()
);

-- budgets
create table budgets (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  member_name text not null,
  category text not null,  -- '機票' | '住宿' | '餐飲' | '交通' | '購物' | '活動'
  amount int not null,  -- JPY
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table itinerary_items enable row level security;
alter table chat_messages enable row level security;
alter table budgets enable row level security;

-- Permissive policies for anon (public access)
create policy "Allow all for anon - trips"
  on trips for all
  to anon
  using (true)
  with check (true);

create policy "Allow all for anon - trip_members"
  on trip_members for all
  to anon
  using (true)
  with check (true);

create policy "Allow all for anon - itinerary_items"
  on itinerary_items for all
  to anon
  using (true)
  with check (true);

create policy "Allow all for anon - chat_messages"
  on chat_messages for all
  to anon
  using (true)
  with check (true);

create policy "Allow all for anon - budgets"
  on budgets for all
  to anon
  using (true)
  with check (true);

-- Enable realtime for itinerary_items and chat_messages
alter publication supabase_realtime add table itinerary_items;
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table trip_members;
