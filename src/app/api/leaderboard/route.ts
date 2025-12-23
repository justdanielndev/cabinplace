import { NextResponse } from 'next/server';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

async function getTeamNameById(teamId: string) {
  if (!teamId) return 'No Team Assigned';
  
  try {
    const teams = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      [Query.equal('teamId', teamId)]
    );
    
    if (teams.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const team = teams.documents[0] as any;
      return team.name || 'No Team Assigned';
    }
    
    return 'No Team Assigned';
  } catch (error) {
    console.error('Error fetching team name:', error);
    return 'No Team Assigned';
  }
}

async function getMemberXP(slackId: string): Promise<number> {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackId)]
    );
    
    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const member = response.documents[0] as any;
      return member.experiencePoints || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching member XP:', error);
    return 0;
  }
}

export async function GET() {
  try {
    const membersResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      []
    );
    
    interface MemberDoc {
      slackId?: string;
      name?: string;
      slackName?: string;
      experiencePoints?: number;
      teamId?: string;
      banned?: boolean;
    }
    const usersWithTeams = await Promise.all(
      membersResponse.documents.map(async (member) => {
        const memberData = member as MemberDoc;
        const teamId = memberData.teamId || '';
        const teamName = await getTeamNameById(teamId);
        
        return {
          id: memberData.slackId || '',
          name: memberData.name || '',
          slackName: memberData.slackName || '',
          xp: memberData.experiencePoints || 0,
          teamId: teamId,
          teamName: teamName,
          banned: memberData.banned || false
        };
      })
    );

    const activeUsers = usersWithTeams
      .filter(user => !user.banned && user.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    const teamsResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      []
    );

    interface TeamDoc {
      name?: string;
      members?: unknown;
    }
    const teamsArray = await Promise.all(
      teamsResponse.documents.map(async (doc) => {
        const docData = doc as TeamDoc;
        interface TeamMember {
          id: string;
        }
        const members: TeamMember[] = [];
        try {
          const temp = Array.isArray(docData.members) ? docData.members : JSON.parse((docData.members as string) || '[]');
          members.push(...(temp as TeamMember[]));
        } catch {
          // members already initialized as empty array
        }
        
        const membersWithXP = await Promise.all(members.map(async (member: TeamMember) => ({
          ...member,
          xp: await getMemberXP(member.id)
        })));

        const totalXP = membersWithXP.reduce((sum, member) => sum + member.xp, 0);
        const memberCount = membersWithXP.length;

        return {
          teamName: docData.name || '',
          totalXP: totalXP,
          memberCount: memberCount,
          averageXP: memberCount > 0 ? Math.round(totalXP / memberCount) : 0
        };
      })
    );

    const sortedTeams = teamsArray
      .filter(team => team.teamName && team.memberCount > 0)
      .sort((a, b) => b.totalXP - a.totalXP)
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }));

    return NextResponse.json({
      users: activeUsers.slice(0, 100),
      teams: sortedTeams
    });

  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard data' }, { status: 500 });
  }
}
