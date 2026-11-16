'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatRupiah, formatDate } from '@/lib/utils';
import { Project, ProjectProgressLog } from '@/types/database';
import { DEMO_PROJECTS, DEMO_SITES } from '@/lib/mock-data';
import { fetchProjects, fetchProgressLogs, submitProgressLog } from '@/lib/api-service';
import {
  FolderGit2,
  Plus,
  AlertTriangle,
  Camera,
  MapPin,
  X,
  Upload,
  RotateCw,
  CheckCircle2,
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
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS);
  const [logs, setLogs] = useState<ProjectProgressLog[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project>(DEMO_PROJECTS[0]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states for adding a progress log
  const [logVolume, setLogVolume] = useState('250');
  const [logDesc, setLogDesc] = useState('');
  const [hasIssue, setHasIssue] = useState(false);
  const [issueDesc, setIssueDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real files for 3-stage photo evidence
  const [fileBefore, setFileBefore] = useState<File | null>(null);
  const [fileProgress, setFileProgress] = useState<File | null>(null);
  const [fileAfter, setFileAfter] = useState<File | null>(null);

  const [previewBefore, setPreviewBefore] = useState<string | null>(null);
  const [previewProgress, setPreviewProgress] = useState<string | null>(null);
  const [previewAfter, setPreviewAfter] = useState<string | null>(null);

  const inputBeforeRef = useRef<HTMLInputElement | null>(null);
  const inputProgressRef = useRef<HTMLInputElement | null>(null);
  const inputAfterRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [fetchedProjects, fetchedLogs] = await Promise.all([
      fetchProjects(),
      fetchProgressLogs(),
    ]);
    if (fetchedProjects && fetchedProjects.length > 0) {
      setProjects(fetchedProjects);
      setSelectedProject(fetchedProjects[0]);
    } else {
      setProjects(DEMO_PROJECTS);
      setSelectedProject(DEMO_PROJECTS[0]);
    }
    setLogs(fetchedLogs || []);
    setLoading(false);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'before' | 'progress' | 'after'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === 'before') {
        setFileBefore(file);
        setPreviewBefore(url);
      } else if (type === 'progress') {
        setFileProgress(file);
        setPreviewProgress(url);
      } else if (type === 'after') {
        setFileAfter(file);
        setPreviewAfter(url);
      }
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    setIsSubmitting(true);
    const volumeNum = Number(logVolume) || 0;

    const newLog = await submitProgressLog({
      projectId: selectedProject.id,
      technicianId: user?.id || 'a0000000-0000-0000-0000-000000000006',
      volumeRealized: volumeNum,
      description: logDesc || 'Penarikan kabel lanjutan dan perapihan span FO.',
      photoBefore: fileBefore || undefined,
      photoProgress: fileProgress || undefined,
      photoAfter: fileAfter || undefined,
      hasIssues: hasIssue,
      issueDescription: hasIssue ? issueDesc : undefined,
    });

    const updatedActual = Number(selectedProject.actual_volume) + volumeNum;
    const newPct = Math.min(100, Math.round((updatedActual / Number(selectedProject.target_volume)) * 10000) / 100);

    const updatedProjects = projects.map((p) =>
      p.id === selectedProject.id
        ? { ...p, actual_volume: updatedActual, progress_percentage: newPct }
        : p
    );

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
    setFileBefore(null);
    setFileProgress(null);
    setFileAfter(null);
    setPreviewBefore(null);
    setPreviewProgress(null);
    setPreviewAfter(null);
  };

  const chartData = projects.map((p) => ({
    name: p.project_code,
    Target: Number(p.target_volume),
    Realisasi: Number(p.actual_volume),
  }));

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-blue-400" />
            Implementasi Proyek & Site Lapangan
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitoring progres fisik penarikan kabel fiber optik, target vs aktual, serta upload bukti foto 3 tahap ke Supabase Storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Segarkan
          </Button>
          <Button
            onClick={() => setShowLogModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Input Log Progres & Bukti Foto
          </Button>
        </div>
      </div>

      {/* Target vs Actual Comparison Chart Card */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
        <CardHeader className="pb-2 border-b border-zinc-800/80">
          <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
            <span>Perbandingan Target vs. Realisasi Fisik (Semua Proyek)</span>
            <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
              Meters / Sites
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Realisasi otomatis tersinkronisasi dari seluruh log harian teknisi lapangan
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [Number(val).toLocaleString('id-ID'), 'Volume']}
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderRadius: '8px',
                    borderColor: '#27272a',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Target" fill="#52525b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realisasi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-zinc-900/90 ring-1 ring-blue-500/30 shadow-lg'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded-md">
                  {proj.project_code}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] capitalize bg-zinc-800 border-zinc-700 text-zinc-300"
                >
                  {proj.status.replace('_', ' ')}
                </Badge>
              </div>

              <h3 className="font-semibold text-xs text-white mt-2 line-clamp-2">
                {proj.name}
              </h3>

              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Progres Fisik</span>
                  <span className="font-bold text-blue-400">{proj.progress_percentage}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${proj.progress_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                  <span>
                    Aktual: <strong className="text-zinc-200">{Number(proj.actual_volume).toLocaleString('id-ID')}</strong> {proj.target_unit}
                  </span>
                  <span>
                    Target: {Number(proj.target_volume).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 flex justify-between">
                <span>RAB Anggaran:</span>
                <span className="font-semibold text-zinc-200">{formatRupiah(proj.total_budget)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sites & Recent Progress Logs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sites List */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
            <CardHeader className="pb-3 border-b border-zinc-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Daftar Site Proyek ({selectedProject.project_code})
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-zinc-800 border-zinc-700 text-zinc-300">
                  {DEMO_SITES.filter((s) => s.project_id === selectedProject.id).length} Sites
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {DEMO_SITES.filter((s) => s.project_id === selectedProject.id).map((site) => (
                <div
                  key={site.id}
                  className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-zinc-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {site.site_id_ext}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-400 border-emerald-800/60">
                      {site.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-zinc-300 mt-1">{site.name}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{site.address}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Progres Site:</span>
                    <span className="font-bold text-emerald-400">{site.progress_percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Progress Logs Stream */}
        <div className="lg:col-span-2 space-y-3">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
            <CardHeader className="pb-3 border-b border-zinc-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white">
                    Log Progres Harian & Bukti Foto Lapangan
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400">
                    Dokumentasi Before, Progress, dan After tersimpan di Supabase Storage
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
                  {logs.length} Laporan
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {logs.length === 0 && (
                <div className="text-center py-10 text-xs text-zinc-400">
                  Belum ada log progres tersimpan. Klik tombol di atas untuk membuat laporan pertama.
                </div>
              )}
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{log.technician?.full_name || 'Teknisi Lapangan'}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400">{formatDate(log.log_date)}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-blue-950/60 text-blue-400 border-blue-800/60 w-fit">
                      +{log.volume_realized} {selectedProject.target_unit}
                    </Badge>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{log.description}</p>

                  {/* 3-Stage Photos Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-zinc-400 block uppercase">
                        1. Before
                      </span>
                      <img
                        src={log.photo_before_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'}
                        alt="Before"
                        className="w-full h-20 rounded-lg object-cover border border-zinc-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-blue-400 block uppercase">
                        2. Progress
                      </span>
                      <img
                        src={log.photo_progress_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200'}
                        alt="Progress"
                        className="w-full h-20 rounded-lg object-cover border border-blue-900/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-emerald-400 block uppercase">
                        3. After
                      </span>
                      <img
                        src={log.photo_after_url || 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=200'}
                        alt="After"
                        className="w-full h-20 rounded-lg object-cover border border-emerald-900/50"
                      />
                    </div>
                  </div>

                  {/* Issue Alert */}
                  {log.has_issues && (
                    <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/60 flex items-start gap-2 text-xs text-red-300">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-red-200">Kendala Lapangan:</span>
                        <p className="text-[11px] text-red-300 mt-0.5">{log.issue_description}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Input Progress Log Modal with REAL 3-Stage Photo Upload - Clean Dark UI */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <Card className="w-full max-w-lg bg-zinc-900 shadow-2xl rounded-2xl border-zinc-800 overflow-hidden max-h-[92vh] flex flex-col text-zinc-100">
            <CardHeader className="bg-zinc-950 border-b border-zinc-800 pb-3 shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  Input Progres Harian & Upload Foto
                </CardTitle>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Proyek: {selectedProject.name} ({selectedProject.project_code})
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Volume Realisasi Hari Ini ({selectedProject.target_unit})
                  </label>
                  <Input
                    type="number"
                    value={logVolume}
                    onChange={(e) => setLogVolume(e.target.value)}
                    required
                    placeholder="Contoh: 250"
                    className="text-xs bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Deskripsi Pekerjaan & Titik Span
                  </label>
                  <Input
                    value={logDesc}
                    onChange={(e) => setLogDesc(e.target.value)}
                    required
                    placeholder="Penarikan kabel FO 24C dari tiang #52 ke #60 dan splicing di ODP #4"
                    className="text-xs bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>

                {/* 3-Stage Photo Upload Section */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5">
                  <span className="text-xs font-semibold text-zinc-300 block">
                    Upload Foto Lapangan (Supabase Storage: project-progress)
                  </span>

                  <input
                    type="file"
                    ref={inputBeforeRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'before')}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={inputProgressRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'progress')}
                    className="hidden"
                  />
                  <input
                    type="file"
                    ref={inputAfterRef}
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'after')}
                    className="hidden"
                  />

                  <div className="grid grid-cols-3 gap-2">
                    {/* Before Photo */}
                    <div
                      onClick={() => inputBeforeRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-lg p-2 bg-zinc-900 text-center cursor-pointer transition-colors relative min-h-[90px] flex flex-col items-center justify-center group"
                    >
                      {previewBefore ? (
                        <img src={previewBefore} alt="Before" className="w-full h-16 object-cover rounded" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-zinc-500 mb-1 group-hover:text-blue-400" />
                          <span className="text-[10px] font-semibold text-zinc-300 block">1. Before</span>
                          <span className="text-[9px] text-zinc-500">Pilih Foto</span>
                        </>
                      )}
                    </div>

                    {/* Progress Photo */}
                    <div
                      onClick={() => inputProgressRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-lg p-2 bg-zinc-900 text-center cursor-pointer transition-colors relative min-h-[90px] flex flex-col items-center justify-center group"
                    >
                      {previewProgress ? (
                        <img src={previewProgress} alt="Progress" className="w-full h-16 object-cover rounded" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-blue-400 mb-1" />
                          <span className="text-[10px] font-semibold text-blue-400 block">2. Progress</span>
                          <span className="text-[9px] text-zinc-500">Pilih Foto</span>
                        </>
                      )}
                    </div>

                    {/* After Photo */}
                    <div
                      onClick={() => inputAfterRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 hover:border-blue-500 rounded-lg p-2 bg-zinc-900 text-center cursor-pointer transition-colors relative min-h-[90px] flex flex-col items-center justify-center group"
                    >
                      {previewAfter ? (
                        <img src={previewAfter} alt="After" className="w-full h-16 object-cover rounded" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-emerald-400 mb-1" />
                          <span className="text-[10px] font-semibold text-emerald-400 block">3. After</span>
                          <span className="text-[9px] text-zinc-500">Pilih Foto</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Has Issue / Blocker Toggle */}
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={hasIssue}
                      onChange={(e) => setHasIssue(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-500"
                    />
                    <span>Laporkan Kendala Lapangan (Blocker / Issue)</span>
                  </label>

                  {hasIssue && (
                    <Input
                      value={issueDesc}
                      onChange={(e) => setIssueDesc(e.target.value)}
                      placeholder="Contoh: Izin RT/RW terkendala, jalur terhalang galian PLN"
                      className="text-xs bg-red-950/40 border-red-800/80 text-red-200 placeholder:text-red-400"
                      required={hasIssue}
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLogModal(false)}
                    className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
                  >
                    {isSubmitting ? 'Mengunggah Foto & Menyimpan...' : 'Simpan Log Progres'}
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
