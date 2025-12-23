import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';

export async function POST(request: Request) {
  try {
    const { projectName, description } = await request.json();
    
    if (!projectName?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
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

    if (!userTeamId) {
      return NextResponse.json({ error: 'User must be on a team to create projects' }, { status: 400 });
    }

    const existingProjects = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      [Query.equal('teamId', userTeamId)]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (existingProjects.documents.some((p: any) => p.name === projectName.trim())) {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 400 });
    }

    const projectId = uuidv4();
    
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      ID.unique(),
      {
        projectId: projectId,
        name: projectName.trim(),
        description: description?.trim() || 'No description provided',
        teamId: userTeamId,
        status: 'Created',
        dateSubmitted: new Date().toISOString().split('T')[0],
        hackatimeHours: 0
      }
    );

    const teamsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      [Query.equal('teamId', userTeamId)]
    );

    if (teamsResponse.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamRecord = teamsResponse.documents[0] as any;
      let currentProjects: string[] = [];
      try {
        currentProjects = Array.isArray(teamRecord.projects) 
          ? teamRecord.projects 
          : JSON.parse(teamRecord.projects || '[]');
      } catch {
        currentProjects = [];
      }
      const updatedProjects = [...currentProjects, projectName.trim()];
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        DB.TEAMS,
        teamRecord.$id,
        { projects: JSON.stringify(updatedProjects) }
      );
    }

    return NextResponse.json({ 
      success: true, 
      project: {
        id: projectId,
        name: projectName.trim(),
        description: description?.trim() || 'No description provided',
        status: 'Created',
        teamId: userTeamId
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
