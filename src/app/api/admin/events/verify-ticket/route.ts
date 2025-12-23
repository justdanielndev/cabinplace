import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { getHackathonSettings } from '@/lib/settings';

async function isAuthorizedAdmin() {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) return false;

    const settings = await getHackathonSettings();
    return Array.isArray(settings.adminSlackIds) && settings.adminSlackIds.includes(slackUserId);
  } catch (error) {
    console.error('Error checking admin auth:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthorizedAdmin();
    
    if (!isAdmin) {
      return NextResponse.json({ valid: false, message: 'Unauthorized - admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { ticketData } = body;

    if (!ticketData) {
      return NextResponse.json({ valid: false, message: 'Invalid ticket data' }, { status: 400 });
    }

    const [userId, eventId] = ticketData.split('-');

    if (!userId || !eventId) {
      return NextResponse.json({ valid: false, message: 'Invalid ticket format' }, { status: 400 });
    }

    const members = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', userId)]
    );

    if (members.documents.length === 0) {
      return NextResponse.json({ valid: false, message: 'User not found' }, { status: 404 });
    }

    interface Member {
      name?: string;
      email?: string;
      slackName?: string;
      purchasedItems?: string | unknown[];
    }
    const member = members.documents[0] as Member;
    
    const eventsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.EVENTS,
      []
    );

    interface EventDoc {
      $id: string;
      storeItemId?: string;
      name?: string;
      location?: string;
      dayOfWeek?: string;
      hour?: string;
    }
    const event = eventsResponse.documents.find((doc: EventDoc) => doc.$id === eventId);

    if (!event) {
      return NextResponse.json({ valid: false, message: 'Event not found' }, { status: 404 });
    }

    if (!event.storeItemId) {
      return NextResponse.json({ valid: false, message: 'Event does not require purchase' }, { status: 400 });
    }

    interface PurchasedItem {
      itemId?: string;
    }
    let purchasedItems: PurchasedItem[] = [];
    try {
      if (typeof member.purchasedItems === 'string') {
        purchasedItems = JSON.parse(member.purchasedItems) as PurchasedItem[];
      } else if (Array.isArray(member.purchasedItems)) {
        purchasedItems = member.purchasedItems as PurchasedItem[];
      }
    } catch {
      purchasedItems = [];
    }

    // Check if user has purchased this event's store item
    const hasPurchased = purchasedItems.some((item: PurchasedItem) => item.itemId === event.storeItemId);

    if (!hasPurchased) {
      return NextResponse.json({ 
        valid: false, 
        message: 'User has not purchased access to this event',
        user: { name: member.name },
        event: { name: event.name }
      }, { status: 401 });
    }

    return NextResponse.json({ 
      valid: true, 
      message: 'Valid ticket',
      user: { 
        name: member.name,
        email: member.email,
        slackName: member.slackName
      },
      event: { 
        name: event.name,
        location: event.location,
        dayOfWeek: event.dayOfWeek,
        hour: event.hour
      }
    });

  } catch (error) {
    console.error('Error verifying ticket:', error);
    return NextResponse.json({ valid: false, message: 'Server error' }, { status: 500 });
  }
}
