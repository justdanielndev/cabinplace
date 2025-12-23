import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { updateUserInDatabase } from '@/lib/auth-sync';
import { ID } from 'appwrite';

async function findUserBySlackId(slackUserId: string) {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );
    
    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const member = response.documents[0] as any;
      return {
        id: member.$id,
        name: member.name || '',
        email: member.email || '',
        slackId: member.slackId || '',
        slackName: member.slackName || '',
        banned: member.banned || false,
        banreason: member.banReason || '',
        pending: member.pending || false
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createUserInAppwrite(user: any, isPending: boolean = false) {
  try {
    const userName = user.name || 'Unknown';
    const response = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      ID.unique(),
      {
        name: userName,
        slackName: userName,
        legalName: user.legalName || user.name || 'Unknown',
        email: user.email || '',
        slackId: user.slack_id,
        experiencePoints: 0,
        banned: false,
        pending: isPending,
        inviteId: `${uuidv4()}`,
        purchasedItems: '[]',
        teamId: ''
      }
    );
    return response;
  } catch (error) {
    console.error('Error creating user in Appwrite:', error);
    throw error;
  }
}

async function checkSignupsEnabled() {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', 'signUpsEnabled')]
    );

    if (response.documents.length === 0) {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (response.documents[0] as any).value || '';
    return value.toLowerCase() === 'true';
  } catch (error) {
    console.error('Error checking signups:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  
  if (error) {
    console.error('OAuth error:', error);
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=${encodeURIComponent(error)}`));
  }
  
  if (!code) {
    console.error('Missing code in callback');
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=missing_code`));
  }
  
  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.HACKCLUB_CLIENT_ID!);
    params.append('client_secret', process.env.HACKCLUB_CLIENT_SECRET!);
    params.append('redirect_uri', `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');

    const tokenResponse = await fetch('https://auth.hackclub.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('Token exchange error response:', errorBody);
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorBody}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tokens: any = await tokenResponse.json();
    console.log('Tokens received');

    const userInfoResponse = await fetch('https://auth.hackclub.com/oauth/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to fetch user info: ${userInfoResponse.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userInfo: any = await userInfoResponse.json();
    console.log('User info:', JSON.stringify(userInfo, null, 2));

    const user = {
      slack_id: userInfo.slack_id as string,
      name: userInfo.nickname as string,
      legalName: userInfo.name as string,
      email: userInfo.email as string,
      email_verified: userInfo.email_verified as boolean,
      verification_status: userInfo.verification_status as string
    };

    if (!user.slack_id) {
      console.error('Missing slack_id in user info. Available fields:', Object.keys(userInfo).join(', '));
      return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=missing_slack_id`));
    }

    const dbUser = await findUserBySlackId(user.slack_id);
    
    if (dbUser) {
      if (dbUser.banned) {
        return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/banned?reason=${encodeURIComponent(dbUser.banreason)}`));
      }

      try {
        await updateUserInDatabase(dbUser.id, {
          name: user.name,
          legalName: user.legalName,
          email: user.email
        }, dbUser);
      } catch (error) {
        console.error('Error syncing user data on auth:', error);
      }

      const redirectUrl = dbUser.pending
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/event-code`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`;
      
      const response = NextResponse.redirect(new URL(redirectUrl));
      
      response.cookies.set('slack_user_id', user.slack_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });

      response.cookies.set('access_token', tokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expires_in || 60 * 60 * 24 * 7
      });
      
      return response;
    }
    
    const signupsEnabled = await checkSignupsEnabled();
    await createUserInAppwrite(user, true);

    const redirectUrl = signupsEnabled 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/event-code`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/unauthorized`;
      
    const response = NextResponse.redirect(new URL(redirectUrl));
    
    response.cookies.set('slack_user_id', user.slack_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    });

    response.cookies.set('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 60 * 60 * 24 * 7
    });
    
    return response;
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=auth_failed`));
  }
}
