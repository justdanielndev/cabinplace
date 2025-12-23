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

    if (teamType !== 'Ask for invite') {
      return NextResponse.json({ error: 'This team does not accept join requests' }, { status: 400 });
    }

    const currentJoinRequests = Array.isArray(teamRecord.joinRequests) ? teamRecord.joinRequests : [];
    
    const existingRequest = currentJoinRequests.find((req: { id: string }) => req.id === slackUserId);
    if (existingRequest) {
      return NextResponse.json({ error: 'Join request already sent' }, { status: 400 });
    }
    
    const newRequest = {
      id: slackUserId,
      name: userRecord.name || '',
      slackName: userRecord.slackName || '',
      requestDate: new Date().toISOString(),
      status: 'pending'
    };
    
    const updatedJoinRequests = [...currentJoinRequests, newRequest];
    
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      teamRecord.$id,
      { joinRequests: updatedJoinRequests }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending join request:', error);
    return NextResponse.json({ error: 'Failed to send join request' }, { status: 500 });
  }
}
