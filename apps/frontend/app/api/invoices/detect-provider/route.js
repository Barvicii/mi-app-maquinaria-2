/**
 * GET /api/invoices/detect-provider?email=user@gmail.com
 *
 * Quick preview endpoint used by the UI to show which IMAP provider will be
 * used when the user types an email. Auth required (session).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { detectProvider } from '@/lib/imap-providers';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const email = (searchParams.get('email') || '').trim();
  if (!email) return NextResponse.json({ error: 'email query param required' }, { status: 400 });

  const provider = detectProvider(email);
  if (!provider) {
    return NextResponse.json({
      detected: false,
      email,
      message: 'Unknown provider. You can still use it by entering IMAP host/port manually.',
    });
  }
  return NextResponse.json({ detected: true, email, provider });
}
