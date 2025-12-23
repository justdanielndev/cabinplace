import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

async function findUserBySlackId(slackUserId: string) {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );
    
    if (response.documents.length > 0) {
      interface Member {
        $id: string;
        name?: string;
        email?: string;
        slackId?: string;
        slackName?: string;
        experiencePoints?: number;
        teamId?: string;
        banned?: boolean;
        banReason?: string;
        purchasedItems?: string | unknown[];
      }
      const member = response.documents[0] as Member;
      
      let purchasedItems: unknown[] = [];
      try {
        if (typeof member.purchasedItems === 'string') {
          purchasedItems = JSON.parse(member.purchasedItems);
        } else if (Array.isArray(member.purchasedItems)) {
          purchasedItems = member.purchasedItems;
        }
      } catch {
        purchasedItems = [];
      }
      
      return {
        id: member.$id,
        name: member.name || '',
        email: member.email || '',
        slackId: member.slackId || '',
        slackName: member.slackName || '',
        xp: member.experiencePoints || 0,
        teamId: member.teamId || '',
        banned: member.banned || false,
        banreason: member.banReason || '',
        purchasedItems: purchasedItems
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

async function getStoreItem(itemId: string) {
  try {
    const response = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      DB.STORE_ITEMS,
      itemId
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const item = response as any;
    
    return {
      id: item.$id,
      name: item.name || '',
      description: item.description || '',
      xpPrice: item.xpPrice || 0,
      stockStatus: item.stockStatus || '',
      category: item.category || '',
      limitPerPerson: item.limitPerPerson || 0,
    };
  } catch (error) {
    console.error('Error fetching store item:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { itemId } = await request.json();
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const user = await findUserBySlackId(slackUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const storeItem = await getStoreItem(itemId);
    if (!storeItem) {
      return NextResponse.json({ error: 'Store item not found' }, { status: 404 });
    }

    if (storeItem.stockStatus !== 'In stock') {
      return NextResponse.json({ error: 'Item is not in stock' }, { status: 400 });
    }

    if (user.xp < storeItem.xpPrice) {
      return NextResponse.json({ error: 'Insufficient XP' }, { status: 400 });
    }

    const purchasedItems = Array.isArray(user.purchasedItems) ? user.purchasedItems : [];

    if (storeItem.limitPerPerson > 0) {
      interface PurchasedItem {
        itemId?: string;
      }
      const itemPurchases = (purchasedItems as PurchasedItem[]).filter((item: PurchasedItem) => item.itemId === itemId);
      if (itemPurchases.length >= storeItem.limitPerPerson) {
        return NextResponse.json({ error: 'Purchase limit reached for this item' }, { status: 400 });
      }
    }

    const purchaseRecord = {
      itemId: itemId,
      itemName: storeItem.name,
      category: storeItem.category,
      xpPrice: storeItem.xpPrice,
      purchasedAt: new Date().toISOString(),
      used: false,
      usedAt: null
    };

    purchasedItems.push(purchaseRecord);
    const newXP = user.xp - storeItem.xpPrice;

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      user.id,
      {
        experiencePoints: newXP,
        purchasedItems: JSON.stringify(purchasedItems)
      }
    );

    return NextResponse.json({
      success: true,
      purchase: purchaseRecord,
      newXP: newXP,
      message: `Successfully purchased ${storeItem.name} for ${storeItem.xpPrice} XP!`
    });

  } catch (error) {
    console.error('Error processing purchase:', error);
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 });
  }
}
