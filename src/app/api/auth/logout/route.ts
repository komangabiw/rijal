import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Berhasil keluar dari sesi PT Telekomunikasi',
  });

  // Hapus cookie telecom_session
  response.cookies.set('telecom_session', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: false,
    sameSite: 'lax',
  });

  // Hapus semua cookies yang berawalan sb- (Supabase auth tokens)
  const allCookies = request.cookies.getAll();
  allCookies.forEach((c) => {
    if (c.name.startsWith('sb-') || c.name.includes('supabase') || c.name.includes('telecom')) {
      response.cookies.set(c.name, '', {
        path: '/',
        maxAge: 0,
        expires: new Date(0),
      });
    }
  });

  return response;
}

export async function GET(request: NextRequest) {
  return POST(request);
}
