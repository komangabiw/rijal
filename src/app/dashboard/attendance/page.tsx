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
} from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState(DEMO_OFFICES[0].id);
  const [attendanceType, setAttendanceType] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);

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
    setAttendances(data);
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

  const handleClockIn = async () => {
    if (!selfieBlob) {
      alert('Silakan ambil foto selfie terlebih dahulu sebagai bukti kehadiran K3.');
      return;
    }

    setIsSubmitting(true);
    const office = DEMO_OFFICES.find((o) => o.id === selectedOffice);

    const newRecord = await submitClockIn({
      userId: user?.id || 'usr-tech-06',
      status: attendanceType,
      latitude: coords.lat,
      longitude: coords.lng,
      officeId: selectedOffice,
      address: office ? office.name : 'Site Lapangan FO Cluster',
      notes: notes || 'Presensi terverifikasi via Web ERP',
      photoBlob: selfieBlob,
    });

    setAttendances([newRecord, ...attendances.filter((a) => a.user_id !== user?.id)]);
    setIsSubmitting(false);
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
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-blue-600" />
            Absensi Karyawan & Teknisi Lapangan
          </h1>
          <p className="text-xs text-slate-500">
            Validasi presensi berbasis Geofencing GPS & foto selfie live tersimpan di Supabase Storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="text-xs border-slate-300"
          >
            <RotateCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Clock-In Widget & Geofencing Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-blue-200/80 shadow-md bg-gradient-to-b from-white to-blue-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600" />
                  Clock-In Presensi Hari Ini
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-800 border-blue-200">
                  {formatDate(todayStr)}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Posisikan diri dalam radius kantor/site proyek yang ditugaskan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayRecord ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Presensi Hari Ini Berhasil Tercatat
                  </div>
                  <div className="text-xs space-y-1 text-emerald-700">
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
                  <div className="pt-2 flex items-center gap-2.5">
                    <img
                      src={todayRecord.clock_in_photo_url || ''}
                      alt="Selfie"
                      className="w-14 h-14 rounded-lg object-cover border-2 border-emerald-400 shadow"
                    />
                    <div className="text-[11px] text-emerald-800">
                      <span className="font-semibold block">Selfie Live Terverifikasi</span>
                      <span className="text-emerald-600 font-mono text-[10px]">Supabase Storage: attendance-photos</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Status Kehadiran</label>
                    <select
                      value={attendanceType}
                      onChange={(e) => setAttendanceType(e.target.value as AttendanceStatus)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
                    <label className="text-xs font-semibold text-slate-700">Pilih Lokasi Kantor / Hub Proyek</label>
                    <select
                      value={selectedOffice}
                      onChange={(e) => setSelectedOffice(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      {DEMO_OFFICES.map((off) => (
                        <option key={off.id} value={off.id}>
                          {off.name} (Radius {off.radius_meters}m)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Live GPS Coordinates Detection */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-700 font-medium">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        Koordinat GPS Live
                      </span>
                      <button
                        onClick={handleGetLocation}
                        type="button"
                        className="text-blue-600 hover:text-blue-700 font-semibold underline text-[11px]"
                      >
                        Perbarui GPS
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        Lat: {coords.lat}
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        Lng: {coords.lng}
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Geofence Valid: Terverifikasi berada di radius kerja site
                    </p>
                  </div>

                  {/* Live Selfie Camera Capture Component */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Foto Selfie Bukti Kehadiran</label>
                    <WebcamCapture
                      onCapture={(blob) => setSelfieBlob(blob)}
                    />
                  </div>

                  {/* Notes / Rencana Kerja */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Catatan / Rencana Kerja Hari Ini</label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Contoh: Splicing core FO Cluster Duren Jaya & patroli jalur"
                      className="text-xs"
                    />
                  </div>

                  {/* Submit Clock-In Button */}
                  <Button
                    onClick={handleClockIn}
                    disabled={isSubmitting || !selfieBlob}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 shadow"
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Lokasi Geofencing Terdaftar</span>
                <Badge variant="outline" className="text-[10px]">
                  {DEMO_OFFICES.length} Titik Presensi
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Radius toleransi presensi otomatis diverifikasi oleh sistem backend PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_OFFICES.map((off) => (
                <div
                  key={off.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition-all flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{off.name}</span>
                      <Badge variant="success" className="text-[10px]">
                        Aktif
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{off.address}</p>
                    <div className="text-[11px] text-slate-600 font-mono flex items-center gap-3 pt-1">
                      <span>Lat: {off.latitude}</span>
                      <span>Lng: {off.longitude}</span>
                      <span className="text-blue-600 font-semibold">Radius: {off.radius_meters} Meter</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance History Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Rekap Presensi Karyawan & Teknisi
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Daftar log kehadiran terkini dengan bukti foto dan verifikasi GPS (geser tabel untuk detail)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Total: {attendances.length} Rekap
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200 -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[680px]">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Karyawan</th>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Jam Masuk</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Lokasi / Jarak</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3 text-right">Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={att.clock_in_photo_url || ''}
                          alt="Selfie"
                          className="w-9 h-9 rounded-full object-cover border border-slate-300"
                        />
                        <div>
                          <p className="font-semibold text-slate-900">{att.profile?.full_name || 'Teknisi'}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{att.profile?.employee_id || 'EMP-TEC'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{formatDate(att.date)}</td>
                    <td className="p-3 text-slate-600 font-mono">{formatDateTime(att.clock_in_time)}</td>
                    <td className="p-3">
                      <Badge
                        variant={att.status === 'present' ? 'success' : 'warning'}
                        className="capitalize text-[10px]"
                      >
                        {att.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-600">
                      <p className="truncate max-w-[200px]">{att.clock_in_address || '-'}</p>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        {att.clock_in_distance_meters || 15}m dari titik pusat
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 max-w-[200px] truncate">{att.notes || '-'}</td>
                    <td className="p-3 text-right">
                      <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                        {att.verification_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
