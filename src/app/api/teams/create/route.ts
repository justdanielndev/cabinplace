import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';

export async function POST(request: Request) {
  try {
    const { teamName, teamType } = await request.json();
    
    if (!teamName || !teamType) {
      return NextResponse.json({ error: 'Team name and type are required' }, { status: 400 });
    }

    if (!['Public', 'Private', 'Ask for invite'].includes(teamType)) {
      return NextResponse.json({ error: 'Invalid team type' }, { status: 400 });
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

    const teamId = uuidv4();
    const teamMember = {
      id: slackUserId,
      name: userRecord.name || '',
      slackName: userRecord.slackName || ''
    };

    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      ID.unique(),
      {
        teamId: teamId,
        name: teamName,
        teamSize: 1,
        members: JSON.stringify([teamMember]),
        projects: '[]',
        joinRequests: '[]',
        type: teamType
      }
    );

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      userRecord.$id,
      { teamId: teamId }
    );

    return NextResponse.json({ success: true, teamId: teamId });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
