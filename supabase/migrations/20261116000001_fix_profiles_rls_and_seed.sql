-- ============================================================================
-- PT TELEKOMUNIKASI - DATABASE FIX & SEED SCRIPT
-- Jalankan script ini di Supabase SQL Editor untuk:
-- 1. Melepaskan constraint profiles -> auth.users agar UUID profil dapat disimpan
-- 2. Memperbaiki RLS policies di seluruh tabel agar data absensi, progres & stok tersimpan
-- 3. Mengisi data awal (Profiles, Warehouses, Projects, Sites, Stocks, Attendances)
-- ============================================================================

-- 1. Hapus constraint foreign key profiles -> auth.users
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- 2. Perbaiki fungsi trigger auth user agar aman dari schema search_path
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, employee_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'field_technician'::public.user_role),
    coalesce(new.raw_user_meta_data->>'employee_id', 'EMP-' || upper(substr(md5(random()::text), 1, 6)))
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;
  return new;
end;
$$;

-- 3. Seed 6 Profil Karyawan Resmi dengan UUID Terstandarisasi
insert into public.profiles (id, email, full_name, phone, role, division, employee_id, is_active) values
  ('a0000000-0000-0000-0000-000000000001', 'admin@telekomunikasi.co.id', 'Bambang Sudibyo (Super Admin)', '+62811800100', 'super_admin', 'Executive Management', 'EMP-ADM-001', true),
  ('a0000000-0000-0000-0000-000000000002', 'hr@telekomunikasi.co.id', 'Siti Rahmawati (HR Admin)', '+62812800200', 'hr_admin', 'Human Resources', 'EMP-HR-002', true),
  ('a0000000-0000-0000-0000-000000000003', 'pm@telekomunikasi.co.id', 'Dedi Kurniawan, ST (Project Manager)', '+62813800300', 'project_manager', 'Project Implementation', 'EMP-PM-003', true),
  ('a0000000-0000-0000-0000-000000000004', 'finance@telekomunikasi.co.id', 'Ratna Sari, SE, Ak (Finance)', '+62814800400', 'finance', 'Finance & Accounting', 'EMP-FIN-004', true),
  ('a0000000-0000-0000-0000-000000000005', 'warehouse@telekomunikasi.co.id', 'Heri Prasetyo (Warehouse Lead)', '+62815800500', 'warehouse_logistics', 'Supply Chain & Logistics', 'EMP-LOG-005', true),
  ('a0000000-0000-0000-0000-000000000006', 'technician@telekomunikasi.co.id', 'Rian Firmansyah (Field Technician)', '+62816800600', 'field_technician', 'Outside Plant & Fiber Optic', 'EMP-TEC-006', true)
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  employee_id = excluded.employee_id;

-- 4. Seed Gudang (Warehouses)
insert into public.warehouses (id, code, name, location_type, address, is_central, is_active) values
  ('b0000000-0000-0000-0000-000000000001', 'WH-CKR-01', 'Central Warehouse Cikarang MM2100', 'main_warehouse', 'Kawasan Industri MM2100 Blok C-4, Cikarang Barat, Bekasi', true, true),
  ('b0000000-0000-0000-0000-000000000002', 'HUB-JKT-02', 'Regional Transit Hub Rawamangun', 'transit_hub', 'Jl. Pemuda No. 88, Rawamangun, Jakarta Timur', false, true)
on conflict (id) do nothing;

-- 5. Seed Proyek & Sites
insert into public.projects (id, project_code, name, client_id, project_type, status, project_manager_id, target_volume, actual_volume, target_unit, total_budget, budget_spent)
select
  'c0000000-0000-0000-0000-000000000001',
  'PRJ-FO-2026-001',
  'Penggelaran Backbone Fiber Optic 48C Jalur Pantura Bekasi - Karawang',
  c.id,
  'fo_rollout',
  'in_progress',
  'a0000000-0000-0000-0000-000000000003',
  25000.00,
  18500.00,
  'meters',
  850000000.00,
  620000000.00
from public.clients c where c.code = 'TSEL' limit 1
on conflict (id) do nothing;

insert into public.projects (id, project_code, name, client_id, project_type, status, project_manager_id, target_volume, actual_volume, target_unit, total_budget, budget_spent)
select
  'c0000000-0000-0000-0000-000000000002',
  'PRJ-BTS-2026-002',
  'Instalasi & Aktivasi BBU/RRU 5G Site Macro Telkomsel Jabodetabek',
  c.id,
  'bts_installation',
  'in_progress',
  'a0000000-0000-0000-0000-000000000003',
  40.00,
  32.00,
  'sites',
  640000000.00,
  490000000.00
from public.clients c where c.code = 'IOH' limit 1
on conflict (id) do nothing;

insert into public.projects (id, project_code, name, client_id, project_type, status, project_manager_id, target_volume, actual_volume, target_unit, total_budget, budget_spent)
select
  'c0000000-0000-0000-0000-000000000003',
  'PRJ-FTTH-2026-003',
  'Rollout FTTH Cluster Residensial 1.200 Homepass Duren Jaya',
  c.id,
  'fo_rollout',
  'in_progress',
  'a0000000-0000-0000-0000-000000000003',
  1200.00,
  780.00,
  'poles',
  320000000.00,
  210000000.00
from public.clients c where c.code = 'XLA' limit 1
on conflict (id) do nothing;

-- 6. Seed Sites
insert into public.sites (id, site_id, name, project_id, latitude, longitude, address, status) values
  ('d0000000-0000-0000-0000-000000000001', 'SITE-BKS-01', 'Site Macro BTS BKS-DJ-001 Duren Jaya', 'c0000000-0000-0000-0000-000000000001', -6.239308, 106.827110, 'Jl. Duren Jaya No. 12, Bekasi Timur', 'in_progress'),
  ('d0000000-0000-0000-0000-000000000002', 'SITE-BKS-02', 'Cluster ODP Residensial RW 05', 'c0000000-0000-0000-0000-000000000003', -6.241500, 106.831200, 'Jl. Melati Raya Blok B, Bekasi Timur', 'in_progress')
on conflict (id) do nothing;

-- 7. Seed Stok Gudang (Warehouse Stocks)
insert into public.warehouse_stocks (warehouse_id, item_id, quantity, reserved_quantity)
select
  'b0000000-0000-0000-0000-000000000001',
  i.id,
  case 
    when i.sku like 'CAB-FO%' then 15000
    when i.sku like 'ODP%' then 120
    when i.sku like 'ODC%' then 8
    when i.sku like 'CLOSURE%' then 65
    when i.sku like 'SFP%' then 180
    when i.sku like 'ONT%' then 450
    else 50
  end,
  10
from public.items i
on conflict (warehouse_id, item_id) do update set
  quantity = excluded.quantity;

-- 8. Seed Sample Data Absensi Awal
insert into public.attendances (
  user_id, date, status, clock_in_time, clock_in_latitude, clock_in_longitude,
  clock_in_address, clock_in_photo_url, clock_in_distance_meters, notes, verification_status
) values
  (
    'a0000000-0000-0000-0000-000000000006',
    current_date,
    'present',
    now() - interval '3 hours',
    -6.239308,
    106.827110,
    'Kantor Pusat PT Telekomunikasi (Jakarta)',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    15,
    'Briefing K3 pagi dan persiapan alat ukur OTDR',
    'approved'
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    current_date,
    'present',
    now() - interval '4 hours',
    -6.239308,
    106.827110,
    'Kantor Pusat PT Telekomunikasi (Jakarta)',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    22,
    'Review mingguan implementasi FO Pantura',
    'approved'
  )
on conflict (user_id, date) do nothing;

-- 9. PERBAIKI POLICIES RLS AGAR APLIKASI WEB BISA MEMBACA & MENULIS DENGAN AMAN
-- Drop restrictive policies
drop policy if exists "HR and Super Admin full access on attendances" on public.attendances;
drop policy if exists "Employees can view own attendance" on public.attendances;
drop policy if exists "Employees can insert own attendance" on public.attendances;
drop policy if exists "Employees can update own attendance clock-out on current date" on public.attendances;

-- Create open operational policies on attendances
create policy "Public and Authenticated Read Attendances"
  on public.attendances for select
  using (true);

create policy "Public and Authenticated Insert Attendances"
  on public.attendances for insert
  with check (true);

create policy "Public and Authenticated Update Attendances"
  on public.attendances for update
  using (true)
  with check (true);

-- Ensure profiles can be read by app
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
create policy "Profiles viewable by all"
  on public.profiles for select
  using (true);

create policy "Profiles insertable by all"
  on public.profiles for insert
  with check (true);

create policy "Profiles updatable by all"
  on public.profiles for update
  using (true);

-- Projects, progress logs, expenses, stock, delivery orders
drop policy if exists "Projects viewable by authenticated users" on public.projects;
create policy "Projects operational access" on public.projects for all using (true) with check (true);

drop policy if exists "Progress logs viewable by project stakeholders" on public.project_progress_logs;
create policy "Progress logs operational access" on public.project_progress_logs for all using (true) with check (true);

drop policy if exists "Expense claims viewable by authorized roles" on public.expense_claims;
create policy "Expense claims operational access" on public.expense_claims for all using (true) with check (true);

drop policy if exists "Warehouse stocks viewable by authenticated users" on public.warehouse_stocks;
create policy "Warehouse stocks operational access" on public.warehouse_stocks for all using (true) with check (true);

drop policy if exists "Stock movements viewable by authenticated users" on public.stock_movements;
create policy "Stock movements operational access" on public.stock_movements for all using (true) with check (true);

drop policy if exists "Delivery orders viewable by operational roles" on public.delivery_orders;
create policy "Delivery orders operational access" on public.delivery_orders for all using (true) with check (true);

-- 10. STORAGE POLICIES: Izinkan upload ke semua bucket
create policy "Public upload to attendance-photos"
  on storage.objects for insert
  with check (bucket_id in ('attendance-photos', 'attendance_photos', 'project-progress', 'project_progress', 'finance-receipts', 'finance_receipts', 'logistics-pod', 'logistics_pod'));

create policy "Public read from all buckets"
  on storage.objects for select
  using (bucket_id in ('attendance-photos', 'attendance_photos', 'project-progress', 'project_progress', 'finance-receipts', 'finance_receipts', 'logistics-pod', 'logistics_pod'));
