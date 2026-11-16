import { uploadFileToSupabase } from '@/lib/storage';
import {
  Attendance,
  Project,
  ProjectProgressLog,
  ExpenseClaim,
  Invoice,
  WarehouseStock,
  DeliveryOrder,
} from '@/types/database';

// ============================================================================
// 1. ABSENSI (ATTENDANCE) API
// ============================================================================

export async function fetchAttendances(): Promise<Attendance[]> {
  try {
    const res = await fetch('/api/attendance', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data as Attendance[];
      }
    }
  } catch (err) {
    console.error('fetchAttendances API error:', err);
  }
  return [];
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
  let photoUrl = '';
  if (params.photoBlob) {
    const filename = `selfie_${params.userId}_${Date.now()}.jpg`;
    photoUrl = await uploadFileToSupabase('attendance-photos', filename, params.photoBlob);
  }

  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: params.userId,
      status: params.status,
      latitude: params.latitude,
      longitude: params.longitude,
      officeId: params.officeId,
      address: params.address,
      notes: params.notes,
      photoUrl,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Gagal menyimpan absensi ke Supabase');
  }

  const json = await res.json();
  return json.data as Attendance;
}

// ============================================================================
// 2. PROJECT PROGRESS API
// ============================================================================

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.projects)) {
        return json.projects as Project[];
      }
    }
  } catch (err) {
    console.error('fetchProjects API error:', err);
  }
  return [];
}

export async function fetchProgressLogs(): Promise<ProjectProgressLog[]> {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.logs)) {
        return json.logs as ProjectProgressLog[];
      }
    }
  } catch (err) {
    console.error('fetchProgressLogs API error:', err);
  }
  return [];
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
  const timestamp = Date.now();
  let beforeUrl = '';
  let progressUrl = '';
  let afterUrl = '';

  if (params.photoBefore) {
    beforeUrl = await uploadFileToSupabase('project-progress', `before_${timestamp}.jpg`, params.photoBefore);
  }
  if (params.photoProgress) {
    progressUrl = await uploadFileToSupabase('project-progress', `progress_${timestamp}.jpg`, params.photoProgress);
  }
  if (params.photoAfter) {
    afterUrl = await uploadFileToSupabase('project-progress', `after_${timestamp}.jpg`, params.photoAfter);
  }

  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: params.projectId,
      siteId: params.siteId,
      technicianId: params.technicianId,
      volumeRealized: params.volumeRealized,
      description: params.description,
      photoBeforeUrl: beforeUrl,
      photoProgressUrl: progressUrl,
      photoAfterUrl: afterUrl,
      hasIssues: params.hasIssues,
      issueDescription: params.issueDescription,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Gagal menyimpan progres proyek ke Supabase');
  }

  const json = await res.json();
  return json.data as ProjectProgressLog;
}

// ============================================================================
// 3. FINANCE & EXPENSES API
// ============================================================================

export async function fetchExpenses(): Promise<ExpenseClaim[]> {
  try {
    const res = await fetch('/api/finance', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.expenses)) {
        return json.expenses as ExpenseClaim[];
      }
    }
  } catch (err) {
    console.error('fetchExpenses API error:', err);
  }
  return [];
}

export async function fetchInvoices(): Promise<Invoice[]> {
  try {
    const res = await fetch('/api/finance', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.invoices)) {
        return json.invoices as Invoice[];
      }
    }
  } catch (err) {
    console.error('fetchInvoices API error:', err);
  }
  return [];
}

export async function submitExpenseClaim(params: {
  userId: string;
  projectId?: string;
  category: any;
  amount: number;
  description: string;
  receiptFile?: Blob | File;
}): Promise<ExpenseClaim> {
  let receiptUrl = '';
  if (params.receiptFile) {
    receiptUrl = await uploadFileToSupabase(
      'finance-receipts',
      `receipt_${Date.now()}.jpg`,
      params.receiptFile
    );
  }

  const res = await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: params.userId,
      projectId: params.projectId,
      category: params.category,
      amount: params.amount,
      description: params.description,
      receiptUrl,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Gagal menyimpan klaim ke Supabase');
  }

  const json = await res.json();
  return json.data as ExpenseClaim;
}

export async function updateExpenseStatus(
  claimId: string,
  newStatus: string,
  reviewerId: string,
  notes?: string
): Promise<void> {
  const res = await fetch('/api/finance', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claimId,
      status: newStatus,
      reviewerId,
      notes,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    console.warn('Update expense error:', errJson);
  }
}

// ============================================================================
// 4. WAREHOUSE & INVENTORY API
// ============================================================================

export async function fetchStocks(): Promise<WarehouseStock[]> {
  try {
    const res = await fetch('/api/warehouse', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data as WarehouseStock[];
      }
    }
  } catch (err) {
    console.error('fetchStocks API error:', err);
  }
  return [];
}

export async function submitInboundStock(params: {
  itemId: string;
  warehouseId: string;
  quantity: number;
  referenceNumber: string;
  notes?: string;
  receivedBy: string;
}): Promise<WarehouseStock> {
  const res = await fetch('/api/warehouse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId: params.itemId,
      warehouseId: params.warehouseId,
      quantity: params.quantity,
      referenceNumber: params.referenceNumber,
      notes: params.notes,
      receivedBy: params.receivedBy,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Gagal menyimpan stok masuk');
  }

  const json = await res.json();
  return json.data as WarehouseStock;
}

// ============================================================================
// 5. LOGISTICS & POD API
// ============================================================================

export async function fetchDeliveryOrders(): Promise<DeliveryOrder[]> {
  try {
    const res = await fetch('/api/logistics', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data as DeliveryOrder[];
      }
    }
  } catch (err) {
    console.error('fetchDeliveryOrders API error:', err);
  }
  return [];
}

export async function submitProofOfDelivery(params: {
  deliveryOrderId: string;
  recipientName: string;
  notes: string;
  signatureBlob?: Blob;
  podPhotoFile?: Blob | File;
}): Promise<void> {
  const timestamp = Date.now();
  let sigUrl = '';
  let photoUrl = '';

  if (params.signatureBlob) {
    sigUrl = await uploadFileToSupabase(
      'logistics-pod',
      `signature_${params.deliveryOrderId}_${timestamp}.png`,
      params.signatureBlob
    );
  }
  if (params.podPhotoFile) {
    photoUrl = await uploadFileToSupabase(
      'logistics-pod',
      `pod_${params.deliveryOrderId}_${timestamp}.jpg`,
      params.podPhotoFile
    );
  }

  const res = await fetch('/api/logistics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deliveryOrderId: params.deliveryOrderId,
      recipientName: params.recipientName,
      notes: params.notes,
      signatureUrl: sigUrl,
      podPhotoUrl: photoUrl,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Gagal mengupdate POD di Supabase');
  }
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
  const res = await fetch('/api/logistics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || 'Gagal membuat Surat Jalan');
  }

  const json = await res.json();
  return json.data as DeliveryOrder;
}
