import { NextResponse } from 'next/server';

export function middleware(request) {
  // Commenta temporaneamente il codice per il test
  return NextResponse.next();
}

// Specifica su quali percorsi applicare il middleware
export const config = {
  matcher: ['/dashboard/:path*']
};