'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
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
  AlertTriangle,
  Download,
  Activity,
  FileCheck,
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
  { id: 'sec-1', time: '15:28:44', event: 'Super Admin Login', ip: '180.252.164.22', user: 'superadmin@telekomunikasi.co.id', status: '200 OK (MFA Valid)' },
  { id: 'sec-2', time: '15:24:34', event: 'Attendance Clock-In GPS Geofence', ip: '114.124.201.89', user: 'technician@telekomunikasi.co.id', status: '200 OK (Geotag Valid)' },
  { id: 'sec-3', time: '15:20:10', event: 'Reimbursement Claim Submission', ip: '180.252.164.22', user: 'pm@telekomunikasi.co.id', status: '200 OK (Encrypted)' },
  { id: 'sec-4', time: '15:15:02', event: 'Database Connection Pool Handshake', ip: '10.0.4.12', user: 'service-role@cloudflare', status: '200 OK (TLS 1.3)' },
  { id: 'sec-5', time: '14:58:30', event: 'Material Dispatch Delivery Order SJ-001', ip: '182.1.88.45', user: 'warehouse@telekomunikasi.co.id', status: '200 OK (Signed POD)' },
];

export default function CMSPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'announcements' | 'geofencing' | 'users' | 'security'>('announcements');

  // CMS state for Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'Operasional' | 'K3 & Safety' | 'Maintenance'>('Operasional');
  const [newUrgency, setNewUrgency] = useState<'info' | 'warning' | 'urgent'>('info');

  // CMS state for Geofence Locations
  const [offices, setOffices] = useState(DEMO_OFFICES);

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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
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
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            activeTab === 'users'
              ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Kelola Akun & Hak Akses</span>
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

      {/* TAB 1: PENGUMUMAN & SOP K3 */}
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

      {/* TAB 2: MASTER TITIK GEOFENCING */}
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

      {/* TAB 3: KELOLA AKUN & HAK AKSES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Daftar Akun Karyawan & Hak Akses Role (6 Role)</h2>
              <p className="text-xs text-zinc-400">
                Kredensial resmi portal terstandarisasi dengan enkripsi peran RLS:
              </p>
            </div>
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
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {DEMO_PROFILES.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white flex items-center gap-2.5">
                      <img
                        src={p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                        alt={p.full_name}
                        className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                      />
                      {p.full_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-blue-400">{p.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-semibold text-zinc-200">
                        {p.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{p.division}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400">{p.employee_id}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-800 text-[10px]">
                        Aktif
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT KEAMANAN SIBER OWASP */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Security Overview Cards */}
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

          {/* Audit Logs Table */}
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