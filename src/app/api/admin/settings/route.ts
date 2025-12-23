import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID } from '@/lib/appwrite';
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

    interface SettingsUpdate {
      startDateAndTime: string;
      endDateAndTime: string;
      eventCode: string;
      signUpsEnabled: boolean;
      votingEnabled: boolean;
      projectsEnabled: boolean;
      teamEnabled: boolean;
      eventsEnabled: boolean;
      newsEnabled: boolean;
      leaderboardEnabled: boolean;
      storeEnabled: boolean;
      minAge: number;
      maxAge: number;
      friday: string;
      saturday: string;
      sunday: string;
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      dateOrder?: string[];
    }
    const body = await request.json() as SettingsUpdate;

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

        interface SettingDoc {
          $id: string;
          key?: string;
        }
        const existing = response.documents.find((doc: SettingDoc) => (doc as SettingDoc & { key: string }).key === setting.key);

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
