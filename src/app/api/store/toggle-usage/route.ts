import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

async function findUserBySlackId(slackUserId: string) {
  try {
    const members = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );
    
    if (members.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const member = members.documents[0] as any;
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
        purchasedItems: member.purchasedItems || []
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
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

    const { purchaseIndex, markAsUsed } = await request.json();
    
    if (typeof purchaseIndex !== 'number' || typeof markAsUsed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const user = await findUserBySlackId(slackUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let purchasedItems = Array.isArray(user.purchasedItems) ? user.purchasedItems : [];

    if (purchaseIndex < 0 || purchaseIndex >= purchasedItems.length) {
      return NextResponse.json({ error: 'Invalid purchase index' }, { status: 400 });
    }

    purchasedItems[purchaseIndex] = {
      ...purchasedItems[purchaseIndex],
      used: markAsUsed,
      usedAt: markAsUsed ? new Date().toISOString() : null
    };

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      user.id,
      { purchasedItems: purchasedItems }
    );

    return NextResponse.json({
      success: true,
      message: `Item marked as ${markAsUsed ? 'used' : 'unused'}`,
      updatedItem: purchasedItems[purchaseIndex]
    });

  } catch (error) {
    console.error('Error toggling item usage:', error);
    return NextResponse.json({ error: 'Failed to update item usage' }, { status: 500 });
  }
}
