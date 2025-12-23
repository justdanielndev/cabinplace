import { NextResponse } from 'next/server';
import { databases, DB, APPWRITE_DATABASE_ID } from '@/lib/appwrite';

export async function GET() {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.GLOBAL_SETTINGS,
      []
    );

    const settings: Record<string, string | boolean> = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.documents.forEach((doc: any) => {
      const key = doc.key;
      const value = doc.value;
      
      if (key) {
        if (value === 'true' || value === 'false') {
          settings[key] = value === 'true';
        } else {
          settings[key] = value;
        }
      }
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching global settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
