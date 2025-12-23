import { NextResponse } from 'next/server';
import { databases, DB, APPWRITE_DATABASE_ID } from '@/lib/appwrite';

export async function GET() {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.STORE_ITEMS,
      []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storeItems = await Promise.all(response.documents.map(async (doc: any) => {
      let relatedEvent = null;
      
      if (doc.eventId) {
        try {
          const eventDoc = await databases.getDocument(
            APPWRITE_DATABASE_ID,
            DB.EVENTS,
            doc.eventId
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const event = eventDoc as any;
          relatedEvent = {
            id: event.$id,
            name: event.name || '',
            dayOfWeek: event.dayOfWeek || '',
            hour: event.hour || '',
          };
        } catch (error) {
          console.error(`Error fetching related event for item ${doc.name}:`, error);
          relatedEvent = null;
        }
      }

      return {
        id: doc.$id,
        name: doc.name || '',
        description: doc.description || '',
        xpPrice: doc.xpPrice || 0,
        stockStatus: doc.stockStatus || 'No stock',
        category: doc.category || 'Other',
        limitPerPerson: doc.limitPerPerson || 1,
        relatedEvent: relatedEvent,
        createdTime: doc.$createdAt,
        lastEditedTime: doc.$updatedAt,
      };
    }));

    return NextResponse.json({ storeItems });
  } catch (error) {
    console.error('Error fetching store items:', error);
    return NextResponse.json({ error: 'Failed to fetch store items' }, { status: 500 });
  }
}
