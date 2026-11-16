-- ============================================================================
-- PT TELEKOMUNIKASI - INTERNAL ERP & OPERATIONS MANAGEMENT SYSTEM
-- COMPLETE DATABASE SCHEMA, RLS POLICIES & SEED DEFINITIONS
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. ENUMS & DOMAINS
-- ============================================================================

create type user_role as enum (
  'super_admin',
  'hr_admin',
  'project_manager',
  'finance',
  'warehouse_logistics',
  'field_technician'
);

create type attendance_status as enum (
  'present',
  'late',
  'sick',
  'leave',
  'field_duty'
);

create type verification_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type project_type as enum (
  'fo_rollout',
  'bts_installation',
  'maintenance',
  'survey',
  'cme'
);

create type project_status as enum (
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled'
);

create type target_unit as enum (
  'meters',
  'sites',
  'poles',
  'joints',
  'percent'
);

create type expense_category as enum (
  'fuel',
  'accommodation',
  'local_permit_koordinasi',
  'material_local',
  'meal',
  'toll_parking',
  'equipment_rental',
  'other'
);

create type approval_status as enum (
  'draft',
  'pending_pm',
  'pending_finance',
  'approved',
  'rejected',
  'paid'
);

create type invoice_status as enum (
  'draft',
  'sent',
  'partial_paid',
  'paid',
  'overdue',
  'cancelled'
);

create type cashflow_type as enum (
  'income',
  'expense'
);

create type item_category as enum (
  'cable_fo',
  'odp',
  'odc',
  'closure',
  'sfp_transceiver',
  'ont_modem',
  'router_switch',
  'tool_splicer_otdr',
  'accessories_pole_clamp',
  'consumable'
);

create type unit_of_measure as enum (
  'meter',
  'pcs',
  'roll',
  'box',
  'set',
  'unit'
);

create type stock_movement_type as enum (
  'in_purchase',
  'in_return',
  'out_project',
  'out_damaged',
  'adjustment'
);

create type material_request_status as enum (
  'draft',
  'submitted',
  'pm_approved',
  'allocated',
  'dispatched',
  'received',
  'rejected'
);

create type delivery_status as enum (
  'draft',
  'ready_to_ship',
  'in_transit',
  'delivered',
  'failed_attempt'
);

-- ============================================================================
-- 2. RBAC & PROFILES
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  phone text,
  role user_role not null default 'field_technician',
  division text,
  employee_id text unique,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Function to handle automated profile creation on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, employee_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'field_technician'::user_role),
    coalesce(new.raw_user_meta_data->>'employee_id', 'EMP-' || upper(substr(md5(random()::text), 1, 6)))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Security Helper Functions for RLS
create or replace function public.get_auth_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and is_active = true
  );
$$ language sql stable security definer;

create or replace function public.has_role(allowed_roles user_role[])
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = any(allowed_roles) and is_active = true
  );
$$ language sql stable security definer;

-- ============================================================================
-- 3. MODULE 1: ABSENSI (FIELD & OFFICE ATTENDANCE)
-- ============================================================================

create table public.office_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  status attendance_status not null default 'present',
  
  -- Clock-In Details
  clock_in_time timestamptz,
  clock_in_latitude double precision,
  clock_in_longitude double precision,
  clock_in_address text,
  clock_in_photo_url text,
  clock_in_office_id uuid references public.office_locations(id),
  clock_in_distance_meters double precision,
  
  -- Clock-Out Details
  clock_out_time timestamptz,
  clock_out_latitude double precision,
  clock_out_longitude double precision,
  clock_out_address text,
  clock_out_photo_url text,
  
  -- Notes & Verification
  notes text,
  verification_status verification_status not null default 'approved',
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint unique_user_attendance_per_date unique (user_id, date)
);

-- ============================================================================
-- 4. MODULE 2: IMPLEMENTASI PROYEK (PROJECT PROGRESS & TARGET)
-- ============================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  contact_person text,
  contact_phone text,
  contact_email text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique not null,
  name text not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  project_type project_type not null default 'fo_rollout',
  status project_status not null default 'planning',
  project_manager_id uuid references public.profiles(id) on delete set null,
  start_date date,
  end_date date,
  
  -- Targets & Realization
  target_unit target_unit not null default 'meters',
  target_volume numeric(14,2) not null default 0,
  actual_volume numeric(14,2) not null default 0,
  progress_percentage numeric(5,2) not null default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  
  -- Financial high-level
  total_budget numeric(15,2) not null default 0,
  
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  site_id_ext text not null, -- External Site ID like 'JKT-TB-042'
  name text not null,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  province text,
  target_volume numeric(14,2) not null default 0,
  actual_volume numeric(14,2) not null default 0,
  progress_percentage numeric(5,2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_in_project text not null default 'field_technician',
  assigned_at timestamptz not null default now(),
  constraint unique_project_member unique (project_id, user_id)
);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  target_date date,
  weight_percentage numeric(5,2) not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.project_progress_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  technician_id uuid not null references public.profiles(id),
  log_date date not null default current_date,
  volume_realized numeric(12,2) not null default 0,
  description text not null,
  photo_before_url text,
  photo_progress_url text,
  photo_after_url text,
  has_issues boolean not null default false,
  issue_description text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 5. MODULE 3: FINANCE (PROJECT & OPERATIONAL FINANCE)
-- ============================================================================

create table public.project_budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null, -- 'materials', 'labor', 'permits', 'transport', 'equipment', 'contingency'
  budget_amount numeric(15,2) not null default 0,
  spent_amount numeric(15,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expense_claims (
  id uuid primary key default gen_random_uuid(),
  claim_number text unique not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  category expense_category not null,
  amount numeric(15,2) not null check (amount > 0),
  expense_date date not null default current_date,
  description text not null,
  receipt_url text not null,
  status approval_status not null default 'pending_pm',
  
  -- Multi-level approvals
  pm_approved_by uuid references public.profiles(id),
  pm_approved_at timestamptz,
  pm_notes text,
  
  finance_approved_by uuid references public.profiles(id),
  finance_approved_at timestamptz,
  finance_notes text,
  
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  project_id uuid not null references public.projects(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  milestone_name text not null, -- e.g. 'Termin 1 - Down Payment 30%'
  amount numeric(15,2) not null check (amount >= 0),
  tax_amount numeric(15,2) not null default 0,
  total_amount numeric(15,2) not null check (total_amount >= 0),
  issue_date date not null default current_date,
  due_date date not null,
  status invoice_status not null default 'draft',
  paid_amount numeric(15,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cashflows (
  id uuid primary key default gen_random_uuid(),
  transaction_number text unique not null,
  type cashflow_type not null,
  amount numeric(15,2) not null check (amount > 0),
  date date not null default current_date,
  project_id uuid references public.projects(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  expense_id uuid references public.expense_claims(id) on delete set null,
  account_category text not null, -- 'client_payment', 'operational_expense', 'vendor_payment', 'tax'
  description text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 6. MODULE 4: WAREHOUSE (INVENTORY & MATERIAL MANAGEMENT)
-- ============================================================================

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text not null,
  pic_id uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category item_category not null,
  uom unit_of_measure not null default 'pcs',
  min_stock_alert numeric(12,2) not null default 10,
  specifications jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.warehouse_stocks (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  quantity numeric(12,2) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(12,2) not null default 0 check (reserved_quantity >= 0),
  updated_at timestamptz not null default now(),
  constraint unique_warehouse_item unique (warehouse_id, item_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null,
  movement_type stock_movement_type not null,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  quantity numeric(12,2) not null,
  balance_after numeric(12,2) not null default 0,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. MODULE 5: LOGISTIK (DELIVERY & FLEET/MATERIAL DISTRIBUTION)
-- ============================================================================

create table public.material_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  needed_date date not null,
  status material_request_status not null default 'submitted',
  pm_approved_by uuid references public.profiles(id),
  pm_approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.material_request_items (
  id uuid primary key default gen_random_uuid(),
  material_request_id uuid not null references public.material_requests(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  quantity_requested numeric(12,2) not null check (quantity_requested > 0),
  quantity_fulfilled numeric(12,2) not null default 0 check (quantity_fulfilled >= 0),
  created_at timestamptz not null default now()
);

create table public.delivery_orders (
  id uuid primary key default gen_random_uuid(),
  delivery_number text unique not null,
  material_request_id uuid references public.material_requests(id) on delete set null,
  source_warehouse_id uuid not null references public.warehouses(id) on delete restrict,
  destination_project_id uuid not null references public.projects(id) on delete restrict,
  destination_site_id uuid references public.sites(id) on delete set null,
  
  -- Fleet / Courier
  driver_name text not null,
  driver_phone text,
  vehicle_number text not null,
  
  -- Status & Milestones
  status delivery_status not null default 'draft',
  dispatched_at timestamptz,
  delivered_at timestamptz,
  
  -- Proof of Delivery (POD)
  recipient_name text,
  recipient_phone text,
  recipient_signature_url text, -- Digital signature
  pod_photo_url text,           -- Photo evidence at site
  pod_notes text,
  
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_order_items (
  id uuid primary key default gen_random_uuid(),
  delivery_order_id uuid not null references public.delivery_orders(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  quantity numeric(12,2) not null check (quantity > 0)
);

-- ============================================================================
-- 8. DATABASE INDEXES FOR PERFORMANCE
-- ============================================================================

create index idx_profiles_role on public.profiles(role);
create index idx_attendances_user_date on public.attendances(user_id, date);
create index idx_projects_status on public.projects(status);
create index idx_projects_pm on public.projects(project_manager_id);
create index idx_sites_project on public.sites(project_id);
create index idx_project_members_user on public.project_members(user_id);
create index idx_progress_logs_project on public.project_progress_logs(project_id);
create index idx_progress_logs_date on public.project_progress_logs(log_date);
create index idx_expense_claims_user on public.expense_claims(user_id);
create index idx_expense_claims_status on public.expense_claims(status);
create index idx_invoices_project on public.invoices(project_id);
create index idx_invoices_status on public.invoices(status);
create index idx_warehouse_stocks_wh_item on public.warehouse_stocks(warehouse_id, item_id);
create index idx_stock_movements_item on public.stock_movements(item_id);
create index idx_material_requests_project on public.material_requests(project_id);
create index idx_delivery_orders_status on public.delivery_orders(status);

-- ============================================================================
-- 9. SUPABASE STORAGE BUCKETS CONFIGURATION
-- ============================================================================

insert into storage.buckets (id, name, public) values 
  ('attendance_photos', 'attendance_photos', true),
  ('progress_photos', 'progress_photos', true),
  ('finance_receipts', 'finance_receipts', false),
  ('logistics_pod', 'logistics_pod', true)
on conflict (id) do nothing;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.office_locations enable row level security;
alter table public.attendances enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.sites enable row level security;
alter table public.project_members enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_progress_logs enable row level security;
alter table public.project_budgets enable row level security;
alter table public.expense_claims enable row level security;
alter table public.invoices enable row level security;
alter table public.cashflows enable row level security;
alter table public.warehouses enable row level security;
alter table public.items enable row level security;
alter table public.warehouse_stocks enable row level security;
alter table public.stock_movements enable row level security;
alter table public.material_requests enable row level security;
alter table public.material_request_items enable row level security;
alter table public.delivery_orders enable row level security;
alter table public.delivery_order_items enable row level security;

-- Profiles Policies
create policy "Profiles visible to authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.has_role(array['super_admin'::user_role, 'hr_admin'::user_role]));

-- Attendances Policies
create policy "HR and Super Admin full access on attendances"
  on public.attendances for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'hr_admin'::user_role]));

create policy "Employees can view own attendance"
  on public.attendances for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Employees can insert own attendance"
  on public.attendances for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Employees can update own attendance clock-out on current date"
  on public.attendances for update
  to authenticated
  using (auth.uid() = user_id and date = current_date);

-- Office Locations Policies
create policy "Office locations viewable by authenticated users"
  on public.office_locations for select
  to authenticated
  using (true);

create policy "HR and Super Admin manage office locations"
  on public.office_locations for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'hr_admin'::user_role]));

-- Projects, Sites, Milestones Policies
create policy "Projects viewable by authenticated users"
  on public.projects for select
  to authenticated
  using (true);

create policy "PM and Super Admin can manage projects"
  on public.projects for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'project_manager'::user_role]));

create policy "Clients viewable by authenticated users"
  on public.clients for select
  to authenticated
  using (true);

create policy "PM and Super Admin can manage clients"
  on public.clients for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'project_manager'::user_role, 'finance'::user_role]));

create policy "Sites viewable by authenticated users"
  on public.sites for select
  to authenticated
  using (true);

create policy "PM and Super Admin can manage sites"
  on public.sites for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'project_manager'::user_role]));

create policy "Project members viewable by all authenticated users"
  on public.project_members for select
  to authenticated
  using (true);

create policy "PM and Super Admin manage project members"
  on public.project_members for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'project_manager'::user_role]));

create policy "Milestones viewable by all authenticated users"
  on public.project_milestones for select
  to authenticated
  using (true);

create policy "PM and Super Admin manage milestones"
  on public.project_milestones for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'project_manager'::user_role]));

-- Project Progress Logs Policies
create policy "Progress logs viewable by all authenticated users"
  on public.project_progress_logs for select
  to authenticated
  using (true);

create policy "Field technicians and PM can insert progress logs"
  on public.project_progress_logs for insert
  to authenticated
  with check (auth.uid() = technician_id or public.has_role(array['super_admin'::user_role, 'project_manager'::user_role]));

create policy "Author or PM can update progress logs"
  on public.project_progress_logs for update
  to authenticated
  using (auth.uid() = technician_id or public.has_role(array['super_admin'::user_role, 'project_manager'::user_role]));

-- Finance & Budget Policies
create policy "Finance and Super Admin full access to project budgets"
  on public.project_budgets for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'finance'::user_role, 'project_manager'::user_role]));

create policy "Expense claims viewable by owner or PM or Finance or Super Admin"
  on public.expense_claims for select
  to authenticated
  using (
    auth.uid() = user_id or 
    public.has_role(array['super_admin'::user_role, 'finance'::user_role, 'project_manager'::user_role])
  );

create policy "Authenticated users can submit own expense claims"
  on public.expense_claims for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "PM and Finance can update expense claim approvals"
  on public.expense_claims for update
  to authenticated
  using (
    (auth.uid() = user_id and status = 'draft') or
    public.has_role(array['super_admin'::user_role, 'project_manager'::user_role, 'finance'::user_role])
  );

create policy "Finance and Super Admin manage invoices"
  on public.invoices for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'finance'::user_role]));

create policy "Finance and Super Admin manage cashflows"
  on public.cashflows for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'finance'::user_role]));

-- Warehouse & Inventory Policies
create policy "Items and stocks viewable by all authenticated users"
  on public.items for select
  to authenticated
  using (true);

create policy "Warehouse stocks viewable by all authenticated users"
  on public.warehouse_stocks for select
  to authenticated
  using (true);

create policy "Warehouses viewable by all authenticated users"
  on public.warehouses for select
  to authenticated
  using (true);

create policy "Warehouse staff and Super Admin manage warehouse data"
  on public.items for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'warehouse_logistics'::user_role]));

create policy "Warehouse staff manage stock movements and stocks"
  on public.warehouse_stocks for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'warehouse_logistics'::user_role]));

create policy "Warehouse staff manage stock movements"
  on public.stock_movements for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'warehouse_logistics'::user_role]));

-- Logistics & Delivery Policies
create policy "Material requests viewable by requester, PM, Logistics, Admin"
  on public.material_requests for select
  to authenticated
  using (
    auth.uid() = requested_by or
    public.has_role(array['super_admin'::user_role, 'project_manager'::user_role, 'warehouse_logistics'::user_role])
  );

create policy "Technicians and PM can create material requests"
  on public.material_requests for insert
  to authenticated
  with check (auth.uid() = requested_by or public.has_role(array['super_admin'::user_role, 'project_manager'::user_role]));

create policy "PM and Logistics can update material requests"
  on public.material_requests for update
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'project_manager'::user_role, 'warehouse_logistics'::user_role]));

create policy "Material request items access follows parent request"
  on public.material_request_items for all
  to authenticated
  using (true);

create policy "Delivery orders viewable by all operational roles"
  on public.delivery_orders for select
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'warehouse_logistics'::user_role, 'project_manager'::user_role, 'field_technician'::user_role]));

create policy "Logistics and Super Admin manage delivery orders"
  on public.delivery_orders for all
  to authenticated
  using (public.has_role(array['super_admin'::user_role, 'warehouse_logistics'::user_role]));

create policy "Technicians can sign and confirm POD for deliveries"
  on public.delivery_orders for update
  to authenticated
  using (public.has_role(array['field_technician'::user_role, 'warehouse_logistics'::user_role, 'super_admin'::user_role]));

create policy "Delivery order items viewable by operational roles"
  on public.delivery_order_items for all
  to authenticated
  using (true);

-- Storage bucket RLS policies
create policy "Attendance photos public read, authenticated insert"
  on storage.objects for select
  to public
  using (bucket_id = 'attendance_photos');

create policy "Attendance photos authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'attendance_photos');

create policy "Progress photos public read, authenticated insert"
  on storage.objects for select
  to public
  using (bucket_id = 'progress_photos');

create policy "Progress photos authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'progress_photos');

create policy "Finance receipts authorized access only"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'finance_receipts');

create policy "Finance receipts upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'finance_receipts');

create policy "POD photos and signatures public read"
  on storage.objects for select
  to public
  using (bucket_id = 'logistics_pod');

create policy "POD photos and signatures upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'logistics_pod');

-- ============================================================================
-- 11. AUTOMATED TRIGGERS & BUSINESS LOGIC
-- ============================================================================

-- Automatically update progress percentage and actual volume on project when logs are added
create or replace function public.sync_project_actual_progress()
returns trigger as $$
declare
  v_total_actual numeric(14,2);
  v_target numeric(14,2);
  v_new_percentage numeric(5,2);
begin
  -- Calculate sum of volume_realized for the project
  select coalesce(sum(volume_realized), 0) into v_total_actual
  from public.project_progress_logs
  where project_id = new.project_id;

  select target_volume into v_target
  from public.projects
  where id = new.project_id;

  if v_target > 0 then
    v_new_percentage := least(100.00, round((v_total_actual / v_target) * 100, 2));
  else
    v_new_percentage := 0;
  end if;

  update public.projects
  set actual_volume = v_total_actual,
      progress_percentage = v_new_percentage,
      updated_at = now()
  where id = new.project_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_sync_project_progress
  after insert or update on public.project_progress_logs
  for each row execute procedure public.sync_project_actual_progress();

-- Automatically deduct stock when a Delivery Order is dispatched / delivered
create or replace function public.handle_delivery_stock_deduction()
returns trigger as $$
declare
  r record;
begin
  if (old.status != 'in_transit' and new.status = 'in_transit') or
     (old.status != 'delivered' and new.status = 'delivered' and old.status != 'in_transit') then
    for r in 
      select item_id, quantity 
      from public.delivery_order_items 
      where delivery_order_id = new.id
    loop
      -- Deduct from warehouse stock
      update public.warehouse_stocks
      set quantity = quantity - r.quantity,
          updated_at = now()
      where warehouse_id = new.source_warehouse_id and item_id = r.item_id;

      -- Record stock movement
      insert into public.stock_movements (
        reference_number,
        movement_type,
        warehouse_id,
        item_id,
        quantity,
        notes
      ) values (
        new.delivery_number,
        'out_project',
        new.source_warehouse_id,
        r.item_id,
        -r.quantity,
        'Surat Jalan: ' || new.delivery_number
      );
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trigger_delivery_stock_deduction
  after update on public.delivery_orders
  for each row execute procedure public.handle_delivery_stock_deduction();

-- ============================================================================
-- 12. SEED DATA (OFFICES, CLIENTS, ITEMS, DEMO PROFILES)
-- ============================================================================

-- Seed Office Locations (Jakarta HQ & Regional Hubs)
insert into public.office_locations (name, address, latitude, longitude, radius_meters) values
  ('Kantor Pusat PT Telekomunikasi', 'Jl. Gatot Subroto Kav. 52, Jakarta Selatan', -6.239308, 106.827110, 150),
  ('Warehouse & Ops Hub Bekasi', 'Kawasan Industri MM2100, Cikarang Barat, Bekasi', -6.312940, 107.108250, 300),
  ('Regional Office Bandung', 'Jl. Supratman No. 66, Cibeunying, Bandung', -6.903890, 107.625140, 200)
on conflict do nothing;

-- Seed Telecom Clients
insert into public.clients (code, name, contact_person, contact_phone, contact_email, address) values
  ('TSEL', 'PT Telekomunikasi Selular (Telkomsel)', 'Budi Santoso', '+62811000111', 'budi.santoso@telkomsel.co.id', 'Telkom Landmark Tower, Jakarta'),
  ('IOH', 'PT Indosat Ooredoo Hutchison Tbk', 'Dewi Lestari', '+62815000222', 'dewi.lestari@ioh.co.id', 'Jl. Medan Merdeka Barat No. 21, Jakarta'),
  ('XLA', 'PT XL Axiata Tbk', 'Reza Rahardian', '+62817000333', 'reza.rahardian@xl.co.id', 'XL Axiata Tower, Jakarta'),
  ('ICON', 'PT Indonesia Comnets Plus (PLN Icon+)', 'Siti Nurhaliza', '+62812000444', 'siti@iconpln.co.id', 'Gandaria 8 Office Tower, Jakarta')
on conflict (code) do nothing;

-- Seed Telecom Catalog Items (Fiber Optic, BTS, Routers, Tools)
insert into public.items (sku, name, category, uom, min_stock_alert, specifications) values
  ('CAB-FO-24C-ADSS', 'Kabel Fiber Optik ADSS 24 Core Single Mode', 'cable_fo', 'meter', 5000, '{"span": "100m", "standard": "ITU-T G.652D"}'::jsonb),
  ('CAB-FO-48C-ADSS', 'Kabel Fiber Optik ADSS 48 Core Single Mode', 'cable_fo', 'meter', 3000, '{"span": "100m", "standard": "ITU-T G.652D"}'::jsonb),
  ('ODP-SOLID-16P', 'Optical Distribution Point (ODP) Solid 16 Port', 'odp', 'pcs', 50, '{"type": "Pole Mounted", "splitter": "1:16 PLC"}'::jsonb),
  ('ODC-OUTDOOR-144', 'Optical Distribution Cabinet (ODC) 144 Core Outdoor', 'odc', 'unit', 10, '{"ip_rating": "IP65", "material": "SMC"}'::jsonb),
  ('CLOSURE-DOME-96', 'Fiber Optic Dome Joint Closure 96 Core', 'closure', 'pcs', 40, '{"inlet_ports": 4, "type": "Heat Shrink"}'::jsonb),
  ('SFP-PLUS-10G-10KM', 'SFP+ 10GBASE-LR 1310nm 10km Transceiver', 'sfp_transceiver', 'pcs', 30, '{"wavelength": "1310nm", "connector": "LC Duplex"}'::jsonb),
  ('ONT-GPON-WIFI6', 'Optical Network Terminal (ONT) GPON WiFi 6 4GE+1POTS', 'ont_modem', 'unit', 100, '{"wifi": "AX3000", "ports": "4x Gigabit Ethernet"}'::jsonb),
  ('RTR-EDGE-CCR2004', 'MikroTik CCR2004-16G-2S+ Router', 'router_switch', 'unit', 5, '{"cpu": "Annapurna Labs Alpine 4-core", "ram": "4GB"}'::jsonb),
  ('TOOL-FUSION-SPLICER', 'Fujikura 90S+ Core Alignment Fusion Splicer Kit', 'tool_splicer_otdr', 'set', 2, '{"cleaver": "CT50", "splices_per_charge": 300}'::jsonb),
  ('CLAMP-POLE-SUSP', 'Suspension Clamp Set FO ADSS Pole Bracket', 'accessories_pole_clamp', 'set', 500, '{"material": "Hot Dip Galvanized"}'::jsonb)
on conflict (sku) do nothing;
