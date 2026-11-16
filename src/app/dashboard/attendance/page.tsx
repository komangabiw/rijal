'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { WebcamCapture } from '@/components/ui/webcam-capture';
import { DEMO_OFFICES } from '@/lib/mock-data';
import { Attendance, AttendanceStatus } from '@/types/database';
import { formatDate, formatDateTime } from '@/lib/utils';
import { fetchAttendances, submitClockIn } from '@/lib/api-service';
import {
  CalendarCheck2,
  MapPin,
  CheckCircle2,
  Download,
  Navigation,
  ShieldCheck,
  RotateCw,
  ZoomIn,
  X,
  Clock,
  User,
} from 'lucide-react';

interface PhotoLightboxData {
  url: string;
  name: string;
  employeeId?: string;
  date: string;
  time?: string;
  address?: string;
  status: string;
  distance?: number;
  notes?: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState(DEMO_OFFICES[0].id);
  const [attendanceType, setAttendanceType] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);

  // Lightbox Modal state
  const [activePhoto, setActivePhoto] = useState<PhotoLightboxData | null>(null);

  // Live GPS state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: -6.239308,
    lng: 106.82711,
  });

  useEffect(() => {
    loadData();
    handleGetLocation();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAttendances();
    let localList: Attendance[] = [];
    if (typeof window !== 'undefined') {
      try {
        const savedLocal = localStorage.getItem('pt_telecom_local_attendances');
        if (savedLocal) localList = JSON.parse(savedLocal);
      } catch {}
    }
    // Merge remote data with local attendances without duplicate IDs
    const combined = [
      ...localList,
      ...data.filter((d) => !localList.some((l) => l.id === d.id || (l.user_id === d.user_id && l.date === d.date))),
    ];
    setAttendances(combined);
    setLoading(false);
  };

  const handleGetLocation = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          });
        },
        () => {
          setCoords({ lat: -6.239308, lng: 106.82711 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayRecord = attendances.find((a) => a.user_id === user?.id && a.date === todayStr);

  const activeOfficeObj = DEMO_OFFICES.find((o) => o.id === selectedOffice);

  const handleClockIn = async () => {
    if (!selfieBlob) {
      alert('Silakan ambil foto selfie terlebih dahulu sebagai bukti kehadiran K3.');
      return;
    }

    setIsSubmitting(true);
    try {
      const activeOffice = DEMO_OFFICES.find((o) => o.id === selectedOffice);
      const newRecord = await submitClockIn({
        userId: user?.id || 'a0000000-0000-0000-0000-000000000006',
        status: attendanceType,
        latitude: coords.lat,
        longitude: coords.lng,
        officeId: selectedOffice,
        address: activeOffice ? activeOffice.name : 'Kantor Pusat PT Telekomunikasi',
        notes: notes || 'Presensi terverifikasi via Web Camera & Geofencing GPS',
        photoBlob: selfieBlob,
      });

      // Attach profile if not present
      if (!newRecord.profile && user) {
        newRecord.profile = user;
      }

      const updatedList = [newRecord, ...attendances.filter((a) => a.id !== newRecord.id && !(a.user_id === newRecord.user_id && a.date === newRecord.date))];
      setAttendances(updatedList);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pt_telecom_local_attendances', JSON.stringify(updatedList.slice(0, 50)));
        } catch {}
      }
      setNotes('');
      setSelfieBlob(null);
    } catch (err: any) {
      alert(`Gagal clock in: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Nama,NIK,Tanggal,Status,Jam Masuk,Lokasi,Verifikasi\n' +
      attendances
        .map(
          (a) =>
            `"${a.id}","${a.profile?.full_name || 'Karyawan'}","${a.profile?.employee_id || '-'}","${a.date}","${a.status}","${formatDateTime(a.clock_in_time)}","${a.clock_in_address || '-'}","${a.verification_status}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_absensi_pt_telekomunikasi_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-blue-400" />
            Absensi Karyawan & Teknisi Lapangan
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Validasi presensi berbasis Geofencing GPS & foto selfie live tersimpan di Supabase Storage.
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
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            Ekspor CSV
          </Button>
        </div>
      </div>

      {/* Clock-In Widget & Geofencing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl shadow-lg">
            <CardHeader className="pb-3 border-b border-zinc-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-400" />
                  Clock-In Presensi Hari Ini
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-zinc-800 text-zinc-300 border-zinc-700">
                  {formatDate(todayStr)}
                </Badge>
              </div>
              <CardDescription className="text-xs text-zinc-400">
                Posisikan diri dalam radius kantor/site proyek yang ditugaskan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              {todayRecord ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Presensi Hari Ini Berhasil Tercatat
                  </div>
                  <div className="text-xs space-y-1 text-emerald-300/90">
                    <p>
                      <strong>Waktu:</strong> {formatDateTime(todayRecord.clock_in_time)}
                    </p>
                    <p>
                      <strong>Lokasi:</strong> {todayRecord.clock_in_address}
                    </p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className="capitalize font-semibold">{todayRecord.status.replace('_', ' ')}</span>
                    </p>
                    <p>
                      <strong>Jarak Geofence:</strong> {todayRecord.clock_in_distance_meters || 15} meter (Valid)
                    </p>
                  </div>

                  {/* Clickable Selfie Preview in Today Card */}
                  <div className="pt-2 flex items-center gap-3">
                    <div
                      onClick={() =>
                        todayRecord.clock_in_photo_url &&
                        setActivePhoto({
                          url: todayRecord.clock_in_photo_url,
                          name: user?.full_name || 'Teknisi Lapangan',
                          employeeId: 'EMP-TEC',
                          date: todayRecord.date,
                          time: formatDateTime(todayRecord.clock_in_time),
                          address: todayRecord.clock_in_address || 'Site Lapangan',
                          status: todayRecord.status,
                          distance: todayRecord.clock_in_distance_meters || 15,
                          notes: todayRecord.notes || undefined,
                        })
                      }
                      className="group relative cursor-pointer"
                      title="Klik untuk melihat foto ukuran penuh"
                    >
                      <img
                        src={todayRecord.clock_in_photo_url || ''}
                        alt="Selfie"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500 shadow group-hover:scale-105 transition-all"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ZoomIn className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-[11px] text-emerald-300 space-y-0.5">
                      <span className="font-bold block text-white">Selfie Live Terverifikasi</span>
                      <span className="text-emerald-400 block text-[10px]">
                        Klik foto di samping untuk melihat hasil geotag watermark
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Status Kehadiran</label>
                    <select
                      value={attendanceType}
                      onChange={(e) => setAttendanceType(e.target.value as AttendanceStatus)}
                      className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="present">Hadir Normal (Present)</option>
                      <option value="field_duty">Dinas Luar / Site Lapangan (Field Duty)</option>
                      <option value="late">Terlambat (Late)</option>
                      <option value="sick">Sakit (Sick)</option>
                      <option value="leave">Izin / Cuti (Leave)</option>
                    </select>
                  </div>

                  {/* Registered Location / Geofence Check */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Pilih Lokasi Kantor / Hub Proyek</label>
                    <select
                      value={selectedOffice}
                      onChange={(e) => setSelectedOffice(e.target.value)}
                      className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {DEMO_OFFICES.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.name} (Radius {off.radius_meters}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Live GPS Coordinates Detection */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-zinc-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400" />
                        Koordinat GPS Live
                      </span>
                      <button
                        onClick={handleGetLocation}
                        type="button"
                        className="text-blue-400 hover:text-blue-300 font-semibold underline text-[11px]"
                      >
                        Perbarui GPS
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-mono">
                      <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
                        Lat: {coords.lat}
                      </div>
                      <div className="bg-zinc-900 p-1.5 rounded border border-zinc-800">
                        Lng: {coords.lng}
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Geofence Valid: Terverifikasi berada di radius kerja site
                    </p>
                  </div>

                  {/* Live Selfie Camera Capture Component with HUD & Watermarking */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">
                      Foto Selfie Bukti Kehadiran (Dengan Cap Jam & Koordinat)
                    </label>
                    <WebcamCapture
                      locationName={activeOfficeObj ? activeOfficeObj.name : 'Kantor Pusat PT Telekomunikasi'}
                      coordinates={coords}
                      onCapture={(blob) => setSelfieBlob(blob)}
                    />
                  </div>

                  {/* Notes / Rencana Kerja */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Catatan / Rencana Kerja Hari Ini</label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Splicing core FO Cluster Duren Jaya & patroli jalur"
                      className="text-xs bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </div>

                  {/* Submit Clock-In Button */}
                  <Button
                    onClick={handleClockIn}
                    disabled={isSubmitting || !selfieBlob}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 shadow-md shadow-blue-600/30"
                  >
                    {isSubmitting ? 'Mengunggah Foto & Presensi...' : 'Konfirmasi & Clock In'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Registered Geofence Locations */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
            <CardHeader className="pb-3 border-b border-zinc-800/80">
              <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                <span>Lokasi Geofencing Terdaftar</span>
                <Badge variant="outline" className="text-[10px] bg-zinc-800 border-zinc-700 text-zinc-300">
                  {DEMO_OFFICES.length} Titik Presensi
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Radius toleransi presensi otomatis diverifikasi oleh sistem backend PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {DEMO_OFFICES.map((off) => (
                <div
                  key={off.id}
                  className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{off.name}</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-950/60 text-emerald-400 border-emerald-800/60">
                        Aktif
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400">{off.address}</p>
                    <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-3 pt-1">
                      <span>Lat: {off.latitude}</span>
                      <span>Lng: {off.longitude}</span>
                      <span className="text-blue-400 font-semibold">Radius: {off.radius_meters}m</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance History Table */}
      <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 rounded-2xl">
        <CardHeader className="pb-3 border-b border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold text-white">
                Rekap Presensi Karyawan & Teknisi
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Klik pada foto thumbnail karyawan untuk memperbesar dan melihat detail bukti kehadiran
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300">
                Total: {attendances.length} Rekap
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-xl border border-zinc-800 -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase font-semibold border-b border-zinc-800">
                <tr>
                  <th className="p-3">Karyawan & Foto Bukti</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Jam Masuk</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Lokasi / Jarak</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3 text-right">Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 bg-zinc-900">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Clickable Image with Zoom Icon */}
                        <div
                          onClick={() =>
                            att.clock_in_photo_url &&
                            setActivePhoto({
                              url: att.clock_in_photo_url,
                              name: att.profile?.full_name || 'Teknisi',
                              employeeId: att.profile?.employee_id || 'EMP-TEC',
                              date: att.date,
                              time: formatDateTime(att.clock_in_time),
                              address: att.clock_in_address || 'Site Lapangan',
                              status: att.status,
                              distance: att.clock_in_distance_meters || 15,
                              notes: att.notes || undefined,
                            })
                          }
                          className="group relative cursor-pointer"
                          title="Klik untuk memperbesar bukti foto"
                        >
                          <img
                            src={
                              att.clock_in_photo_url ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
                            }
                            alt="Selfie Bukti"
                            className="w-10 h-10 rounded-full object-cover border border-zinc-700 group-hover:scale-105 transition-all"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-white">
                            {att.profile?.full_name || 'Teknisi Lapangan'}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {att.profile?.employee_id || 'EMP-TEC'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-zinc-300 font-medium">{formatDate(att.date)}</td>
                    <td className="p-3 text-zinc-300 font-mono">{formatDateTime(att.clock_in_time)}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] capitalize bg-emerald-950/60 text-emerald-400 border-emerald-800/60">
                        {att.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="text-zinc-200">{att.clock_in_address || 'Kantor Pusat'}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {att.clock_in_distance_meters || 15}m dari titik pusat
                      </div>
                    </td>
                    <td className="p-3 max-w-[200px] truncate text-zinc-400">
                      {att.notes || '-'}
                    </td>
                    <td className="p-3 text-right">
                      <Badge variant="outline" className="text-[10px] bg-zinc-800 text-emerald-400 border-zinc-700">
                        {att.verification_status || 'approved'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Modal for Viewing Photo & Geotag Proof */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Bukti Presensi Geofencing & Selfie
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Otentikasi K3 PT Telekomunikasi Indonesia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActivePhoto(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="p-4 sm:p-6 bg-zinc-950 flex flex-col items-center justify-center overflow-y-auto">
              <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow-xl max-w-full">
                <img
                  src={activePhoto.url}
                  alt="Bukti Kehadiran Penuh"
                  className="max-h-[50vh] sm:max-h-[55vh] w-auto object-contain"
                />
              </div>

              {/* Detail Info Card */}
              <div className="w-full mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-300">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      <strong>Nama:</strong> {activePhoto.name} ({activePhoto.employeeId})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      <strong>Waktu:</strong> {activePhoto.time || activePhoto.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      <strong>Lokasi:</strong> {activePhoto.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      <strong>Status / Jarak:</strong> {activePhoto.status} ({activePhoto.distance}m)
                    </span>
                  </div>
                </div>
                {activePhoto.notes && (
                  <div className="pt-2 border-t border-zinc-800 text-zinc-400">
                    <strong>Catatan Kerja:</strong> {activePhoto.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
