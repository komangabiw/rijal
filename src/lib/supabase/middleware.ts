import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith('/login') || path.startsWith('/auth');
  const isApiAuth = path.startsWith('/api/auth');

  // Allow static files, favicon, public assets
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return supabaseResponse;
  }

  // Check evaluator / demo session cookie
  const demoSession = request.cookies.get('telecom_session')?.value;
  const isExplicitLogout =
    request.nextUrl.searchParams.get('loggedOut') === '1' ||
    request.nextUrl.searchParams.get('logout') === 'true';

  if (isExplicitLogout) {
    // Bersihkan sesi dan biarkan user berada di halaman login
    supabaseResponse.cookies.set('telecom_session', '', { path: '/', maxAge: 0 });
    request.cookies.getAll().forEach((c) => {
      if (c.name.startsWith('sb-') || c.name.includes('telecom')) {
        supabaseResponse.cookies.set(c.name, '', { path: '/', maxAge: 0 });
      }
    });
    return supabaseResponse;
  }

  let user = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://txoaumfxfymyzvdpyxhi.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_xeCi3MMb3WKdfFV3pvESjw_RAgg_psi',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  } catch {
    // If Supabase request fails or is unreachable, fallback to demoSession
  }

  // Sesi valid jika terdapat demoSession aktif, atau akun Supabase terverifikasi
  const isAuthenticated = !!demoSession || !!user;

  // Redirect unauthenticated users to /login if trying to access dashboard/modules
  if (!isAuthenticated && !isAuthPage && !isApiAuth && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated user away from login to dashboard hanya jika ada sesi telecom_session aktif
  if (!!demoSession && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
