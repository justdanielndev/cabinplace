import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { content, imageUrl } = await request.json();
    
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const membersResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );

    if (membersResponse.documents.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRecord = membersResponse.documents[0] as any;
    const userTeamId = userRecord.teamId;
    const userName = userRecord.name || 'Unknown User';

    const projectResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      [Query.equal('projectId', id)]
    );

    if (projectResponse.documents.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectRecord = projectResponse.documents[0] as any;
    
    const projectTeamId = projectRecord.teamId;
    if (userTeamId !== projectTeamId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let currentDevlogs: unknown[] = [];
    try {
      currentDevlogs = Array.isArray(projectRecord.devlogs) 
        ? projectRecord.devlogs 
        : JSON.parse(projectRecord.devlogs || '[]');
    } catch {
      currentDevlogs = [];
    }

    const newDevlog = {
      id: uuidv4(),
      content: content.trim(),
      imageUrl: imageUrl?.trim() || undefined,
      timestamp: new Date().toISOString(),
      author: userName
    };

    const updatedDevlogs = [...currentDevlogs, newDevlog];
    const currentStatus = projectRecord.status || 'Created';

    const updateFields: Record<string, unknown> = {
      devlogs: JSON.stringify(updatedDevlogs)
    };
    
    if (currentStatus === 'Created') {
      updateFields.status = 'In development';
    }

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      projectRecord.$id,
      updateFields
    );

    return NextResponse.json({ 
      success: true, 
      devlog: newDevlog
    });
  } catch (error) {
    console.error('Error adding devlog:', error);
    return NextResponse.json({ error: 'Failed to add devlog' }, { status: 500 });
  }
}