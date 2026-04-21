import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the user is already explicitly on an /m path (to prevent infinite loops)
  if (pathname.startsWith('/m/')) {
    return NextResponse.next();
  }

  // 2. Grab their browser's User-Agent to see what device they are holding
  const userAgent = request.headers.get('user-agent') || '';
  
  // A robust Regex to catch iPhones, Androids, and mobile browsers
  const isMobile = /mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);

  // 3. THE REWRITE MAGIC
  if (isMobile) {
    const url = request.nextUrl.clone();
    
    // If they go to rigbuilders.in/ , rewrite to /m
    if (pathname === '/') {
      url.pathname = '/m';
    } 
    // If they go to rigbuilders.in/signin , rewrite to /m/signin
    else {
      url.pathname = `/m${pathname}`;
    }
    
    // NextResponse.rewrite serves the new file BUT keeps the original URL in the browser!
    return NextResponse.rewrite(url);
  }

  // 4. If they are on a Desktop computer, just let them through normally
  return NextResponse.next();
}

// 5. This tells Next.js NOT to run this middleware on images, API routes, or static files to save server performance
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Any file with an extension like .jpg, .png, .svg
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};