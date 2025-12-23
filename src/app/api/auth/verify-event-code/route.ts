import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, phone, birthday } = body;

    if (!code || !phone || !birthday) {
      return NextResponse.json({ error: 'Event code, phone number, and birthday are required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;

    if (!slackUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const settingsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', 'signUpsEnabled')]
    );

    if (settingsResponse.documents.length === 0) {
      return NextResponse.json({ error: 'Sign ups are not configured' }, { status: 403 });
    }

    interface Setting {
      value?: string;
    }
    const signUpsEnabled = (settingsResponse.documents[0] as Setting).value?.toLowerCase() === 'true';
    
    if (!signUpsEnabled) {
      return NextResponse.json({ error: 'Sign ups are currently closed. Please contact the event organizers.' }, { status: 403 });
    }

    const eventCodeResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', 'eventCode')]
    );

    if (eventCodeResponse.documents.length === 0) {
      return NextResponse.json({ error: 'Event code not configured' }, { status: 403 });
    }

    const storedEventCode = (eventCodeResponse.documents[0] as Setting).value || '';
    
    if (code.toUpperCase() !== storedEventCode.toUpperCase()) {
      return NextResponse.json({ error: 'Invalid event code' }, { status: 401 });
    }

    const minAgeResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', 'minAge')]
    );

    const maxAgeResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      [Query.equal('key', 'maxAge')]
    );

    const minAgeValue = minAgeResponse.documents.length > 0 
      ? (minAgeResponse.documents[0] as Setting).value || '0'
      : '0';
    
    const maxAgeValue = maxAgeResponse.documents.length > 0 
      ? (maxAgeResponse.documents[0] as Setting).value || '200'
      : '200';

    const minAge = parseInt(minAgeValue, 10);
    const maxAge = parseInt(maxAgeValue, 10);

    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < minAge) {
      return NextResponse.json({ error: `You must be at least ${minAge} years old to register` }, { status: 403 });
    }

    if (age > maxAge) {
      return NextResponse.json({ error: `You must be ${maxAge} years old or younger to register` }, { status: 403 });
    }

    const userResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );

    if (userResponse.documents.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    interface UserRecord {
      $id: string;
    }
    const userId = (userResponse.documents[0] as UserRecord).$id;

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      userId,
      {
        pending: false,
        phoneNumber: phone,
        birthday: birthday
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event code verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
