import { NextResponse } from 'next/server';
import { databases, DB, APPWRITE_DATABASE_ID } from '@/lib/appwrite';

export async function GET() {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.NEWS,
      []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const news = response.documents.map((doc: any) => {
      return {
        id: doc.$id,
        name: doc.name || '',
        description: doc.description || '',
        mdContent: doc.mdContent || '',
        author: doc.author || '',
        publicationDate: doc.publicationDate || null,
        createdTime: doc.$createdAt,
        lastEditedTime: doc.$updatedAt,
      };
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
