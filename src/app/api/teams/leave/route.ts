import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

export async function POST() {
  try {
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

    if (!currentTeamId) {
      return NextResponse.json({ error: 'User is not on a team' }, { status: 400 });
    }

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      userRecord.$id,
      { teamId: null }
    );

    const teamsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      [Query.equal('teamId', currentTeamId)]
    );

    if (teamsResponse.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamRecord = teamsResponse.documents[0] as any;
      let currentMembers: unknown[] = [];
      try {
        currentMembers = Array.isArray(teamRecord.members) 
          ? teamRecord.members 
          : JSON.parse(teamRecord.members || '[]');
      } catch {
        currentMembers = [];
      }
      const updatedMembers = (currentMembers as { id: string }[]).filter((member) => member.id !== slackUserId);

      if (updatedMembers.length === 0) {
        await databases.deleteDocument(
          APPWRITE_DATABASE_ID,
          DB.TEAMS,
          teamRecord.$id
        );
      } else {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          DB.TEAMS,
          teamRecord.$id,
          {
            members: updatedMembers,
            teamSize: updatedMembers.length
          }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving team:', error);
    return NextResponse.json({ error: 'Failed to leave team' }, { status: 500 });
  }
}
