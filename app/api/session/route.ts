import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const cookieStore = cookies();
    const isProd = process.env.NODE_ENV === 'production';
    (await cookieStore).set('session', idToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    });

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies();
    (await cookieStore).delete('session');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear session' }, { status: 500 });
  }
}


