import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

async function getTeamName(teamId: string) {
  if (!teamId) return 'Unknown Team';
  
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      [Query.equal('teamId', teamId)]
    );
    
    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (response.documents[0] as any).name || 'Unknown Team';
    }
    
    return 'Unknown Team';
  } catch (error) {
    console.error('Error fetching team name:', error);
    return 'Unknown Team';
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
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

    const teamName = await getTeamName(projectTeamId);
    let devlogs: unknown[] = [];
    try {
      devlogs = Array.isArray(projectRecord.devlogs) 
        ? projectRecord.devlogs 
        : JSON.parse(projectRecord.devlogs || '[]');
    } catch {
      devlogs = [];
    }
    let hackatimeProjects: unknown[] = [];
    try {
      hackatimeProjects = Array.isArray(projectRecord.hackatimeProjects) 
        ? projectRecord.hackatimeProjects 
        : JSON.parse(projectRecord.hackatimeProjects || '[]');
    } catch {
      hackatimeProjects = [];
    }

    const project = {
      id: projectRecord.projectId || '',
      name: projectRecord.name || '',
      description: projectRecord.description || '',
      status: projectRecord.status || 'Created',
      teamId: projectTeamId,
      teamName: teamName,
      gitRepo: projectRecord.gitRepo || '',
      dateSubmitted: projectRecord.dateSubmitted || '',
      hackatimeHours: projectRecord.hackatimeHours || 0,
      rejectionReason: projectRecord.rejectionReason || '',
      devlogs: devlogs,
      hackatimeProjects: hackatimeProjects
    };

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { description, gitRepo } = await request.json();
    
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

    const updateFields: Record<string, unknown> = {};
    
    if (description !== undefined) {
      updateFields.description = description.trim();
    }
    
    if (gitRepo !== undefined) {
      updateFields.gitRepo = gitRepo.trim() || '';
    }

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      projectRecord.$id,
      updateFields
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}