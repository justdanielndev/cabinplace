import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

async function fetchHackatimeStats(slackId: string) {
  try {
    const response = await fetch(`https://hackatime.hackclub.com/api/v1/users/${slackId}/stats?features=projects`);
    if (!response.ok) {
      console.error(`Failed to fetch Hackatime stats for ${slackId}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching Hackatime stats for ${slackId}:`, error);
    return null;
  }
}

type HackatimeProject = {
  name: string;
  hours: number;
  lastUpdated: string;
};

async function calculateProjectHours(projectId: string, hackatimeProjects: HackatimeProject[]) {
  if (!hackatimeProjects || hackatimeProjects.length === 0) {
    return 0;
  }

  let totalHours = 0;

  for (const hackatimeProject of hackatimeProjects) {
    let projectName: string;
    let userId: string;
    if (typeof hackatimeProject === 'string') {
      projectName = hackatimeProject;
      const projectResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        DB.PROJECTS,
        [Query.equal('projectId', projectId)]
      );

      if (projectResponse.documents.length === 0) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projectRecord = projectResponse.documents[0] as any;
      const teamId = projectRecord.teamId;
      const teamsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        DB.TEAMS,
        [Query.equal('teamId', teamId)]
      );

      if (teamsResponse.documents.length === 0) {
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamRecord = teamsResponse.documents[0] as any;
      let members: any[] = [];
      try {
        members = Array.isArray(teamRecord.members) 
          ? teamRecord.members 
          : JSON.parse(teamRecord.members || '[]');
      } catch {
        members = [];
      }
      
      for (const member of members) {
        const stats = await fetchHackatimeStats(member.id);
        if (stats && stats.data && stats.data.projects) {
          const project = stats.data.projects.find((p: { name: string }) => p.name === projectName);
          if (project) {
            totalHours += project.total_seconds / 3600;
          }
        }
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projectName = (hackatimeProject as any).projectName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userId = (hackatimeProject as any).userId;
      
      const stats = await fetchHackatimeStats(userId);
      if (stats && stats.data && stats.data.projects) {
        const project = stats.data.projects.find((p: { name: string }) => p.name === projectName);
        if (project) {
          totalHours += project.total_seconds / 3600;
        }
      }
    }
  }

  return Math.round(totalHours * 100) / 100;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { projectName } = await request.json();
    
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

    let currentHackatimeProjects: unknown[] = [];
    try {
      currentHackatimeProjects = Array.isArray(projectRecord.hackatimeProjects) 
        ? projectRecord.hackatimeProjects 
        : JSON.parse(projectRecord.hackatimeProjects || '[]');
    } catch {
      currentHackatimeProjects = [];
    }

    const existingProject = currentHackatimeProjects.find((p: any) =>
      p.projectName === projectName.trim() && p.userId === slackUserId
    );

    if (existingProject) {
      return NextResponse.json({ error: 'This Hackatime project is already linked for you' }, { status: 400 });
    }

    const newProject = {
      projectName: projectName.trim(),
      userId: slackUserId,
      userName: userRecord.name || 'Unknown User',
      userSlackName: userRecord.slackName || 'Unknown User'
    };

    const updatedHackatimeProjects = [...currentHackatimeProjects, newProject];
    const updatedHours = await calculateProjectHours(id, updatedHackatimeProjects);
    const currentStatus = projectRecord.status || 'Created';

    const updateFields: Record<string, unknown> = {
      hackatimeProjects: JSON.stringify(updatedHackatimeProjects),
      hackatimeHours: updatedHours
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
      hackatimeProject: newProject,
      updatedHours: updatedHours
    });
  } catch (error) {
    console.error('Error adding Hackatime project:', error);
    return NextResponse.json({ error: 'Failed to add Hackatime project' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { projectName, userId } = await request.json();
    
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

    let currentHackatimeProjects: unknown[] = [];
    try {
      currentHackatimeProjects = Array.isArray(projectRecord.hackatimeProjects) 
        ? projectRecord.hackatimeProjects 
        : JSON.parse(projectRecord.hackatimeProjects || '[]');
    } catch {
      currentHackatimeProjects = [];
    }

    const updatedHackatimeProjects = currentHackatimeProjects.filter((p: { projectName: string; userId: string }) => {
      if (typeof p === 'string') {
        return p !== projectName.trim();
      }
      const targetUserId = userId || slackUserId;
      return !(p.projectName === projectName.trim() && p.userId === targetUserId);
    });

    const updatedHours = await calculateProjectHours(id, updatedHackatimeProjects);

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      projectRecord.$id,
      {
        hackatimeProjects: updatedHackatimeProjects,
        hackatimeHours: updatedHours
      }
    );

    return NextResponse.json({ 
      success: true, 
      updatedHours: updatedHours
    });
  } catch (error) {
    console.error('Error removing Hackatime project:', error);
    return NextResponse.json({ error: 'Failed to remove Hackatime project' }, { status: 500 });
  }
}
