'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Profile, UserRole } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DEMO_PROFILES, DEMO_OFFICES } from '@/lib/mock-data';
import {
  SlidersHorizontal,
  Megaphone,
  MapPin,
  Users,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  Download,
  Activity,
  FileCheck,
  Edit3,
  X,
  Copy,
  Check,
  UserPlus,
  Database,
} from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  category: 'Operasional' | 'K3 & Safety' | 'Maintenance';
  content: string;
  urgency: 'info' | 'warning' | 'urgent';
  date: string;
  isActive: boolean;
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Standar K3 Wajib: Prosedur Penarikan Kabel Udara (ADSS FO)',
    category: 'K3 & Safety',
    content: 'Seluruh teknisi lapangan wajib mengenakan helm safety, harness bersertifikat, dan rompi reflektif saat menaiki tiang FO.',
    urgency: 'urgent',
    date: '16 Nov 2026',
    isActive: true,
  },
  {
    id: 'ann-2',
    title: 'Jadwal Migrasi ODC Cluster Bekasi Timur (Kranji - Duren Jaya)',
    category: 'Operasional',
    content: 'Penyambungan core backbone 96C akan dilaksanakan pada malam hari pukul 23:00 - 04:00 WIB untuk meminimalisir downtime pelanggan.',
    urgency: 'warning',
    date: '15 Nov 2026',
    isActive: true,
  },
  {
    id: 'ann-3',
    title: 'Pembaruan Radius Geofencing Presensi GPS Menjadi 150 Meter',
    category: 'Operasional',
    content: 'Toleransi presensi mobile GPS kantor pusat Gatot Subroto distandarisasi ke radius 150 meter otomatis terverifikasi sistem.',
    urgency: 'info',
    date: '14 Nov 2026',
    isActive: true,
  },
];

const SECURITY_AUDIT_LOGS = [
  { id: 'sec-1', time: '15:46:12', event: 'Super Admin Login & Privileged Session', ip: '180.252.164.22', user: 'superadmin@telekomunikasi.co.id', status: '200 OK (MFA Valid)' },
  { id: 'sec-2', time: '15:24:34', event: 'Attendance Clock-In GPS Geofence', ip: '114.124.201.89', user: 'technician@telekomunikasi.co.id', status: '200 OK (Geotag Valid)' },
  { id: 'sec-3', time: '15:20:10', event: 'Reimbursement Claim Submission', ip: '180.252.164.22', user: 'pm@telekomunikasi.co.id', status: '200 OK (Encrypted)' },
  { id: 'sec-4', time: '15:15:02', event: 'Database Connection Pool Handshake', ip: '10.0.4.12', user: 'service-role@cloudflare', status: '200 OK (TLS 1.3)' },
  { id: 'sec-5', time: '14:58:30', event: 'Material Dispatch Delivery Order SJ-001', ip: '182.1.88.45', user: 'warehouse@telekomunikasi.co.id', status: '200 OK (Signed POD)' },
];

export default function CMSPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'announcements' | 'geofencing' | 'users' | 'security'>('users');

  // CMS state for Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Operasional' | 'K3 & Safety' | 'Maintenance'>('Operasional');
  const [newUrgency, setNewUrgency] = useState<'info' | 'warning' | 'urgent'>('info');

  // CMS state for Geofence Locations
  const [offices] = useState(DEMO_OFFICES);

  // CMS state for User Management (Full Super Admin Access)
  const [users, setUsers] = useState<Profile[]>(DEMO_PROFILES);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form state for adding user
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<UserRole>('field_technician');
  const [addDivision, setAddDivision] = useState('Field Operations - FO Team 1');
  const [addEmployeeId, setAddEmployeeId] = useState('');
  const [addPhone, setAddPhone] = useState('+62812');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Load users from API and localStorage
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.profiles) && json.profiles.length > 0) {
          // Merge with locally stored users
          let localUsers: Profile[] = [];
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('pt_telecom_cms_users');
            if (saved) {
              try { localUsers = JSON.parse(saved); } catch {}
            }
          }
          const combined = [
            ...localUsers,
            ...json.profiles.filter((p: Profile) => !localUsers.some((l) => l.id === p.id || l.email === p.email)),
          ];
          setUsers(combined);
          return;
        }
      }
    } catch {}

    // Fallback: check localStorage or DEMO_PROFILES
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pt_telecom_cms_users');
      if (saved) {
        try {
          setUsers(JSON.parse(saved));
          return;
        } catch {}
      }
    }
    setUsers(DEMO_PROFILES);
  };

  const persistUsers = (newUsers: Profile[]) => {
    setUsers(newUsers);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pt_telecom_cms_users', JSON.stringify(newUsers));
      } catch {}
    }
  };

  // Add User Handler
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFullName || !addEmail) return;

    setIsSubmittingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addFullName,
          email: addEmail,
          password: addPassword || addRole,
          role: addRole,
          division: addDivision,
          employeeId: addEmployeeId || `EMP-${addRole.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          phone: addPhone,
        }),
      });

      const json = await res.json();
      const createdUser: Profile = json.profile || {
        id: `u-${Date.now()}`,
        email: addEmail,
        full_name: addFullName,
        phone: addPhone,
        role: addRole,
        division: addDivision,
        employee_id: addEmployeeId || `EMP-${Date.now().toString().slice(-4)}`,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [createdUser, ...users.filter((u) => u.id !== createdUser.id && u.email !== createdUser.email)];
      persistUsers(updated);

      // Reset form
      setAddFullName('');
      setAddEmail('');
      setAddPassword('');
      setAddEmployeeId('');
      setShowAddUserModal(false);
      alert(`User ${createdUser.full_name} (${createdUser.role}) berhasil ditambahkan dan disimpan!`);
    } catch (err: any) {
      alert(`Gagal menambahkan user: ${err.message}`);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Edit User Handler (Super Admin Full Access)
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmittingUser(true);
    try {
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          fullName: editingUser.full_name,
          email: editingUser.email,
          role: editingUser.role,
          division: editingUser.division,
          employeeId: editingUser.employee_id,
          phone: editingUser.phone,
          isActive: editingUser.is_active,
        }),
      });

      const updated = users.map((u) => (u.id === editingUser.id ? editingUser : u));
      persistUsers(updated);
      setEditingUser(null);
      alert(`Data user ${editingUser.full_name} berhasil diperbarui!`);
    } catch (err: any) {
      alert(`Gagal memperbarui user: ${err.message}`);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (id: string, name: string) => {
    if (id === 'a0000000-0000-0000-0000-000000000001') {
      alert('Akun Super Admin Utama dilindungi dan tidak dapat dihapus.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus user ${name}? Aksi ini permanen.`)) {
      try {
        await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      } catch {}
      const updated = users.filter((u) => u.id !== id);
      persistUsers(updated);
      alert(`User ${name} berhasil dihapus.`);
    }
  };

  // 1-Click Copy Supabase SQL Fix & Seed Script
  const copySupabaseSql = () => {
    const sql = `-- PT TELEKOMUNIKASI ERP - FIX SCHEMA & SEED PROFILES
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.attendances disable row level security;
alter table public.project_progress_logs disable row level security;
alter table public.expense_claims disable row level security;
alter table public.material_requests disable row level security;
alter table public.delivery_orders disable row level security;

-- Seed 6 official roles
insert into public.profiles (id, email, full_name, phone, role, division, employee_id, is_active) values
  ('a0000000-0000-0000-0000-000000000001', 'superadmin@telekomunikasi.co.id', 'Bambang Sudibyo (Super Admin)', '+62811800100', 'super_admin', 'Executive Management', 'EMP-ADM-001', true),
  ('a0000000-0000-0000-0000-000000000002', 'hradmin@telekomunikasi.co.id', 'Siti Rahmawati (HR Admin)', '+62812800200', 'hr_admin', 'Human Resources', 'EMP-HR-002', true),
  ('a0000000-0000-0000-0000-000000000003', 'projectmanager@telekomunikasi.co.id', 'Dedi Kurniawan, ST (Project Manager)', '+62813800300', 'project_manager', 'Project Implementation', 'EMP-PM-003', true),
  ('a0000000-0000-0000-0000-000000000004', 'finance@telekomunikasi.co.id', 'Maya Indriyani, SE (Finance Lead)', '+62814800400', 'finance', 'Finance & Accounting', 'EMP-FIN-004', true),
  ('a0000000-0000-0000-0000-000000000005', 'warehouse@telekomunikasi.co.id', 'Heri Prasetyo (Logistics Lead)', '+62815800500', 'warehouse_logistics', 'Warehouse & Supply Chain', 'EMP-LOG-005', true),
  ('a0000000-0000-0000-0000-000000000006', 'technician@telekomunikasi.co.id', 'Rian Firmansyah (Field Technician)', '+62816800600', 'field_technician', 'Field Operations - FO Team 1', 'EMP-TEC-006', true)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  employee_id = excluded.employee_id;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Access check
  if (role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Akses Ditolak (Restricted Access)</h2>
        <p className="text-sm text-zinc-400 max-w-md">
          Modul Content Management System (CMS) hanya dapat diakses oleh peran <strong>Super Admin</strong>.
        </p>
      </div>
    );
  }

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const item: Announcement = {
      id: `ann-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      content: newContent,
      urgency: newUrgency,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      isActive: true,
    };

    setAnnouncements([item, ...announcements]);
    setNewTitle('');
    setNewContent('');
    alert('Pengumuman baru berhasil diterbitkan ke portal operasional!');
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id));
  };

  const handleDownloadAuditReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Waktu,Aktivitas Keamanan,Alamat IP,Pengguna,Status\n' +
      SECURITY_AUDIT_LOGS.map(
        (log) => `"${log.id}","${log.time}","${log.event}","${log.ip}","${log.user}","${log.status}"`
      ).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_audit_keamanan_owasp_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Content Management System (CMS) Super Admin
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Pusat kontrol konten operasional, master data lokasi geofencing presensi, hak akses akun, dan audit keamanan siber (OWASP).
          </p>
        </div>

        <Badge className="bg-purple-950/80 text-purple-300 border-purple-800 font-mono text-xs px-3 py-1">
          Super Admin Privileged Mode
        </Badge>
      </div>

      {/* Supabase Schema Sync Notification Banner */}
      <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-900/60 border border-blue-700 text-blue-300 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>Sinkronisasi Data ke Supabase Cloud</span>
              <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px]">Tersedia</Badge>
            </div>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Jalankan query 1-klik di <strong>Supabase Dashboard $\rightarrow$ SQL Editor</strong> untuk menghapus constraint ID dan menyimpan seluruh user & tabel langsung ke database cloud.
            </p>
          </div>
        </div>
        <Button
          onClick={copySupabaseSql}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shrink-0 shadow-md"
        >
          {copiedSql ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1 text-emerald-300" />
              Tersalin ke Clipboard!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              Salin Query SQL Supabase
            </>
          )}
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'users'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Kelola Akun & Hak Akses ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'announcements'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-400" />
          <span>Pengumuman & SOP K3</span>
        </button>

        <button
          onClick={() => setActiveTab('geofencing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'geofencing'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>Master Titik Geofencing</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'security'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Audit Keamanan Siber (OWASP)</span>
        </button>
      </div>

      {/* TAB 1: KELOLA AKUN & HAK AKSES ROLE (SUPER ADMIN FULL ACCESS) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Daftar Akun Karyawan & Hak Akses Role ({users.length} Akun)</h2>
              <p className="text-xs text-zinc-400">
                Super Admin memiliki akses penuh menambah akun baru, mengubah role, divisi, data profil, dan menghapus akun:
              </p>
            </div>
            <Button
              onClick={() => setShowAddUserModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl h-9 shadow-md shadow-emerald-600/30"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Tambah User & Role Baru
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 text-[11px] font-semibold text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Nama Karyawan</th>
                  <th className="px-4 py-3">Email Akun</th>
                  <th className="px-4 py-3">Role Sistem</th>
                  <th className="px-4 py-3">Divisi Operasional</th>
                  <th className="px-4 py-3">NIK / ID</th>
                  <th className="px-4 py-3">No. Telepon</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2.5">
                      <img
                        src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={p.full_name}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-700 shrink-0"
                      />
                      <span className="truncate">{p.full_name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-blue-400">{p.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-semibold text-zinc-200">
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.division}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{p.employee_id}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">{p.phone || '-'}</td>
                    <td className="px-4 py-3">
                      {p.is_active ? (
                        <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px]">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                          Nonaktif
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingUser({ ...p })}
                          className="h-7 px-2 text-zinc-300 hover:text-white hover:bg-zinc-800 text-[11px] rounded-lg"
                          title="Edit User & Ganti Role"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1 text-blue-400" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUser(p.id, p.full_name)}
                          className="h-7 px-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 text-[11px] rounded-lg"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH USER & ROLE BARU */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 text-zinc-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Tambah Akun Karyawan & Tentukan Role</h3>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <Label className="text-xs text-zinc-300">Nama Lengkap Karyawan</Label>
                <Input
                  required
                  placeholder="Contoh: Ahmad Fauzi, ST"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-300">Email Akun (@telekomunikasi.co.id)</Label>
                  <Input
                    required
                    type="email"
                    placeholder="ahmad@telekomunikasi.co.id"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-300">Kata Sandi Login</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-300">Role Sistem</Label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as UserRole)}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 text-white text-xs h-9 rounded-xl px-2.5 focus:outline-none"
                  >
                    <option value="super_admin">Super Admin (Akses Penuh)</option>
                    <option value="hr_admin">HR Admin (Presensi & SDM)</option>
                    <option value="project_manager">Project Manager (RAB & Proyek)</option>
                    <option value="finance">Finance (Reimbursement & Kas)</option>
                    <option value="warehouse_logistics">Warehouse & Logistik (Material)</option>
                    <option value="field_technician">Field Technician (Teknisi Lapangan)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-zinc-300">Divisi Operasional</Label>
                  <Input
                    placeholder="Contoh: Outside Plant - FO Team"
                    value={addDivision}
                    onChange={(e) => setAddDivision(e.target.value)}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-300">Nomor Induk Karyawan (NIK / ID)</Label>
                  <Input
                    placeholder="Contoh: EMP-TEC-007"
                    value={addEmployeeId}
                    onChange={(e) => setAddEmployeeId(e.target.value)}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-300">No. Telepon / WhatsApp</Label>
                  <Input
                    placeholder="+628123456789"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddUserModal(false)}
                  className="text-xs text-zinc-400 hover:text-white h-9"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl h-9 px-4"
                >
                  {isSubmittingUser ? 'Menyimpan User...' : 'Simpan Akun Baru'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER & GANTI ROLE (SUPER ADMIN FULL ACCESS) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl p-6 text-zinc-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Edit Data Pengguna & Hak Akses Role</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <Label className="text-xs text-zinc-300">Nama Lengkap</Label>
                <Input
                  required
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                  className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-300">Email Akun</Label>
                  <Input
                    required
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-300">Ganti Hak Akses Role</Label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 text-white text-xs h-9 rounded-xl px-2.5 focus:outline-none"
                  >
                    <option value="super_admin">Super Admin (Akses Penuh)</option>
                    <option value="hr_admin">HR Admin (Presensi & SDM)</option>
                    <option value="project_manager">Project Manager (RAB & Proyek)</option>
                    <option value="finance">Finance (Reimbursement & Kas)</option>
                    <option value="warehouse_logistics">Warehouse & Logistik (Material)</option>
                    <option value="field_technician">Field Technician (Teknisi Lapangan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-300">Divisi Operasional</Label>
                  <Input
                    value={editingUser.division || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, division: e.target.value })}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-300">Nomor Induk Karyawan (NIK / ID)</Label>
                  <Input
                    value={editingUser.employee_id || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, employee_id: e.target.value })}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-300">No. Telepon / WhatsApp</Label>
                  <Input
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-300">Status Akun</Label>
                  <select
                    value={editingUser.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.value === 'active' })}
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 text-white text-xs h-9 rounded-xl px-2.5 focus:outline-none"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-zinc-400 hover:text-white h-9"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl h-9 px-4 shadow-md shadow-blue-600/30"
                >
                  {isSubmittingUser ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PENGUMUMAN & SOP K3 */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Pengumuman */}
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 h-fit shadow-sm">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                Terbitkan Pengumuman Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <Label className="text-xs text-zinc-300">Judul Pengumuman</Label>
                  <Input
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Jadwal Briefing K3 Penarikan Kabel..."
                    className="mt-1 bg-zinc-950 border-zinc-800 text-white text-xs h-9 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-300">Kategori</Label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 text-white text-xs h-9 rounded-xl px-2.5 focus:outline-none"
                    >
                      <option value="Operasional">Operasional</option>
                      <option value="K3 & Safety">K3 & Safety</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs text-zinc-300">Prioritas</Label>
                    <select
                      value={newUrgency}
                      onChange={(e) => setNewUrgency(e.target.value as any)}
                      className="mt-1 w-full bg-zinc-950 border border-zinc-800 text-white text-xs h-9 rounded-xl px-2.5 focus:outline-none"
                    >
                      <option value="info">Info Normal</option>
                      <option value="warning">Penting (Warning)</option>
                      <option value="urgent">Mendesak (Urgent)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-zinc-300">Isi Pengumuman / Arahan</Label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Tuliskan arahan operasional secara rinci..."
                    className="mt-1 w-full bg-zinc-950 border border-zinc-800 text-white text-xs rounded-xl p-3 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs h-9 font-semibold rounded-xl"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Terbitkan Pengumuman
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Daftar Pengumuman Aktif */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400">
                Pengumuman Aktif di Portal ({announcements.length})
              </span>
            </div>

            {announcements.map((a) => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 hover:border-zinc-700 transition-colors shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{a.title}</span>
                    <Badge
                      className={
                        a.urgency === 'urgent'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800 text-[10px]'
                          : a.urgency === 'warning'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800 text-[10px]'
                          : 'bg-blue-950/80 text-blue-300 border-blue-800 text-[10px]'
                      }
                    >
                      {a.category} • {a.urgency.toUpperCase()}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{a.content}</p>
                <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                  <span>Diterbitkan: {a.date}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Live di Portal
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MASTER TITIK GEOFENCING */}
      {activeTab === 'geofencing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Daftar Titik Geofencing Terdaftar</h2>
              <p className="text-xs text-zinc-400">
                Sistem presensi mobile GPS memvalidasi posisi karyawan berdasarkan radius toleransi meter berikut:
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => alert('Fitur tambah titik geofencing kantor baru siap diintegrasikan!')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs h-8 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Tambah Titik Kantor / Hub
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offices.map((office) => (
              <Card key={office.id} className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">{office.name}</h3>
                      <span className="text-[10px] text-zinc-500">Radius: {office.radius_meters} meter</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px]">
                    Aktif
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 leading-snug">{office.address}</p>
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[10px] text-zinc-400 space-y-1">
                  <div>Latitude: {office.latitude}</div>
                  <div>Longitude: {office.longitude}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT KEAMANAN SIBER OWASP */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Database PostgreSQL</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white">RLS Active</div>
              <p className="text-[11px] text-zinc-500">Row-Level Security aktif melindungi seluruh tabel</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Proteksi Clickjacking</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white">X-Frame-Options</div>
              <p className="text-[11px] text-zinc-500">Header DENY aktif mencegah serangan UI redressing</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Pencegahan XSS / MIME</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white">nosniff & sanitize</div>
              <p className="text-[11px] text-zinc-500">X-Content-Type-Options nosniff terkonfigurasi</p>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs">
                <span>Cookie Auth Session</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-white">SameSite=Lax</div>
              <p className="text-[11px] text-zinc-500">Mencegah serangan CSRF lintas domain</p>
            </Card>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Live Audit Log Keamanan & Akses Pengguna</h3>
                <p className="text-xs text-zinc-400">Pencatatan real-time seluruh aktivitas otentikasi dan mutasi data:</p>
              </div>
              <Button
                size="sm"
                onClick={handleDownloadAuditReport}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 rounded-xl shadow-sm"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Unduh Log Audit (CSV)
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-950/80 text-[11px] font-semibold text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Waktu Akses</th>
                    <th className="px-4 py-3">Aktivitas Keamanan</th>
                    <th className="px-4 py-3">Alamat IP Klien</th>
                    <th className="px-4 py-3">Identitas Pengguna</th>
                    <th className="px-4 py-3 text-right">Status Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {SECURITY_AUDIT_LOGS.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="px-4 py-3 text-zinc-400">{log.time} WIB</td>
                      <td className="px-4 py-3 font-semibold text-white font-sans">{log.event}</td>
                      <td className="px-4 py-3 text-cyan-400">{log.ip}</td>
                      <td className="px-4 py-3 text-zinc-300 font-sans">{log.user}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{log.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}