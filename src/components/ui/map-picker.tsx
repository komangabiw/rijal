'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, LocateFixed, Navigation, CheckCircle2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  onChange: (lat: number, lng: number, address?: string) => void;
  className?: string;
}

export function MapPicker({
  latitude,
  longitude,
  radiusMeters = 100,
  onChange,
  className = '',
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: latitude || -6.239308,
    lng: longitude || 106.82711,
  });

  // Sinkronisasi koordinat internal jika props berubah dari luar
  useEffect(() => {
    if (latitude && longitude) {
      if (latitude !== currentCoords.lat || longitude !== currentCoords.lng) {
        setCurrentCoords({ lat: latitude, lng: longitude });
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
          if (circleRef.current) {
            circleRef.current.setLatLng([latitude, longitude]);
            circleRef.current.setRadius(radiusMeters);
          }
          mapInstanceRef.current.panTo([latitude, longitude]);
        }
      }
    }
  }, [latitude, longitude, radiusMeters]);

  // Inisialisasi Peta Leaflet secara dinamis pada sisi klien
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return; // Sudah diinisialisasi

      try {
        const L = (await import('leaflet')).default;
        // Import css Leaflet secara runtime
        if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!isMounted || !mapContainerRef.current) return;

        const defaultLat = latitude || -6.239308;
        const defaultLng = longitude || 106.82711;

        // Custom icon pin marker agar tajam dan konsisten tanpa asset eksternal bermasalah
        const customPinIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="position: relative; width: 36px; height: 36px; transform: translate(-50%, -100%); display: flex; align-items: center; justify-content: center;">
              <div style="width: 32px; height: 32px; background: #0891b2; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 14px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
                <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [0, 0],
        });

        const map = L.map(mapContainerRef.current, {
          center: [defaultLat, defaultLng],
          zoom: 16,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        // OpenStreetMap CartoDB Dark Matter / OSM Standard Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        // Marker Titik Kantor
        const marker = L.marker([defaultLat, defaultLng], {
          icon: customPinIcon,
          draggable: true,
        }).addTo(map);
        markerRef.current = marker;

        // Circle Radius Toleransi Geofencing
        const circle = L.circle([defaultLat, defaultLng], {
          radius: radiusMeters,
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.22,
          weight: 2,
        }).addTo(map);
        circleRef.current = circle;

        // Event Klik pada Peta untuk Memilih Titik
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          const cleanLat = Number(lat.toFixed(6));
          const cleanLng = Number(lng.toFixed(6));
          setCurrentCoords({ lat: cleanLat, lng: cleanLng });
          marker.setLatLng([cleanLat, cleanLng]);
          circle.setLatLng([cleanLat, cleanLng]);
          onChange(cleanLat, cleanLng);
        });

        // Event Drag Marker
        marker.on('dragend', (e: any) => {
          const latLng = e.target.getLatLng();
          const cleanLat = Number(latLng.lat.toFixed(6));
          const cleanLng = Number(latLng.lng.toFixed(6));
          setCurrentCoords({ lat: cleanLat, lng: cleanLng });
          circle.setLatLng([cleanLat, cleanLng]);
          onChange(cleanLat, cleanLng);
        });

        // Fix Leaflet tile loading container size
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      } catch (err) {
        console.error('Failed to initialize Leaflet map:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle radius jika prop berubah
  useEffect(() => {
    if (circleRef.current && radiusMeters) {
      circleRef.current.setRadius(radiusMeters);
    }
  }, [radiusMeters]);

  // Handler Cari Alamat / Lokasi via OSM Nominatim
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=id&limit=1`,
        {
          headers: {
            'Accept-Language': 'id',
          },
        }
      );
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const item = results[0];
          const newLat = Number(parseFloat(item.lat).toFixed(6));
          const newLng = Number(parseFloat(item.lon).toFixed(6));

          setCurrentCoords({ lat: newLat, lng: newLng });
          onChange(newLat, newLng, item.display_name);

          if (mapInstanceRef.current && markerRef.current && circleRef.current) {
            mapInstanceRef.current.setView([newLat, newLng], 16);
            markerRef.current.setLatLng([newLat, newLng]);
            circleRef.current.setLatLng([newLat, newLng]);
          }
        } else {
          alert('Lokasi tidak ditemukan di peta. Coba masukkan nama jalan atau daerah yang lebih spesifik.');
        }
      }
    } catch (err) {
      console.warn('Gagal mencari alamat peta:', err);
      alert('Gagal menghubungkan ke layanan pencarian peta.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handler Gunakan GPS Browser Saat Ini
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myLat = Number(pos.coords.latitude.toFixed(6));
        const myLng = Number(pos.coords.longitude.toFixed(6));

        setCurrentCoords({ lat: myLat, lng: myLng });
        onChange(myLat, myLng);

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          mapInstanceRef.current.setView([myLat, myLng], 17);
          markerRef.current.setLatLng([myLat, myLng]);
          circleRef.current.setLatLng([myLat, myLng]);
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('Gagal mengambil titik GPS lokasi saat ini. Pastikan izin lokasi browser telah diaktifkan.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Top Map Toolbar: Search & GPS Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <form onSubmit={handleSearchLocation} className="flex-1 flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama jalan / gedung / kota untuk cari titik..."
              className="pl-8 text-xs bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-500 rounded-xl h-8.5"
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            size="sm"
            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 h-8.5 px-3 rounded-xl shrink-0"
          >
            {isSearching ? 'Mencari...' : 'Cari di Peta'}
          </Button>
        </form>

        <Button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          size="sm"
          className="text-xs bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 h-8.5 px-3 rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          {isLocating ? 'Mendeteksi...' : 'Lokasi Saya'}
        </Button>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-zinc-800 shadow-inner bg-zinc-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Instruction & Info Badge */}
        <div className="absolute top-2 left-2 z-[400] bg-zinc-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[10px] text-zinc-300 flex items-center gap-2 shadow-md">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Klik atau seret pin pada peta untuk memilih titik lokasi kantor</span>
        </div>

        {/* Floating Coordinates & Radius Badge */}
        <div className="absolute bottom-2 left-2 right-2 z-[400] bg-zinc-950/90 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-800 text-[11px] flex flex-wrap items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2 font-mono text-zinc-200">
            <span className="text-cyan-400 font-bold">Lat:</span> {currentCoords.lat.toFixed(6)}
            <span className="text-cyan-400 font-bold ml-2">Lng:</span> {currentCoords.lng.toFixed(6)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              Radius Geofence: <strong className="text-cyan-400">{radiusMeters}m</strong>
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Titik Terkunci
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
