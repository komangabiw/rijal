'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatRupiah, formatDate } from '@/lib/utils';
import {
  DEMO_PROJECTS,
  DEMO_SITES,
  DEMO_PROGRESS_LOGS,
} from '@/lib/mock-data';
import { Project, ProjectProgressLog } from '@/types/database';
import {
  FolderGit2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Camera,
  Layers,
  MapPin,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function ProjectsPage() {
  const { user, role } = useAuth();
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [logs, setLogs] = useState<ProjectProgressLog[]>(DEMO_PROGRESS_LOGS);
  const [selectedProject, setSelectedProject] = useState<Project>(DEMO_PROJECTS[0]);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form states for adding a progress log
  const [logVolume, setLogVolume] = useState('250');
  const [logDesc, setLogDesc] = useState('');
  const [hasIssue, setHasIssue] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const volumeNum = Number(logVolume) || 0;
    const newLog: ProjectProgressLog = {
      id: `log-${Date.now()}`,
      project_id: selectedProject.id,
      site_id: DEMO_SITES[0].id,
      technician_id: user?.id || 'usr-tech-06',
      log_date: '2026-11-16',
      volume_realized: volumeNum,
      description: logDesc || 'Penarikan kabel lanjutan dan perapihan span FO.',
      photo_before_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
      photo_progress_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
      photo_after_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400',
      has_issues: hasIssue,
      issue_description: hasIssue ? issueDesc : null,
      created_at: new Date().toISOString(),
      technician: user || undefined,
      site: DEMO_SITES[0],
    };

    // Update Project actual_volume and percentage
    const updatedActual = Number(selectedProject.actual_volume) + volumeNum;
    const newPct = Math.min(100, Math.round((updatedActual / Number(selectedProject.target_volume)) * 10000) / 100);

    const updatedProjects = projects.map((p) =>
      p.id === selectedProject.id
        ? { ...p, actual_volume: updatedActual, progress_percentage: newPct }
        : p
    );

    setTimeout(() => {
      setProjects(updatedProjects);
      setSelectedProject({
        ...selectedProject,
        actual_volume: updatedActual,
        progress_percentage: newPct,
      });
      setLogs([newLog, ...logs]);
      setIsSubmitting(false);
      setShowLogModal(false);
      setLogDesc('');
      setHasIssue(false);
      setIssueDesc('');
    }, 400);
  };

  const chartData = projects.map((p) => ({
    name: p.project_code,
    Target: Number(p.target_volume),
    Realisasi: Number(p.actual_volume),
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-blue-600" />
            Implementasi Proyek & Site Lapangan
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring progres fisik penarikan kabel fiber optik, instalasi tower BTS, target vs aktual, serta log foto harian.
          </p>
        </div>

        <Button
          onClick={() => setShowLogModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold self-start sm:self-auto shadow"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Input Log Progres & Bukti Foto
        </Button>
      </div>

      {/* Target vs Actual Comparison Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Perbandingan Target vs. Realisasi Fisik (Semua Proyek)</span>
            <Badge variant="secondary" className="text-xs">
              Meters / Sites
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Realisasi otomatis tersinkronisasi dari seluruh log harian teknisi lapangan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val) => [Number(val).toLocaleString('id-ID'), 'Volume']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realisasi" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Project Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProject.id;
          return (
            <div
              key={proj.id}
              onClick={() => setSelectedProject(proj)}
              className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {proj.project_code}
                </span>
                <Badge
                  variant={proj.status === 'in_progress' ? 'default' : 'secondary'}
                  className="text-[10px] capitalize"
                >
                  {proj.status.replace('_', ' ')}
                </Badge>
              </div>

              <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{proj.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{proj.client?.name}</p>

              {/* Progress bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Pencapaian:</span>
                  <span className="font-bold text-blue-600">{proj.progress_percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, proj.progress_percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Aktual: {Number(proj.actual_volume).toLocaleString('id-ID')}</span>
                  <span>Target: {Number(proj.target_volume).toLocaleString('id-ID')} {proj.target_unit}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>RAB: {formatRupiah(Number(proj.total_budget))}</span>
                <span>PIC: {proj.project_manager?.full_name?.split(' ')[0] || 'Dedi'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Detailed View: Sites & Daily Progress Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sites list for selected project */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Daftar Site Proyek ({selectedProject.project_code})</span>
                <Badge variant="outline" className="text-[10px]">
                  {DEMO_SITES.filter((s) => s.project_id === selectedProject.id).length} Sites Terdaftar
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_SITES.filter((s) => s.project_id === selectedProject.id).map((site) => (
                <div key={site.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {site.site_id_ext} - {site.name}
                    </span>
                    <Badge variant={site.status === 'completed' ? 'success' : 'default'} className="text-[10px]">
                      {site.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{site.address}, {site.city}</p>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500">Progres Site:</span>
                    <span className="font-bold text-blue-600">{site.progress_percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Daily Progress Logs with 3-Stage Photo Evidence */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Log Progres Harian & Bukti Foto Lapangan
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Dokumentasi Before, Progress, dan After dari teknisi lapangan
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {logs.length} Laporan
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          {log.technician?.full_name || 'Teknisi FO'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDate(log.log_date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{log.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200 shrink-0">
                      +{log.volume_realized} {selectedProject.target_unit}
                    </Badge>
                  </div>

                  {/* 3-Stage Photo Gallery (Before, Progress, After) */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">
                        1. Before
                      </span>
                      <img
                        src={log.photo_before_url || ''}
                        alt="Before"
                        className="w-full h-20 rounded-lg object-cover border border-slate-200 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-blue-600 block uppercase">
                        2. Progress
                      </span>
                      <img
                        src={log.photo_progress_url || ''}
                        alt="Progress"
                        className="w-full h-20 rounded-lg object-cover border border-blue-200 shadow-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-emerald-600 block uppercase">
                        3. After (Selesai)
                      </span>
                      <img
                        src={log.photo_after_url || ''}
                        alt="After"
                        className="w-full h-20 rounded-lg object-cover border border-emerald-200 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Issue Blocker Alert */}
                  {log.has_issues && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Kendala / Blocker Lapangan:</span>
                        <p className="text-[11px] text-red-700 mt-0.5">{log.issue_description}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Input Progress Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl rounded-2xl border-slate-300 overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Input Progres Harian Proyek
                </CardTitle>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Proyek: {selectedProject.name} ({selectedProject.project_code})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Volume Realisasi Hari Ini ({selectedProject.target_unit})
                  </label>
                  <Input
                    type="number"
                    value={logVolume}
                    onChange={(e) => setLogVolume(e.target.value)}
                    required
                    placeholder="Contoh: 250"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Deskripsi Pekerjaan & Titik Span
                  </label>
                  <Input
                    value={logDesc}
                    onChange={(e) => setLogDesc(e.target.value)}
                    required
                    placeholder="Penarikan kabel FO 24C dari tiang #52 ke #60 dan splicing di ODP #4"
                    className="text-xs"
                  />
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Upload Bukti Foto 3 Tahap (Supabase Storage)
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border border-dashed border-slate-300 rounded-lg p-2 bg-white">
                      <Camera className="w-4 h-4 mx-auto text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium mt-1 block">Foto Before</span>
                    </div>
                    <div className="border border-dashed border-slate-300 rounded-lg p-2 bg-white">
                      <Camera className="w-4 h-4 mx-auto text-blue-500" />
                      <span className="text-[10px] text-blue-600 font-medium mt-1 block">Foto Progress</span>
                    </div>
                    <div className="border border-dashed border-slate-300 rounded-lg p-2 bg-white">
                      <Camera className="w-4 h-4 mx-auto text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Foto After</span>
                    </div>
                  </div>
                </div>

                {/* Blocker Toggle */}
                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasIssue}
                      onChange={(e) => setHasIssue(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    Laporkan Kendala Lapangan (Blocker / Issue)
                  </label>
                  {hasIssue && (
                    <Input
                      value={issueDesc}
                      onChange={(e) => setIssueDesc(e.target.value)}
                      placeholder="Jelaskan kendala: Izin RW tertahan / tiang PLN patah"
                      className="text-xs border-red-300 focus-visible:ring-red-500 bg-red-50/50"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLogModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  >
                    {isSubmitting ? 'Menyimpan Log...' : 'Simpan & Update Progres Proyek'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
