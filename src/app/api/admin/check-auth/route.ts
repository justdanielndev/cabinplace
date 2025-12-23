import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getHackathonSettings } from '@/lib/settings';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    const settings = await getHackathonSettings();
    const isAdmin = Array.isArray(settings.adminSlackIds) && settings.adminSlackIds.includes(slackUserId);
    
    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}