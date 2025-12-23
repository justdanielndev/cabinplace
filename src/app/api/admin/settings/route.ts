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

export async function GET() {
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

    const settings = await getHackathonSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json() as any;

    const settingsToUpdate = [
      { key: 'startDateAndTime', value: body.startDateAndTime },
      { key: 'endDateAndTime', value: body.endDateAndTime },
      { key: 'eventCode', value: body.eventCode },
      { key: 'signUpsEnabled', value: body.signUpsEnabled ? 'true' : 'false' },
      { key: 'votingEnabled', value: body.votingEnabled ? 'true' : 'false' },
      { key: 'projectsEnabled', value: body.projectsEnabled ? 'true' : 'false' },
      { key: 'teamEnabled', value: body.teamEnabled ? 'true' : 'false' },
      { key: 'eventsEnabled', value: body.eventsEnabled ? 'true' : 'false' },
      { key: 'newsEnabled', value: body.newsEnabled ? 'true' : 'false' },
      { key: 'leaderboardEnabled', value: body.leaderboardEnabled ? 'true' : 'false' },
      { key: 'storeEnabled', value: body.storeEnabled ? 'true' : 'false' },
      { key: 'minAge', value: body.minAge.toString() },
      { key: 'maxAge', value: body.maxAge.toString() },
      { key: 'friday', value: body.friday },
      { key: 'saturday', value: body.saturday },
      { key: 'sunday', value: body.sunday },
      { key: 'monday', value: body.monday },
      { key: 'tuesday', value: body.tuesday },
      { key: 'wednesday', value: body.wednesday },
      { key: 'thursday', value: body.thursday },
      { key: 'dateOrder', value: JSON.stringify(body.dateOrder || []) }
    ];

    for (const setting of settingsToUpdate) {
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          DB.GLOBAL_SETTINGS,
          []
        );

        const existing = response.documents.find((doc: any) => doc.key === setting.key);

        if (existing) {
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            DB.GLOBAL_SETTINGS,
            existing.$id,
            { value: setting.value }
          );
        } else {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            DB.GLOBAL_SETTINGS,
            `settings_${setting.key}`,
            {
              key: setting.key,
              value: setting.value
            }
          );
        }
      } catch (error) {
        console.error(`Error updating setting ${setting.key}:`, error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
