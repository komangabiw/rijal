export type UserRole =
  | 'super_admin'
  | 'hr_admin'
  | 'project_manager'
  | 'finance'
  | 'warehouse_logistics'
  | 'field_technician';

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'sick'
  | 'leave'
  | 'field_duty';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type ProjectType =
  | 'fo_rollout'
  | 'bts_installation'
  | 'maintenance'
  | 'survey'
  | 'cme';

export type ProjectStatus =
  | 'planning'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type TargetUnit = 'meters' | 'sites' | 'poles' | 'joints' | 'percent';

export type ExpenseCategory =
  | 'fuel'
  | 'accommodation'
  | 'local_permit_koordinasi'
  | 'material_local'
  | 'meal'
  | 'toll_parking'
  | 'equipment_rental'
  | 'other';

export type ApprovalStatus =
  | 'draft'
  | 'pending_pm'
  | 'pending_finance'
  | 'approved'
  | 'rejected'
  | 'paid';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partial_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type CashflowType = 'income' | 'expense';

export type ItemCategory =
  | 'cable_fo'
  | 'odp'
  | 'odc'
  | 'closure'
  | 'sfp_transceiver'
  | 'ont_modem'
  | 'router_switch'
  | 'tool_splicer_otdr'
  | 'accessories_pole_clamp'
  | 'consumable';

export type UnitOfMeasure =
  | 'meter'
  | 'pcs'
  | 'roll'
  | 'box'
  | 'set'
  | 'unit';

export type StockMovementType =
  | 'in_purchase'
  | 'in_return'
  | 'out_project'
  | 'out_damaged'
  | 'adjustment';

export type MaterialRequestStatus =
  | 'draft'
  | 'submitted'
  | 'pm_approved'
  | 'allocated'
  | 'dispatched'
  | 'received'
  | 'rejected';

export type DeliveryStatus =
  | 'draft'
  | 'ready_to_ship'
  | 'in_transit'
  | 'delivered'
  | 'failed_attempt';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  division: string | null;
  employee_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  status: AttendanceStatus;
  clock_in_time: string | null;
  clock_in_latitude: number | null;
  clock_in_longitude: number | null;
  clock_in_address: string | null;
  clock_in_photo_url: string | null;
  clock_in_office_id: string | null;
  clock_in_distance_meters: number | null;
  clock_out_time: string | null;
  clock_out_latitude: number | null;
  clock_out_longitude: number | null;
  clock_out_address: string | null;
  clock_out_photo_url: string | null;
  notes: string | null;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  contact_person: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  project_code: string;
  name: string;
  client_id: string;
  project_type: ProjectType;
  status: ProjectStatus;
  project_manager_id: string | null;
  start_date: string | null;
  end_date: string | null;
  target_unit: TargetUnit;
  target_volume: number;
  actual_volume: number;
  progress_percentage: number;
  total_budget: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  project_manager?: Profile;
}

export interface Site {
  id: string;
  project_id: string;
  site_id_ext: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  province: string | null;
  target_volume: number;
  actual_volume: number;
  progress_percentage: number;
  status: string;
  created_at: string;
}

export interface ProjectProgressLog {
  id: string;
  project_id: string;
  site_id: string | null;
  technician_id: string;
  log_date: string;
  volume_realized: number;
  description: string;
  photo_before_url: string | null;
  photo_progress_url: string | null;
  photo_after_url: string | null;
  has_issues: boolean;
  issue_description: string | null;
  created_at: string;
  technician?: Profile;
  site?: Site;
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  category: string;
  budget_amount: number;
  spent_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseClaim {
  id: string;
  claim_number: string;
  user_id: string;
  project_id: string | null;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  description: string;
  receipt_url: string;
  status: ApprovalStatus;
  pm_approved_by: string | null;
  pm_approved_at: string | null;
  pm_notes: string | null;
  finance_approved_by: string | null;
  finance_approved_at: string | null;
  finance_notes: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
  project?: Project;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  project_id: string;
  client_id: string;
  milestone_name: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  paid_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  project?: Project;
}

export interface Cashflow {
  id: string;
  transaction_number: string;
  type: CashflowType;
  amount: number;
  date: string;
  project_id: string | null;
  invoice_id: string | null;
  expense_id: string | null;
  account_category: string;
  description: string;
  created_by: string | null;
  created_at: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  pic_id: string | null;
  is_active: boolean;
  created_at: string;
  pic?: Profile;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: ItemCategory;
  uom: UnitOfMeasure;
  min_stock_alert: number;
  specifications: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  item_id: string;
  quantity: number;
  reserved_quantity: number;
  updated_at: string;
  warehouse?: Warehouse;
  item?: Item;
}

export interface StockMovement {
  id: string;
  reference_number: string;
  movement_type: StockMovementType;
  warehouse_id: string;
  item_id: string;
  quantity: number;
  balance_after: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  item?: Item;
  warehouse?: Warehouse;
}

export interface MaterialRequest {
  id: string;
  request_number: string;
  project_id: string;
  site_id: string | null;
  requested_by: string;
  needed_date: string;
  status: MaterialRequestStatus;
  pm_approved_by: string | null;
  pm_approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  requester?: Profile;
  project?: Project;
  items?: MaterialRequestItem[];
}

export interface MaterialRequestItem {
  id: string;
  material_request_id: string;
  item_id: string;
  quantity_requested: number;
  quantity_fulfilled: number;
  created_at: string;
  item?: Item;
}

export interface DeliveryOrder {
  id: string;
  delivery_number: string;
  material_request_id: string | null;
  source_warehouse_id: string;
  destination_project_id: string;
  destination_site_id: string | null;
  driver_name: string;
  driver_phone: string | null;
  vehicle_number: string;
  status: DeliveryStatus;
  dispatched_at: string | null;
  delivered_at: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_signature_url: string | null;
  pod_photo_url: string | null;
  pod_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  warehouse?: Warehouse;
  project?: Project;
  site?: Site;
  items?: DeliveryOrderItem[];
}

export interface DeliveryOrderItem {
  id: string;
  delivery_order_id: string;
  item_id: string;
  quantity: number;
  item?: Item;
}
