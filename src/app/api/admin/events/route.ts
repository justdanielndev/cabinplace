import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID } from '@/lib/appwrite';
import { getHackathonSettings } from '@/lib/settings';
import { ID } from 'node-appwrite';

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

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.EVENTS,
      []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = response.documents.map((doc: any) => {
      let extras: string[] = [];
      try {
        if (typeof doc.extras === 'string') {
          extras = JSON.parse(doc.extras);
        } else if (Array.isArray(doc.extras)) {
          extras = doc.extras;
        }
      } catch {
        extras = [];
      }
      
      return {
        id: doc.$id,
        name: doc.name || '',
        location: doc.location || '',
        description: doc.description || '',
        dayOfWeek: doc.dayOfWeek || '',
        hour: doc.hour || '',
        extras: extras,
        xpToBuy: doc.xpToBuy || null,
        maxAttendees: doc.maxAttendees || null,
        storeItemId: doc.storeItemId || null,
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
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

    const body = await request.json();

    const doc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      DB.EVENTS,
      ID.unique(),
      {
        name: body.name,
        location: body.location,
        description: body.description,
        dayOfWeek: body.dayOfWeek,
        hour: body.hour,
        extras: JSON.stringify(body.extras || []),
        xpToBuy: body.xpToBuy || null,
        maxAttendees: body.maxAttendees || null,
        storeItemId: body.storeItemId || null,
      }
    );

    return NextResponse.json({ event: doc });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    const updatePayload = {
      ...updateData,
      ...(updateData.extras && { extras: JSON.stringify(updateData.extras) }),
    };

    const doc = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.EVENTS,
      id,
      updatePayload
    );

    return NextResponse.json({ event: doc });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      DB.EVENTS,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
