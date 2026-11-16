import { createClient } from '@/lib/supabase/client';
import { uploadFileToSupabase } from '@/lib/storage';
import {
  Attendance,
  Project,
  Site,
  ProjectProgressLog,
  ExpenseClaim,
  Invoice,
  Item,
  WarehouseStock,
  MaterialRequest,
  DeliveryOrder,
} from '@/types/database';
import {
  DEMO_ATTENDANCES,
  DEMO_PROJECTS,
  DEMO_SITES,
  DEMO_PROGRESS_LOGS,
  DEMO_EXPENSES,
  DEMO_INVOICES,
  DEMO_ITEMS,
  DEMO_STOCKS,
  DEMO_MATERIAL_REQUESTS,
  DEMO_DELIVERY_ORDERS,
} from '@/lib/mock-data';

// ============================================================================
// 1. ABSENSI (ATTENDANCE) API
// ============================================================================

export async function fetchAttendances(): Promise<Attendance[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('attendances')
      .select('*, profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Attendance[];
    }
  } catch (err) {
    console.warn('Supabase fetch attendances fallback:', err);
  }
  return DEMO_ATTENDANCES;
}

export async function submitClockIn(params: {
  userId: string;
  status: string;
  latitude: number;
  longitude: number;
  officeId?: string;
  address?: string;
  notes?: string;
  photoBlob?: Blob;
}): Promise<Attendance> {
  const supabase = createClient();

  let photoUrl = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300';
  if (params.photoBlob) {
    const filename = `selfie_${params.userId}_${Date.now()}.jpg`;
    photoUrl = await uploadFileToSupabase('attendance-photos', filename, params.photoBlob);
  }

  const payload = {
    user_id: params.userId,
    date: new Date().toISOString().slice(0, 10),
    status: params.status,
    clock_in_time: new Date().toISOString(),
    clock_in_latitude: params.latitude,
    clock_in_longitude: params.longitude,
    clock_in_address: params.address || 'Site Lapangan',
    clock_in_photo_url: photoUrl,
    clock_in_office_id: params.officeId || null,
    clock_in_distance_meters: 15,
    notes: params.notes || null,
    verification_status: 'approved',
  };

  try {
    const { data, error } = await supabase
      .from('attendances')
      .upsert(payload)
      .select('*, profile:profiles(*)')
      .single();

    if (!error && data) {
      return data as Attendance;
    }
  } catch (err) {
    console.warn('Supabase clock-in fallback:', err);
  }

  // Graceful fallback return object
  return {
    ...payload,
    id: `att-${Date.now()}`,
    clock_out_time: null,
    clock_out_latitude: null,
    clock_out_longitude: null,
    clock_out_address: null,
    clock_out_photo_url: null,
    verified_by: null,
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as Attendance;
}

// ============================================================================
// 2. PROJECT PROGRESS API
// ============================================================================

export async function fetchProjects(): Promise<Project[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:clients(*), project_manager:profiles(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Project[];
    }
  } catch (err) {
    console.warn('Supabase fetch projects fallback:', err);
  }
  return DEMO_PROJECTS;
}

export async function fetchProgressLogs(): Promise<ProjectProgressLog[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('project_progress_logs')
      .select('*, technician:profiles(*), site:sites(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as ProjectProgressLog[];
    }
  } catch (err) {
    console.warn('Supabase fetch progress logs fallback:', err);
  }
  return DEMO_PROGRESS_LOGS;
}

export async function submitProgressLog(params: {
  projectId: string;
  siteId?: string;
  technicianId: string;
  volumeRealized: number;
  description: string;
  photoBefore?: Blob | File;
  photoProgress?: Blob | File;
  photoAfter?: Blob | File;
  hasIssues?: boolean;
  issueDescription?: string;
}): Promise<ProjectProgressLog> {
  const supabase = createClient();

  const timestamp = Date.now();
  let beforeUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400';
  let progressUrl = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400';
  let afterUrl = 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400';

  if (params.photoBefore) {
    beforeUrl = await uploadFileToSupabase('project-progress', `before_${timestamp}.jpg`, params.photoBefore);
  }
  if (params.photoProgress) {
    progressUrl = await uploadFileToSupabase('project-progress', `progress_${timestamp}.jpg`, params.photoProgress);
  }
  if (params.photoAfter) {
    afterUrl = await uploadFileToSupabase('project-progress', `after_${timestamp}.jpg`, params.photoAfter);
  }

  const payload = {
    project_id: params.projectId,
    site_id: params.siteId || null,
    technician_id: params.technicianId,
    log_date: new Date().toISOString().slice(0, 10),
    volume_realized: params.volumeRealized,
    description: params.description,
    photo_before_url: beforeUrl,
    photo_progress_url: progressUrl,
    photo_after_url: afterUrl,
    has_issues: !!params.hasIssues,
    issue_description: params.issueDescription || null,
  };

  try {
    const { data, error } = await supabase
      .from('project_progress_logs')
      .insert(payload)
      .select('*, technician:profiles(*), site:sites(*)')
      .single();

    if (!error && data) {
      return data as ProjectProgressLog;
    }
  } catch (err) {
    console.warn('Supabase submit progress log fallback:', err);
  }

  return {
    ...payload,
    id: `log-${timestamp}`,
    created_at: new Date().toISOString(),
  } as unknown as ProjectProgressLog;
}

// ============================================================================
// 3. FINANCE & EXPENSES API
// ============================================================================

export async function fetchExpenses(): Promise<ExpenseClaim[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('expense_claims')
      .select('*, user:profiles(*), project:projects(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as ExpenseClaim[];
    }
  } catch (err) {
    console.warn('Supabase fetch expenses fallback:', err);
  }
  return DEMO_EXPENSES;
}

export async function fetchInvoices(): Promise<Invoice[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, client:clients(*), project:projects(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Invoice[];
    }
  } catch (err) {
    console.warn('Supabase fetch invoices fallback:', err);
  }
  return DEMO_INVOICES;
}

export async function submitExpenseClaim(params: {
  userId: string;
  projectId?: string;
  category: any;
  amount: number;
  description: string;
  receiptFile?: Blob | File;
}): Promise<ExpenseClaim> {
  const supabase = createClient();
  const timestamp = Date.now();

  let receiptUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500';
  if (params.receiptFile) {
    receiptUrl = await uploadFileToSupabase('finance-receipts', `receipt_${timestamp}.jpg`, params.receiptFile);
  }

  const payload = {
    claim_number: `EXP-2026-11-${Math.floor(100 + Math.random() * 900)}`,
    user_id: params.userId,
    project_id: params.projectId || null,
    category: params.category,
    amount: params.amount,
    expense_date: new Date().toISOString().slice(0, 10),
    description: params.description,
    receipt_url: receiptUrl,
    status: 'pending_pm',
  };

  try {
    const { data, error } = await supabase
      .from('expense_claims')
      .insert(payload)
      .select('*, user:profiles(*), project:projects(*)')
      .single();

    if (!error && data) {
      return data as ExpenseClaim;
    }
  } catch (err) {
    console.warn('Supabase expense submit fallback:', err);
  }

  return {
    ...payload,
    id: `exp-${timestamp}`,
    pm_approved_by: null,
    pm_approved_at: null,
    pm_notes: null,
    finance_approved_by: null,
    finance_approved_at: null,
    finance_notes: null,
    paid_at: null,
    payment_reference: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as ExpenseClaim;
}

export async function updateExpenseStatus(
  claimId: string,
  newStatus: string,
  reviewerId: string,
  notes?: string
): Promise<void> {
  const supabase = createClient();
  const updatePayload: any = { status: newStatus };

  if (newStatus === 'pending_finance') {
    updatePayload.pm_approved_by = reviewerId;
    updatePayload.pm_approved_at = new Date().toISOString();
    updatePayload.pm_notes = notes || 'Disetujui PM';
  } else if (newStatus === 'paid') {
    updatePayload.finance_approved_by = reviewerId;
    updatePayload.finance_approved_at = new Date().toISOString();
    updatePayload.finance_notes = notes || 'Pencairan dana lunas';
    updatePayload.paid_at = new Date().toISOString();
    updatePayload.payment_reference = `TRF-BCA-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  try {
    await supabase.from('expense_claims').update(updatePayload).eq('id', claimId);
  } catch (err) {
    console.warn('Supabase expense update fallback:', err);
  }
}

// ============================================================================
// 4. WAREHOUSE & INVENTORY API
// ============================================================================

export async function fetchStocks(): Promise<WarehouseStock[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('warehouse_stocks')
      .select('*, item:items(*), warehouse:warehouses(*)')
      .order('quantity', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as WarehouseStock[];
    }
  } catch (err) {
    console.warn('Supabase fetch stocks fallback:', err);
  }
  return DEMO_STOCKS;
}

// ============================================================================
// 5. LOGISTICS & POD API
// ============================================================================

export async function fetchDeliveryOrders(): Promise<DeliveryOrder[]> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from('delivery_orders')
      .select('*, warehouse:warehouses(*), project:projects(*), site:sites(*)')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data as DeliveryOrder[];
    }
  } catch (err) {
    console.warn('Supabase fetch delivery orders fallback:', err);
  }
  return DEMO_DELIVERY_ORDERS;
}

export async function submitProofOfDelivery(params: {
  deliveryOrderId: string;
  recipientName: string;
  notes: string;
  signatureBlob?: Blob;
  podPhotoFile?: Blob | File;
}): Promise<void> {
  const supabase = createClient();
  const timestamp = Date.now();

  let sigUrl = 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300';
  let photoUrl = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400';

  if (params.signatureBlob) {
    sigUrl = await uploadFileToSupabase('logistics-pod', `signature_${params.deliveryOrderId}_${timestamp}.png`, params.signatureBlob);
  }
  if (params.podPhotoFile) {
    photoUrl = await uploadFileToSupabase('logistics-pod', `pod_${params.deliveryOrderId}_${timestamp}.jpg`, params.podPhotoFile);
  }

  const payload = {
    status: 'delivered',
    delivered_at: new Date().toISOString(),
    recipient_name: params.recipientName,
    recipient_signature_url: sigUrl,
    pod_photo_url: photoUrl,
    pod_notes: params.notes,
  };

  try {
    await supabase.from('delivery_orders').update(payload).eq('id', params.deliveryOrderId);
  } catch (err) {
    console.warn('Supabase POD submit fallback:', err);
  }
}

export async function submitInboundStock(params: {
  itemId: string;
  warehouseId: string;
  quantity: number;
  referenceNumber: string;
  notes?: string;
  receivedBy: string;
}): Promise<WarehouseStock> {
  const supabase = createClient();
  try {
    await supabase.from('stock_movements').insert({
      movement_type: 'inbound_supplier',
      item_id: params.itemId,
      destination_warehouse_id: params.warehouseId,
      quantity: params.quantity,
      reference_number: params.referenceNumber,
      notes: params.notes || 'Penerimaan barang dari supplier',
      created_by: params.receivedBy,
    });

    const { data: existing } = await supabase
      .from('warehouse_stocks')
      .select('*')
      .eq('item_id', params.itemId)
      .eq('warehouse_id', params.warehouseId)
      .single();

    if (existing) {
      const { data } = await supabase
        .from('warehouse_stocks')
        .update({
          quantity: Number(existing.quantity) + params.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*, item:items(*), warehouse:warehouses(*)')
        .single();
      if (data) return data as WarehouseStock;
    }
  } catch (err) {
    console.warn('submitInboundStock fallback:', err);
  }
  return {
    id: `ws-${Date.now()}`,
    warehouse_id: params.warehouseId,
    item_id: params.itemId,
    quantity: params.quantity,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as WarehouseStock;
}

export async function submitDeliveryOrder(params: {
  materialRequestId?: string;
  sourceWarehouseId: string;
  destinationProjectId: string;
  destinationSiteId?: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  createdBy: string;
}): Promise<DeliveryOrder> {
  const supabase = createClient();
  const deliveryNumber = `SJ-2026-11-${Math.floor(100 + Math.random() * 900)}`;
  const payload = {
    delivery_number: deliveryNumber,
    material_request_id: params.materialRequestId || null,
    source_warehouse_id: params.sourceWarehouseId,
    destination_project_id: params.destinationProjectId,
    destination_site_id: params.destinationSiteId || null,
    driver_name: params.driverName,
    driver_phone: params.driverPhone,
    vehicle_number: params.vehicleNumber,
    status: 'in_transit' as const,
    dispatched_at: new Date().toISOString(),
    created_by: params.createdBy,
  };

  try {
    const { data, error } = await supabase
      .from('delivery_orders')
      .insert(payload)
      .select('*, warehouse:warehouses(*), project:projects(*), site:sites(*)')
      .single();

    if (!error && data) {
      return data as DeliveryOrder;
    }
  } catch (err) {
    console.warn('submitDeliveryOrder fallback:', err);
  }

  return {
    ...payload,
    id: `do-${Date.now()}`,
    delivered_at: null,
    recipient_name: null,
    recipient_phone: null,
    recipient_signature_url: null,
    pod_photo_url: null,
    pod_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as DeliveryOrder;
}

