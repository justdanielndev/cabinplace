import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

export async function POST(request: Request) {
  try {
    const { teamId } = await request.json();
    
    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const membersResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );

    if (membersResponse.documents.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRecord = membersResponse.documents[0] as any;
    const currentTeamId = userRecord.teamId;

    if (currentTeamId) {
      return NextResponse.json({ error: 'User is already on a team' }, { status: 400 });
    }

    const teamsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      [Query.equal('teamId', teamId)]
    );

    if (teamsResponse.documents.length === 0) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamRecord = teamsResponse.documents[0] as any;
    const teamType = teamRecord.type;

    if (teamType === 'Private') {
      return NextResponse.json({ error: 'Cannot join private team' }, { status: 403 });
    }

    const newMember = {
      id: slackUserId,
      name: userRecord.name || '',
      slackName: userRecord.slackName || ''
    };

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      userRecord.$id,
      { teamId: teamId }
    );

    let currentMembers: unknown[] = [];
    try {
      currentMembers = Array.isArray(teamRecord.members) 
        ? teamRecord.members 
        : JSON.parse(teamRecord.members || '[]');
    } catch {
      currentMembers = [];
    }
    const updatedMembers = [...currentMembers, newMember];

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      teamRecord.$id,
      {
        members: updatedMembers,
        teamSize: updatedMembers.length
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json({ error: 'Failed to join team' }, { status: 500 });
  }
}
