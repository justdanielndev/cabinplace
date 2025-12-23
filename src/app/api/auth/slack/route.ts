import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.HACKCLUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;
  const scopes = ['openid', 'profile', 'email', 'slack_id', 'verification_status'];

  const authUrl = new URL('https://auth.hackclub.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId!);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', scopes.join(' '));

  return NextResponse.redirect(authUrl.toString());
}
