-- ============================================================
-- AE Optics CRM — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- INVENTORY (Frames only)
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  frame_id text unique,
  name text not null,
  type text, -- طبية / شمس
  gender text, -- رجالي / نسائي / أطفال
  size text,
  color text,
  qty_total integer default 0,
  qty_reserved integer default 0,
  qty_available integer generated always as (qty_total - qty_reserved) stored,
  cost_price numeric(10,2) default 0,
  sell_price numeric(10,2) default 0,
  status text generated always as (
    case when (qty_total - qty_reserved) <= 0 then 'نفد'
         when (qty_total - qty_reserved) <= 3 then 'منخفض'
         else 'متاح' end
  ) stored,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PRICING SETTINGS (Manufacturing cost only)
create table if not exists pricing_settings (
  id uuid primary key default gen_random_uuid(),
  frame_type text unique not null,
  manuf_cost numeric(10,2) default 0,
  updated_at timestamptz default now()
);

insert into pricing_settings (frame_type, manuf_cost) values
  ('Full Frame', 0),
  ('Half Frame', 0),
  ('Rimless', 0)
on conflict (frame_type) do nothing;

-- ORDERS
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  order_date date default current_date,
  customer_name text,
  customer_phone text,
  source text,
  glasses_type text,
  frame_name text,
  frame_type text, -- Full Frame / Half Frame / Rimless
  lens_type text,
  order_value numeric(10,2) default 0,
  shipping_value numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  total_final numeric(10,2) generated always as (order_value + coalesce(shipping_value,0) - coalesce(discount,0)) stored,
  confirmed boolean default false,
  status text default 'Pending Confirmation',
  needs_workshop boolean,
  workshop_sent_date date,
  workshop_return_date date,
  shipping_date date,
  shipping_company text,
  tracking_number text,
  expected_delivery date,
  actual_delivery date,
  delivery_result text,
  refusal_reason text,
  payment_status text default 'عند الاستلام',
  lead_source_detail text,
  assigned_to text,
  first_status text,
  notes text,
  -- Cost / profitability
  frame_cost numeric(10,2) default 0,
  manuf_cost numeric(10,2) default 0,
  actual_shipping_cost numeric(10,2) default 0,
  shipping_support numeric(10,2) generated always as (
    greatest(coalesce(actual_shipping_cost,0) - coalesce(shipping_value,0), 0)
  ) stored,
  total_cost numeric(10,2),
  actual_profit numeric(10,2),
  profit_margin numeric(5,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto order_number trigger
create or replace function set_order_number()
returns trigger language plpgsql as $$
begin
  if new.order_number is null then
    new.order_number := 'ORD-' || to_char(nextval('order_seq'), 'FM0000');
  end if;
  return new;
end;
$$;

create sequence if not exists order_seq start 1;
drop trigger if exists trg_order_number on orders;
create trigger trg_order_number before insert on orders
  for each row execute function set_order_number();

-- Auto updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_orders_updated before update on orders
  for each row execute function touch_updated_at();
create trigger trg_inventory_updated before update on inventory
  for each row execute function touch_updated_at();

-- WORKSHOP ACCOUNTS
create table if not exists workshop_accounts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  order_number text,
  customer_name text,
  frame_type text,
  manuf_cost numeric(10,2) default 0,
  paid text default 'لا', -- نعم / لا / جزئي
  amount_paid numeric(10,2) default 0,
  amount_remaining numeric(10,2) generated always as (
    greatest(coalesce(manuf_cost,0) - coalesce(amount_paid,0), 0)
  ) stored,
  sent_date date,
  received_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CUSTOMER ARCHIVE (view)
create or replace view customer_archive as
select
  customer_phone,
  customer_name,
  max(order_date) as last_order_date,
  max(order_number) as last_order_number,
  count(*) as total_orders,
  sum(total_final) as total_spent,
  max(status) as last_status
from orders
group by customer_phone, customer_name;

-- DASHBOARD VIEW (aggregates)
create or replace view dashboard_stats as
select
  count(*) as total_orders,
  sum(total_final) filter (where status = 'Delivered') as total_revenue,
  avg(total_final) filter (where status = 'Delivered') as avg_order_value,
  count(*) filter (where status = 'Confirmed') as confirmed,
  count(*) filter (where status = 'In Preparation') as in_preparation,
  count(*) filter (where status = 'Sent to Workshop') as sent_to_workshop,
  count(*) filter (where status = 'Ready to Ship') as ready_to_ship,
  count(*) filter (where status = 'Shipped') as shipped,
  count(*) filter (where status = 'Delivered') as delivered,
  count(*) filter (where status = 'Refused on Delivery') as refused,
  count(*) filter (where status = 'Returned') as returned,
  count(*) filter (where status = 'Cancelled') as cancelled,
  count(*) filter (where expected_delivery < current_date and status not in ('Delivered','Cancelled','Refused on Delivery','Returned')) as overdue,
  count(*) filter (where needs_workshop = true) as medical_workshop,
  sum(actual_profit) filter (where status = 'Delivered') as total_profit,
  avg(profit_margin) filter (where status = 'Delivered') as avg_margin
from orders;

-- Row Level Security (enable for team use)
alter table orders enable row level security;
alter table inventory enable row level security;
alter table workshop_accounts enable row level security;
alter table pricing_settings enable row level security;

-- Allow authenticated users full access
create policy "auth_all_orders" on orders for all using (auth.role() = 'authenticated');
create policy "auth_all_inventory" on inventory for all using (auth.role() = 'authenticated');
create policy "auth_all_workshop" on workshop_accounts for all using (auth.role() = 'authenticated');
create policy "auth_all_pricing" on pricing_settings for all using (auth.role() = 'authenticated');
