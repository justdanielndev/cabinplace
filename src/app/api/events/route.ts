import { NextResponse } from 'next/server';
import { databases, DB, APPWRITE_DATABASE_ID } from '@/lib/appwrite';

export async function GET() {
  try {
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
      
      const isMainEvent = extras.some((tag: string) => tag === 'Main event');
      const isStoreUnlockable = extras.some((tag: string) => tag === 'Store-unlockable');
      const hasLimitedAttendees = extras.some((tag: string) => tag === 'Limited attendees');
      
      return {
        id: doc.$id,
        name: doc.name || '',
        location: doc.location || '',
        description: doc.description || '',
        dayOfWeek: doc.dayOfWeek || '',
        hour: doc.hour || '',
        isMainEvent,
        isStoreUnlockable,
        hasLimitedAttendees,
        xpToBuy: isStoreUnlockable ? doc.xpToBuy : null,
        maxAttendees: hasLimitedAttendees ? doc.maxAttendees : null,
        storeItemId: doc.storeItemId || null,
        createdTime: doc.$createdAt,
        lastEditedTime: doc.$updatedAt,
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
