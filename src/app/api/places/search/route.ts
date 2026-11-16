import { NextResponse } from 'next/server';

interface PlaceSuggestion {
  id: string;
  title: string;
  subtitle: string;
  fullAddress: string;
  lat: number;
  lng: number;
  type?: string;
}

// Preset hub dan lokasi strategis telekomunikasi & logistik Indonesia untuk respon instan
const KNOWN_PRESETS: PlaceSuggestion[] = [
  {
    id: 'preset-1',
    title: 'Kantor Pusat PT Telekomunikasi Indonesia',
    subtitle: 'Jl. Gatot Subroto Kav. 52, Kuningan Barat, Mampang Prapatan, Jakarta Selatan',
    fullAddress: 'Jl. Gatot Subroto Kav. 52, Jakarta Selatan, DKI Jakarta 12710',
    lat: -6.239308,
    lng: 106.82711,
    type: 'Kantor Pusat',
  },
  {
    id: 'preset-2',
    title: 'Central Warehouse & Hub Logistik Bekasi',
    subtitle: 'Kawasan Industri MM2100, Cikarang Barat, Kabupaten Bekasi, Jawa Barat',
    fullAddress: 'Kawasan Industri MM2100 Blok C-4, Cikarang Barat, Bekasi, Jawa Barat',
    lat: -6.31294,
    lng: 107.10825,
    type: 'Gudang Pusat',
  },
  {
    id: 'preset-3',
    title: 'Regional Operations Hub Bandung',
    subtitle: 'Jl. Supratman No. 66, Cibeunying, Kota Bandung, Jawa Barat',
    fullAddress: 'Jl. Supratman No. 66, Cibeunying, Bandung, Jawa Barat',
    lat: -6.90389,
    lng: 107.62514,
    type: 'Hub Regional',
  },
  {
    id: 'preset-4',
    title: 'Hub Operasional Surabaya Rungkut',
    subtitle: 'Kawasan Industri SIER, Rungkut Industri Raya No. 12, Surabaya, Jawa Timur',
    fullAddress: 'Kawasan Industri SIER, Jl. Rungkut Industri Raya No. 12, Surabaya, Jawa Timur',
    lat: -7.33112,
    lng: 112.76023,
    type: 'Hub Operasional',
  },
  {
    id: 'preset-5',
    title: 'Hub Operasional Sumatra (Medan)',
    subtitle: 'Jl. Sisingamangaraja No. 88, Medan Kota, Kota Medan, Sumatera Utara',
    fullAddress: 'Jl. Sisingamangaraja No. 88, Medan, Sumatera Utara',
    lat: 3.58231,
    lng: 98.68341,
    type: 'Hub Operasional',
  },
  {
    id: 'preset-6',
    title: 'Hub Operasional Sulawesi (Makassar)',
    subtitle: 'Jl. Pengayoman No. 15, Panakkukang, Kota Makassar, Sulawesi Selatan',
    fullAddress: 'Jl. Pengayoman No. 15, Panakkukang, Makassar, Sulawesi Selatan',
    lat: -5.15542,
    lng: 119.44182,
    type: 'Hub Operasional',
  },
  {
    id: 'preset-7',
    title: 'Site Bali & Nusa Tenggara (Denpasar)',
    subtitle: 'Jl. Teuku Umar No. 102, Denpasar Barat, Kota Denpasar, Bali',
    fullAddress: 'Jl. Teuku Umar No. 102, Denpasar Barat, Denpasar, Bali',
    lat: -8.67512,
    lng: 115.20783,
    type: 'Site Kantor',
  },
  {
    id: 'preset-8',
    title: 'JNE Express Taruna / Agen Taruna',
    subtitle: 'Jl. Taruna, Sukapura / Pulo Gadung, Jakarta Timur, DKI Jakarta',
    fullAddress: 'Jl. Taruna, Sukapura, Cilincing, Jakarta Utara / Jakarta Timur, DKI Jakarta',
    lat: -6.149976,
    lng: 106.927571,
    type: 'Ekspedisi & Logistik',
  },
  {
    id: 'preset-9',
    title: 'JNE Senen Jakarta Pusat',
    subtitle: 'Jl. Senen Dalam Gang II, RW 04, Senen, Jakarta Pusat, DKI Jakarta',
    fullAddress: 'Jalan Senen Dalam Gang II, RW 04, Senen, Jakarta Pusat, DKI Jakarta 10460',
    lat: -6.173144,
    lng: 106.841142,
    type: 'Ekspedisi & Logistik',
  },
  {
    id: 'preset-10',
    title: 'JNE Kebayoran Lama Jakarta Selatan',
    subtitle: 'JPO Kebayoran Lama, RW 01, Kebayoran Lama Utara, Jakarta Selatan',
    fullAddress: 'JPO Kebayoran Lama, RW 01, Kebayoran Lama, Jakarta Selatan 12220',
    lat: -6.238883,
    lng: 106.784138,
    type: 'Ekspedisi & Logistik',
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ places: [] });
  }

  const normalizedQ = q.toLowerCase();

  // 1. Cek pencocokan preset cepat lokal
  const matchedPresets = KNOWN_PRESETS.filter(
    (p) =>
      p.title.toLowerCase().includes(normalizedQ) ||
      p.subtitle.toLowerCase().includes(normalizedQ) ||
      p.fullAddress.toLowerCase().includes(normalizedQ) ||
      normalizedQ.split(/\s+/).some((term) => p.title.toLowerCase().includes(term) && term.length > 2)
  );

  try {
    // 2. Query Nominatim OpenStreetMap dengan limit 7
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&countrycodes=id&limit=8&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'PTTelekomunikasiIndonesiaERP/1.0 (admin@telekomunikasi.co.id)',
        'Accept-Language': 'id,en',
      },
      next: { revalidate: 3600 },
    });

    let externalPlaces: PlaceSuggestion[] = [];

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        externalPlaces = data.map((item: any, idx: number) => {
          const parts = (item.display_name || '').split(',').map((s: string) => s.trim());
          const mainTitle = item.name || parts[0] || 'Titik Lokasi';
          const subTitle = parts.slice(1, 4).join(', ') || parts.slice(1).join(', ');

          return {
            id: `osm-${item.place_id || idx}`,
            title: mainTitle,
            subtitle: subTitle || item.display_name,
            fullAddress: item.display_name,
            lat: Number(parseFloat(item.lat).toFixed(6)),
            lng: Number(parseFloat(item.lon).toFixed(6)),
            type: item.type ? item.type.replace(/_/g, ' ') : 'Lokasi Peta',
          };
        });
      }
    }

    // Jika pencarian dengan query lengkap tidak ada hasil di OSM, coba fallback kata kunci utama
    if (externalPlaces.length === 0 && q.includes(' ')) {
      const words = q.split(' ').filter((w) => w.length > 2);
      const fallbackTerm = words[words.length - 1]; // e.g. "taruna" jika "jne taruna"
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        fallbackTerm + ' jakarta'
      )}&countrycodes=id&limit=6&addressdetails=1`;

      const fallbackRes = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'PTTelekomunikasiIndonesiaERP/1.0 (admin@telekomunikasi.co.id)',
          'Accept-Language': 'id,en',
        },
      });

      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (Array.isArray(fallbackData)) {
          const fbPlaces = fallbackData.map((item: any, idx: number) => {
            const parts = (item.display_name || '').split(',').map((s: string) => s.trim());
            return {
              id: `osm-fb-${item.place_id || idx}`,
              title: item.name || parts[0] || fallbackTerm,
              subtitle: parts.slice(1, 4).join(', ') || parts.slice(1).join(', '),
              fullAddress: item.display_name,
              lat: Number(parseFloat(item.lat).toFixed(6)),
              lng: Number(parseFloat(item.lon).toFixed(6)),
              type: item.type ? item.type.replace(/_/g, ' ') : 'Lokasi Peta',
            };
          });
          externalPlaces.push(...fbPlaces);
        }
      }
    }

    // Gabungkan hasil preset dan hasil OSM, hilangkan duplikat koordinat
    const combined: PlaceSuggestion[] = [...matchedPresets];
    for (const p of externalPlaces) {
      const exists = combined.some(
        (c) => Math.abs(c.lat - p.lat) < 0.0001 && Math.abs(c.lng - p.lng) < 0.0001
      );
      if (!exists) {
        combined.push(p);
      }
    }

    return NextResponse.json({ places: combined.slice(0, 8) });
  } catch (err: any) {
    console.warn('Place search API error:', err);
    return NextResponse.json({ places: matchedPresets });
  }
}
