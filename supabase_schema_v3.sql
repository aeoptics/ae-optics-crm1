-- ============================================================
-- AE Optics CRM v3 — شركات الشحن + المصروفات + الموظفين + الصلاحيات
-- شغّل في Supabase SQL Editor
-- ============================================================

-- ── 1. جدول العملاء الموحد ────────────────────────────────
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text not null,
  email text,
  notes text,
  can_reorder text default 'نعم',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger if not exists trg_customers_updated before update on customers
  for each row execute function touch_updated_at();
alter table customers enable row level security;
drop policy if exists "auth_all_customers" on customers;
create policy "auth_all_customers" on customers for all using (auth.role() = 'authenticated');

-- ── 2. جدول الوصفات الطبية ───────────────────────────────
create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  order_id uuid,
  sph_od numeric(5,2), cyl_od numeric(5,2), axis_od integer,
  sph_os numeric(5,2), cyl_os numeric(5,2), axis_os integer,
  pd numeric(5,1), pd_right numeric(5,1), pd_left numeric(5,1),
  add_power numeric(5,2),
  prescription_image_url text,
  notes text,
  created_at timestamptz default now()
);
alter table prescriptions enable row level security;
drop policy if exists "auth_all_prescriptions" on prescriptions;
create policy "auth_all_prescriptions" on prescriptions for all using (auth.role() = 'authenticated');

-- ── 3. جدول شركات الشحن ──────────────────────────────────
create table if not exists shipping_companies (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ── 4. أسعار الشحن لكل شركة ومحافظة ─────────────────────
create table if not exists shipping_rates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references shipping_companies(id) on delete cascade,
  governorate text not null,
  customer_price numeric(10,2) default 0,
  store_cost numeric(10,2) default 0,
  unique(company_id, governorate)
);

alter table shipping_companies enable row level security;
alter table shipping_rates enable row level security;
drop policy if exists "auth_all_shipping_cos" on shipping_companies;
drop policy if exists "auth_all_shipping_rates" on shipping_rates;
create policy "auth_all_shipping_cos" on shipping_companies for all using (auth.role() = 'authenticated');
create policy "auth_all_shipping_rates" on shipping_rates for all using (auth.role() = 'authenticated');

-- بيانات شركات الشحن الافتراضية
insert into shipping_companies (name) values
  ('Bosta'), ('Aramex'), ('Mylerz'), ('Courier'), ('Internal Delivery')
on conflict (name) do nothing;

-- المحافظات المصرية
do $$
declare
  gov text[] := array['القاهرة','الجيزة','الإسكندرية','الدقهلية','الشرقية',
    'البحيرة','الغربية','المنوفية','القليوبية','الفيوم','بني سويف',
    'المنيا','أسيوط','سوهاج','قنا','الأقصر','أسوان','البحر الأحمر',
    'مطروح','شمال سيناء','جنوب سيناء','الإسماعيلية','السويس','بور سعيد',
    'كفر الشيخ','دمياط'];
  comp record;
  g text;
begin
  for comp in select id from shipping_companies loop
    foreach g in array gov loop
      insert into shipping_rates (company_id, governorate, customer_price, store_cost)
      values (comp.id, g, 0, 0)
      on conflict (company_id, governorate) do nothing;
    end loop;
  end loop;
end;
$$;

-- ── 5. جدول المصروفات ────────────────────────────────────
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  category text not null,
  amount numeric(10,2) not null,
  description text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table expenses enable row level security;
drop policy if exists "auth_all_expenses" on expenses;
create policy "auth_all_expenses" on expenses for all using (auth.role() = 'authenticated');

-- ── 6. جدول الموظفين والصلاحيات ──────────────────────────
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  role text not null default 'moderator',
  -- roles: admin | call_center | moderator | operations | accountant
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table employees enable row level security;
drop policy if exists "auth_all_employees" on employees;
create policy "auth_all_employees" on employees for all using (auth.role() = 'authenticated');

-- ── 7. تعديل جدول orders ─────────────────────────────────
alter table orders
  add column if not exists product_type text default 'نظارات طبية',
  add column if not exists customer_id uuid references customers(id),
  add column if not exists prescription_id uuid references prescriptions(id),
  add column if not exists shipping_company_id uuid references shipping_companies(id),
  add column if not exists governorate text,
  add column if not exists shipping_type text default 'عادي',
  -- عادي / مجاني / استلام من الفرع
  add column if not exists customer_shipping_price numeric(10,2) default 0,
  add column if not exists store_shipping_cost numeric(10,2) default 0,
  add column if not exists discount_type text default 'نقدي',
  -- نقدي / نسبة مئوية
  add column if not exists discount_percent numeric(5,2) default 0,
  -- عدسات لاصقة
  add column if not exists contact_lens_brand text,
  add column if not exists contact_lens_type text,
  add column if not exists contact_lens_power_od numeric(5,2),
  add column if not exists contact_lens_power_os numeric(5,2),
  add column if not exists contact_lens_bc numeric(4,2),
  add column if not exists contact_lens_diameter numeric(4,2),
  add column if not exists contact_lens_quantity integer,
  add column if not exists contact_lens_cost numeric(10,2) default 0,
  add column if not exists lens_cost numeric(10,2) default 0;

-- ── 8. function: إيجاد أو إنشاء عميل ────────────────────
create or replace function get_or_create_customer(p_phone text, p_name text)
returns uuid language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from customers where phone = p_phone;
  if v_id is null then
    insert into customers (phone, name) values (p_phone, p_name) returning id into v_id;
  else
    update customers set name = p_name, updated_at = now() where id = v_id;
  end if;
  return v_id;
end;
$$;

-- ── 9. indexes ────────────────────────────────────────────
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_prescriptions_customer_id on prescriptions(customer_id);
create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_expenses_date on expenses(date);
create index if not exists idx_shipping_rates_company on shipping_rates(company_id);
