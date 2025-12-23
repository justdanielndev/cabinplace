import { databases, DB, APPWRITE_DATABASE_ID } from './appwrite';

export interface AuthUserData {
  name?: string;
  legalName?: string;
  email?: string;
}

async function getSlackUserNickname(slackUserId: string): Promise<string | null> {
  try {
    const response = await fetch('https://slack.com/api/users.info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`
      },
      body: `user=${encodeURIComponent(slackUserId)}`
    });

    if (!response.ok) {
      console.error('Failed to fetch Slack user info');
      return null;
    }

    interface SlackUserResponse {
      ok: boolean;
      error?: string;
      user?: {
        profile?: {
          display_name?: string;
        };
        real_name?: string;
      };
    }
    const data = await response.json() as SlackUserResponse;
    if (!data.ok) {
      console.error('Slack API error:', data.error);
      return null;
    }

    return data.user?.profile?.display_name || data.user?.real_name || null;
  } catch (error) {
    console.error('Error fetching Slack user nickname:', error);
    return null;
  }
}

export async function syncUserDataFromAuthProvider(
  accessToken: string,
  slackUserId?: string
): Promise<AuthUserData | null> {
  try {
    const userInfoResponse = await fetch('https://auth.hackclub.com/oauth/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info from auth provider');
      return null;
    }

    interface UserInfo {
      nickname?: string;
      name?: string;
      email?: string;
    }
    const userInfo = await userInfoResponse.json() as UserInfo;
    
    let slackNickname: string | null = null;
    if (slackUserId) {
      slackNickname = await getSlackUserNickname(slackUserId);
    }

    return {
      name: slackNickname || userInfo.nickname,
      legalName: userInfo.name,
      email: userInfo.email
    };
  } catch (error) {
    console.error('Error syncing user data from auth provider:', error);
    return null;
  }
}

export async function updateUserInDatabase(
  userId: string,
  freshUserData: AuthUserData,
  currentUserData: Record<string, unknown>
): Promise<void> {
  const updateFields: Record<string, unknown> = {};

  if (freshUserData.name && freshUserData.name !== (currentUserData.name as string)) {
    updateFields.name = freshUserData.name;
    updateFields.slackName = freshUserData.name;
  }
  if (freshUserData.legalName && freshUserData.legalName !== (currentUserData.legalName as string)) {
    updateFields.legalName = freshUserData.legalName;
  }
  if (freshUserData.email && freshUserData.email !== (currentUserData.email as string)) {
    updateFields.email = freshUserData.email;
  }

  if (Object.keys(updateFields).length > 0) {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        DB.MEMBERS,
        userId,
        updateFields
      );
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  }
}
