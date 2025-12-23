import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await findUserBySlackId(slackUserId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const payload = {
      user_id: user.slackId,
      email: user.email,
      name: user.name,
      created_at: Math.floor(Date.now() / 1000),
    };

    const intercomSecret = process.env.INTERCOM_SECRET_KEY;
    if (!intercomSecret) {
      return NextResponse.json({ error: 'Intercom secret not configured' }, { status: 500 });
    }

    const token = jwt.sign(payload, intercomSecret, { expiresIn: '1h' });

    return NextResponse.json({
      token,
      user: {
        xp: user.xp,
        teamId: user.teamId,
      }
    });

  } catch (error) {
    console.error('Error generating Intercom token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
