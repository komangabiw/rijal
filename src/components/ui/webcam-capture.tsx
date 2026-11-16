'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Camera,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  SwitchCamera,
  Clock,
  MapPin,
  Navigation,
} from 'lucide-react';
import { dataURLtoBlob } from '@/lib/storage';

interface WebcamCaptureProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  className?: string;
  locationName?: string;
  coordinates?: { lat: number; lng: number };
}

export function WebcamCapture({
  onCapture,
  className = '',
  locationName,
  coordinates,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Live real-time clock for viewfinder HUD
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timePart = now.toLocaleTimeString('id-ID', { hour12: false });
      setCurrentTime(`${datePart}, ${timePart}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Callback ref to bind stream as soon as video DOM node mounts
  const setVideoNode = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && stream) {
        node.srcObject = stream;
        node.play().catch((err) => {
          console.warn('Auto play failed:', err);
        });
      }
    },
    [stream]
  );

  // Sync stream to video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Sync play failed:', err);
      });
    }
  }, [stream]);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setErrorMsg(null);
    setIsVideoReady(false);
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser Anda.');
      }

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
          },
          audio: false,
        });
      } catch (errMode) {
        console.warn('Fallback to basic video constraint:', errMode);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      setErrorMsg(
        'Akses kamera ditolak atau tidak ditemukan. Pastikan izin kamera aktif di browser, atau gunakan opsi upload manual.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsVideoReady(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        // Mirror selfie view
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Reset matrix transformation so watermark text is NOT mirrored
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Draw official field inspection watermark banner at bottom
      const bannerHeight = 84;
      const bannerY = canvas.height - bannerHeight;

      // Dark gradient overlay for contrast
      const gradient = ctx.createLinearGradient(0, bannerY - 15, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.82)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, bannerY - 15, canvas.width, bannerHeight + 15);

      // Line 1: Live Timestamp with clock icon
      ctx.fillStyle = '#f59e0b'; // Amber-500
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`🕒 ${currentTime} WIB`, 16, bannerY + 22);

      // Line 2: Verified Location Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const locText = locationName || 'Site Lapangan PT Telekomunikasi';
      ctx.fillText(`📍 ${locText.length > 50 ? locText.substring(0, 50) + '...' : locText}`, 16, bannerY + 44);

      // Line 3: GPS Coordinates & Enterprise Tag
      ctx.fillStyle = '#34d399'; // Emerald-400
      ctx.font = '600 12px monospace';
      const coordsText = coordinates
        ? `🌐 GPS: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
        : '🌐 GPS: Terverifikasi Geofence';
      ctx.fillText(`${coordsText}  •  PT TELEKOMUNIKASI ERP`, 16, bannerY + 65);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const blob = dataURLtoBlob(dataUrl);

      setCapturedImage(dataUrl);
      stopCamera();
      onCapture(blob, dataUrl);
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      stopCamera();
      onCapture(file, url);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="user"
        onChange={handleManualUpload}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Captured Image Preview */}
      {capturedImage ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-slate-950 aspect-video max-h-64 flex items-center justify-center shadow-md">
          <img
            src={capturedImage}
            alt="Selfie Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Foto & Geotag Berhasil
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={retake}
            className="absolute bottom-2.5 right-2.5 text-xs bg-slate-900/90 text-white hover:bg-slate-900 border border-slate-700 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Ambil Ulang
          </Button>
        </div>
      ) : isCameraActive ? (
        /* Active Video Stream Container */
        <div className="relative rounded-xl overflow-hidden border-2 border-blue-500 bg-slate-950 aspect-video max-h-64 flex items-center justify-center shadow-md">
          <video
            ref={setVideoNode}
            autoPlay
            playsInline
            muted
            onLoadedData={() => setIsVideoReady(true)}
            onPlaying={() => setIsVideoReady(true)}
            className={`w-full h-full object-cover ${
              facingMode === 'user' ? '-scale-x-100' : ''
            }`}
          />

          {/* Loading Indicator while camera warms up */}
          {!isVideoReady && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white space-y-2 z-10">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <p className="text-xs font-semibold">Mengaktifkan sensor kamera & GPS...</p>
              <p className="text-[10px] text-slate-400">Menyiapkan watermark presensi</p>
            </div>
          )}

          {/* Viewfinder HUD Overlay: Jam, Lokasi, dan Koordinat Real-time */}
          {isVideoReady && (
            <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none bg-slate-950/75 backdrop-blur-md text-white p-2.5 rounded-lg border border-white/20 text-[10px] space-y-1 max-w-[85%] shadow-lg">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono text-[11px]">{currentTime} WIB</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate font-medium">{locationName || 'Kantor / Site Lapangan'}</span>
              </div>
              {coordinates && (
                <div className="flex items-center gap-1 font-mono text-emerald-400 text-[9.5px]">
                  <Navigation className="w-3 h-3 shrink-0" />
                  <span>Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleCameraFacing}
              title="Ganti Kamera Depan/Belakang"
              className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-slate-700 backdrop-blur-sm transition-colors shadow"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2 z-20 px-3">
            <Button
              type="button"
              onClick={takeSnapshot}
              disabled={!isVideoReady}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 shadow-xl rounded-full"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Jepret Selfie Sekarang
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopCamera}
              className="bg-slate-900/80 text-white hover:bg-slate-900 border-slate-700 text-xs rounded-full px-3.5 shadow-md"
            >
              Tutup
            </Button>
          </div>
        </div>
      ) : (
        /* Standby / Initial State */
        <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2.5">
          <Camera className="w-8 h-8 text-blue-600 mx-auto" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800">
              Kamera Selfie Clock-In & Watermark Geotag
            </p>
            <p className="text-[11px] text-slate-500">
              Waktu, nama lokasi, dan koordinat GPS dicap otomatis pada foto
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={() => startCamera()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              Buka Kamera Depan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-700 border-slate-300 hover:bg-white"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Manual dari File
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
