'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { dataURLtoBlob } from '@/lib/storage';

interface WebcamCaptureProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  className?: string;
}

export function WebcamCapture({ onCapture, className = '' }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera tidak didukung oleh browser Anda.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      setErrorMsg('Akses kamera tidak diizinkan atau tidak tersedia. Anda dapat upload foto secara manual.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Flip horizontally for natural mirror selfie view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500 bg-black aspect-video max-h-56 flex items-center justify-center">
          <img
            src={capturedImage}
            alt="Selfie Preview"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
            <CheckCircle2 className="w-3 h-3" />
            Foto Berhasil Ditangkap
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={retake}
            className="absolute bottom-2 right-2 text-xs bg-slate-900/80 text-white hover:bg-slate-900 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Ambil Ulang
          </Button>
        </div>
      ) : isCameraActive ? (
        /* Active Video Stream */
        <div className="relative rounded-xl overflow-hidden border-2 border-blue-500 bg-black aspect-video max-h-56 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
            <Button
              type="button"
              onClick={takeSnapshot}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 shadow-lg rounded-full"
            >
              <Camera className="w-4 h-4 mr-1.5" />
              Jepret Selfie Sekarang
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopCamera}
              className="bg-slate-900/70 text-white hover:bg-slate-900 border-slate-700 text-xs rounded-full"
            >
              Tutup
            </Button>
          </div>
        </div>
      ) : (
        /* Standby / Initial state */
        <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2.5">
          <Camera className="w-8 h-8 text-blue-600 mx-auto" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-800">
              Kamera Selfie Clock-In & Face Verification
            </p>
            <p className="text-[11px] text-slate-500">
              Wajib menyertakan foto wajah terkini di lokasi proyek/kantor
            </p>
          </div>

          {errorMsg && (
            <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5 text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              Buka Kamera Depan
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-slate-700 border-slate-300"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Manual dari HP
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
