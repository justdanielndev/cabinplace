import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { syncUserDataFromAuthProvider, updateUserInDatabase } from '@/lib/auth-sync';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const accessToken = cookieStore.get('access_token')?.value;

    let freshUserData = null;

    if (accessToken) {
      freshUserData = await syncUserDataFromAuthProvider(accessToken, slackUserId);
    }

    const memberResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );

    if (memberResponse.documents.length === 0) {
      const response = NextResponse.json(
        { authenticated: false, reason: 'user_not_found' },
        { status: 401 }
      );
      response.cookies.delete('slack_user_id');
      return response;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = memberResponse.documents[0] as any;

    if (user.banned) {
      const response = NextResponse.json(
        { authenticated: false, reason: 'user_banned', banReason: user.banReason },
        { status: 403 }
      );
      response.cookies.delete('slack_user_id');
      return response;
    }

    if (freshUserData) {
      try {
        await updateUserInDatabase(user.$id, freshUserData, user);
        Object.assign(user, {
          name: freshUserData.name || user.name,
          legalName: freshUserData.legalName || user.legalName,
          email: freshUserData.email || user.email
        });
      } catch (error) {
        console.error('Error updating user data:', error);      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.$id,
        slackId: user.slackId,
        name: user.name,
        legalName: user.legalName,
        email: user.email,
        slackName: user.slackName,
        experiencePoints: user.experiencePoints || 0,
        teamId: user.teamId,
        pending: user.pending || false,
        banned: user.banned || false,
        inviteId: user.inviteId
      }
    });
  } catch (error) {
    console.error('Error syncing auth:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to sync auth' },
      { status: 500 }
    );
  }
}
