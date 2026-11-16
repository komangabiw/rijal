'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, PenTool } from 'lucide-react';
import { dataURLtoBlob } from '@/lib/storage';

interface SignaturePadProps {
  onSave: (blob: Blob, dataUrl: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SignaturePad({ onSave, onClear, className = '' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportSignature();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onClear?.();
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const blob = dataURLtoBlob(dataUrl);
    onSave(blob, dataUrl);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-50 touch-none">
        <canvas
          ref={canvasRef}
          width={450}
          height={160}
          className="w-full h-36 cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium gap-1.5">
            <PenTool className="w-4 h-4 opacity-50" />
            <span>Tanda tangan di sini menggunakan jari atau stylus</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-[11px] text-slate-500">
          {hasSignature ? '✓ Tanda tangan aktif tercatat' : 'Goreskan paraf di area di atas'}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={clearCanvas}
          className="h-7 text-xs text-slate-600 border-slate-300"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Hapus / Ulangi
        </Button>
      </div>
    </div>
  );
}
