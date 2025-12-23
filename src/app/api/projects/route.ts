import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID } from '@/lib/appwrite';

async function getTeamName(teamId: string) {
  if (!teamId) return 'Unknown Team';
  
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      []
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = response.documents.find((t: any) => t.teamId === teamId);
    return team?.name || 'Unknown Team';
  } catch (error) {
    console.error('Error fetching team name:', error);
    return 'Unknown Team';
  }
}

async function getTeamMembers(teamId: string) {
  if (!teamId) return [];
  
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      []
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = response.documents.find((t: any) => t.teamId === teamId);
    if (!team) return [];
    try {
      return Array.isArray(team.members) 
        ? team.members 
        : JSON.parse(team.members || '[]');
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const projectsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      []
    );

    const allProjects = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const project of projectsResponse.documents as any[]) {
      const teamName = await getTeamName(project.teamId);
      const members = await getTeamMembers(project.teamId);

      allProjects.push({
        id: project.projectId || '',
        name: project.name || '',
        description: project.description || 'No description provided',
        status: project.status || 'Created',
        teamId: project.teamId || '',
        teamName: teamName,
        members: members.map((m: { name?: string; slackName?: string }) => m.name || m.slackName),
        createdAt: project.$createdAt,
        updatedAt: project.$updatedAt
      });
    }

    return NextResponse.json({ projects: allProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
