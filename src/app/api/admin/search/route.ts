import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { getHackathonSettings } from '@/lib/settings';

async function checkAdminAuth(slackUserId: string) {
  try {
    const settings = await getHackathonSettings();
    return Array.isArray(settings.adminSlackIds) && settings.adminSlackIds.includes(slackUserId);
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;

    if (!slackUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const isAdmin = await checkAdminAuth(slackUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const query = request.nextUrl.searchParams.get('q') || '';
    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      []
    );

    const searchTerm = query.toLowerCase();
    const results = response.documents
      .filter((doc: any) => {
        const name = (doc.name || '').toLowerCase();
        const email = (doc.email || '').toLowerCase();
        const slackName = (doc.slackName || '').toLowerCase();
        const slackId = (doc.slackId || '').toLowerCase();

        return (
          name.includes(searchTerm) ||
          email.includes(searchTerm) ||
          slackName.includes(searchTerm) ||
          slackId.includes(searchTerm)
        );
      })
      .slice(0, 20)
      .map((doc: any) => ({
        id: doc.$id,
        inviteId: doc.inviteId,
        name: doc.name,
        email: doc.email,
        slackName: doc.slackName,
        slackId: doc.slackId,
        xp: doc.experiencePoints || 0,
        banned: doc.banned || false,
        teamId: doc.teamId || '',
        pending: doc.pending || false
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
