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
      DB.STORE_ITEMS,
      []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = response.documents.map((doc: any) => {
      const quantity = doc.quantity !== undefined ? doc.quantity : -1;
      const stockStatus = quantity === 0 ? 'Out of stock' : 'In stock';
      
      return {
        id: doc.$id,
        name: doc.name || '',
        description: doc.description || '',
        xpPrice: doc.xpPrice || 0,
        quantity: quantity,
        category: doc.category || '',
        limitPerPerson: doc.limitPerPerson || null,
        relatedEvent: doc.relatedEvent || null,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching store items:', error);
    return NextResponse.json({ error: 'Failed to fetch store items' }, { status: 500 });
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

    const quantity = body.quantity;
    const stockStatus = quantity === 0 ? 'Out of stock' : 'In stock';

    const doc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      DB.STORE_ITEMS,
      ID.unique(),
      {
        name: body.name,
        description: body.description,
        xpPrice: body.xpPrice,
        quantity: quantity,
        stockStatus: stockStatus,
        category: body.category,
        limitPerPerson: body.limitPerPerson || null,
        relatedEvent: body.relatedEvent || null,
      }
    );

    return NextResponse.json({ item: doc });
  } catch (error) {
    console.error('Error creating store item:', error);
    return NextResponse.json({ error: 'Failed to create store item' }, { status: 500 });
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
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    if (updateData.quantity !== undefined) {
      updateData.stockStatus = updateData.quantity === 0 ? 'Out of stock' : 'In stock';
    }

    const doc = await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.STORE_ITEMS,
      id,
      updateData
    );

    return NextResponse.json({ item: doc });
  } catch (error) {
    console.error('Error updating store item:', error);
    return NextResponse.json({ error: 'Failed to update store item' }, { status: 500 });
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
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      DB.STORE_ITEMS,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting store item:', error);
    return NextResponse.json({ error: 'Failed to delete store item' }, { status: 500 });
  }
}
