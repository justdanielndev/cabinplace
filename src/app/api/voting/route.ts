import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;

    if (!slackUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.PROJECTS,
      [Query.equal('status', 'Approved')]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projects = await Promise.all(projectsResponse.documents.map(async (doc: any) => {
      const teamId = doc.teamId || '';
      let teamName = 'Unknown Team';
      let teamMembers: string[] = [];
      
      if (teamId) {
        try {
          const teamResponse = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            DB.TEAMS,
            [Query.equal('teamId', teamId)]
          );
          
          if (teamResponse.documents.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const team = teamResponse.documents[0] as any;
            teamName = team.name || 'Unknown Team';
            
            let members: any[] = [];
            try {
              members = Array.isArray(team.members) 
                ? team.members 
                : JSON.parse(team.members || '[]');
            } catch {
              members = [];
            }
            teamMembers = members.map((member: any) => member.name || member.slackName || 'Unknown');
          }
        } catch (error) {
          console.error('Error fetching team data:', error);
        }
      }
      
      const devlogs = Array.isArray(doc.devlogs) ? doc.devlogs : [];
      
      return {
        id: doc.projectId || '',
        name: doc.name || '',
        description: doc.description || '',
        gitRepo: doc.gitRepo || '',
        devlogs,
        hackatimeHours: doc.hackatimeHours || 0,
        teamId,
        teamName,
        teamMembers
      };
    }));

    if (projects.length < 2) {
      return NextResponse.json({ error: 'Not enough projects available for voting' }, { status: 400 });
    }

    const shuffled = [...projects].sort(() => 0.5 - Math.random());
    const selectedProjects = shuffled.slice(0, 2);

    return NextResponse.json({ projects: selectedProjects });
  } catch (error) {
    console.error('Error fetching projects for voting:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;

    if (!slackUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectsShown, projectChosen, reason } = body;

    if (!projectsShown || !projectChosen || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      DB.VOTING,
      ID.unique(),
      {
        name: `vote-${uuidv4()}`,
        projectId: projectChosen,
        projectChosen: projectChosen,
        voterSlackId: slackUserId,
        projectsShown: projectsShown,
        voteReason: reason,
        votedAt: new Date().toISOString()
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
  }
}
