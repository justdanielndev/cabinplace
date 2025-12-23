import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;

    if (!slackUserId) {
      return NextResponse.json({ banned: false });
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );

    if (response.documents.length > 0) {
      interface User {
        banned?: boolean;
        banReason?: string;
      }
      const user = response.documents[0] as User;
      const isBanned = user.banned || false;
      const banReason = user.banReason 
        ? `You have been banned from this event for ${user.banReason}`
        : 'You have been banned from this event.';

      return NextResponse.json({ 
        banned: isBanned, 
        reason: banReason 
      });
    }

    return NextResponse.json({ banned: false });
  } catch (error) {
    console.error('Error checking ban status:', error);
    return NextResponse.json({ banned: false });
  }
}
