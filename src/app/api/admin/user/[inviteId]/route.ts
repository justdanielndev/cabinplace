import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { getHackathonSettings } from '@/lib/settings';

async function getTeamNameById(teamId: string) {
  if (!teamId) return 'No Team Assigned';

  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      [Query.equal('teamId', teamId)]
    );

    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamName = (response.documents[0] as any).name;
      return teamName || 'No Team Assigned';
    }

    return 'No Team Assigned';
  } catch (error) {
    console.error('Error fetching team name:', error);
    return 'No Team Assigned';
  }
}

async function findUserByInviteId(inviteId: string) {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('inviteId', inviteId)]
    );

    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const member = response.documents[0] as any;
      const purchasedItems = Array.isArray(member.purchasedItems) ? member.purchasedItems : [];

      const teamId = member.teamId || '';
      const teamName = await getTeamNameById(teamId);

      return {
        id: member.$id,
        name: member.name || '',
        legalName: member.legalName || '',
        email: member.email || '',
        slackId: member.slackId || '',
        slackName: member.slackName || '',
        xp: member.experiencePoints || 0,
        teamId: teamId,
        teamName: teamName,
        inviteId: member.inviteId || '',
        banned: member.banned || false,
        banreason: member.banReason || '',
        purchasedItems: purchasedItems,
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user by invite ID:', error);
    return null;
  }
}

async function checkAdminAuth(slackUserId: string) {
  try {
    const settings = await getHackathonSettings();
    return settings.adminSlackIds.includes(slackUserId);
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return false;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ inviteId: string }> }) {
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

    const { inviteId } = await params;
    const user = await findUserByInviteId(inviteId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
