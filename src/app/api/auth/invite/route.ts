import { NextRequest, NextResponse } from 'next/server';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json();

    if (!inviteCode || typeof inviteCode !== 'string') {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const settingsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', 'signUpsEnabled')]
    );

    if (settingsResponse.documents.length === 0) {
      return NextResponse.json({ error: 'Sign ups are not configured' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (settingsResponse.documents[0] as any).value || '';
    const signUpsEnabled = value.toLowerCase() === 'true';
    
    if (!signUpsEnabled) {
      return NextResponse.json({ error: 'Sign ups are currently disabled' }, { status: 403 });
    }

    const eventCodeResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', 'eventCode')]
    );

    if (eventCodeResponse.documents.length === 0) {
      return NextResponse.json({ error: 'Event code not configured' }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storedEventCode = (eventCodeResponse.documents[0] as any).value || '';
    
    if (!storedEventCode || inviteCode.trim().toUpperCase() !== storedEventCode.toUpperCase()) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ 
      success: true,
      requiresSlackAuth: true,
      message: 'Valid invite code. Please complete Slack authentication.'
    });
    
    response.cookies.set('valid_invite_code', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10
    });

    return response;
  } catch (error) {
    console.error('Invite code validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
