# PT Telekomunikasi Indonesia - Deployment & Operations Guide

Panduan lengkap deployment sistem ERP dan Operasional PT Telekomunikasi ke **Cloudflare Pages (Edge Runtime)** dan **Supabase (PostgreSQL + RLS + Auth + Storage)**.

---

## 1. Setup Supabase (Database, Auth & Storage)

### A. Buat Project Supabase
1. Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru:
   - **Name:** `pt-telekomunikasi-erp`
   - **Database Password:** Buat password yang kuat dan simpan dengan aman.
   - **Region:** `Southeast Asia (Singapore) - ap-southeast-1` (Latensi terendah untuk Indonesia).

### B. Jalankan Skrip Migrasi SQL
Buka **SQL Editor** di Supabase Dashboard, lalu salin dan jalankan seluruh isi file migrasi:
`supabase/migrations/20261116000000_init_telecom_erp.sql`

Skrip ini akan otomatis membuat:
- **Tipe ENUM & 18 Tabel Terelasi:** `profiles`, `office_locations`, `attendances`, `clients`, `projects`, `sites`, `project_members`, `project_milestones`, `project_progress_logs`, `project_budgets`, `expense_claims`, `invoices`, `cashflows`, `warehouses`, `items`, `warehouse_stocks`, `material_requests`, `delivery_orders`.
- **4 Storage Buckets:** `attendance_photos`, `progress_photos`, `finance_receipts`, `logistics_pod`.
- **Row Level Security (RLS) Policies:** Pengamanan data berbasis peran (`super_admin`, `hr_admin`, `project_manager`, `finance`, `warehouse_logistics`, `field_technician`).
- **Database Triggers:**
  - Auto-sinkronisasi progres proyek dan persentase fisik saat teknisi menginput log harian.
  - Auto-deduction stok barang gudang saat Surat Jalan diterbitkan (`in_transit`).
- **Data Awal (Seed Data):** Kantor Jakarta/Bekasi/Bandung, Klien Telkomsel/Indosat/XL, dan Master Katalog FO/ODP/ODC/Splicer.

---

## 2. Konfigurasi Environment Variables

Buat atau edit file `.env.local` di root proyek:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI..."

# Application Metadata
NEXT_PUBLIC_APP_NAME="PT Telekomunikasi Operations ERP"
NEXT_PUBLIC_COMPANY_NAME="PT Telekomunikasi Indonesia"
NEXT_PUBLIC_APP_URL="https://erp.telekomunikasi.co.id"
```

---

## 3. Menjalankan di Mode Pengembangan Lokal (Local Dev)

```bash
# Jalankan development server dengan Turbopack
npm run dev
```

Buka browser di `http://localhost:3000`. Sistem akan mengarahkan ke halaman login. Anda dapat:
- Login menggunakan form standar Supabase Auth.
- Atau menggunakan fitur **Quick Role Login (Evaluator Mode)** untuk langsung menguji tampilan dan hak akses masing-masing dari 6 peran (`super_admin`, `hr_admin`, `project_manager`, `finance`, `warehouse_logistics`, `field_technician`).

---

## 4. Deployment ke Cloudflare Pages

### A. Autentikasi Wrangler CLI
```bash
npx wrangler login
```

### B. Build untuk Cloudflare Pages Edge
Aplikasi ini sudah dikonfigurasi dengan adapter Cloudflare Pages dan `@cloudflare/next-on-pages` / `@opennextjs/cloudflare`:

```bash
# Build bundle khusus Cloudflare Pages output
npm run pages:build
```

### C. Deploy ke Cloudflare Pages
```bash
# Deploy folder output ke Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=pt-telecom-erp
```

### D. Konfigurasi Environment Variables di Cloudflare Dashboard
Buka **Cloudflare Dashboard** -> **Workers & Pages** -> **pt-telecom-erp** -> **Settings** -> **Environment variables**, lalu tambahkan:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_VERSION`: `20` atau `22`

---

## 5. Verifikasi Checklist Fitur

1. **Modul Absensi (`/dashboard/attendance`):**
   - Ambil koordinat GPS live dengan tombol *Perbarui GPS*.
   - Validasi Geofencing: sistem mengecek jarak ke kantor terdaftar (Kantor Pusat Jakarta / Hub Bekasi).
   - Pengambilan foto selfie clock-in dan export rekap absensi CSV.
2. **Modul Implementasi Proyek (`/dashboard/projects`):**
   - Melihat visualisasi Target vs Realisasi (Chart Recharts).
   - Menginput log harian volume (meter) dengan 3 tahap foto (Before/Progress/After) & flag blocker.
   - Progres fisik proyek otomatis bertambah secara real-time.
3. **Modul Finansial & Reimbursement (`/dashboard/finance`):**
   - Alokasi RAB proyek dan kartu metrik piutang/invoice.
   - Alur approval reimbursement bertingkat: Teknisi Submit -> PM Approve -> Finance Cairkan.
4. **Modul Warehouse (`/dashboard/warehouse`):**
   - Master item katalog kabel FO, ODP, ODC, SFP, Splicer.
   - Peringatan stok di bawah batas minimum (merah).
   - Input penerimaan barang masuk (PO Supplier).
5. **Modul Logistik (`/dashboard/logistics`):**
   - Pemenuhan Material Request (MR) dari proyek.
   - Penerbitan Surat Jalan dengan nama driver dan plat kendaraan.
   - Konfirmasi Proof of Delivery (POD) dengan preview tanda tangan digital dan foto serah terima.
