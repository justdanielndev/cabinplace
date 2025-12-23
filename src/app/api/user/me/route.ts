import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

async function findUserBySlackId(slackUserId: string) {
  try {
    const members = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackUserId)]
    );
    
    if (members.documents.length > 0) {
      interface Member {
        $id: string;
        name?: string;
        email?: string;
        slackId?: string;
        slackName?: string;
        experiencePoints?: number;
        teamId?: string;
        banned?: boolean;
        banReason?: string;
        inviteId?: string;
        purchasedItems?: string | unknown[];
      }
      const member = members.documents[0] as Member;
      const teamId = member.teamId || '';
      const teamName = await getTeamNameById(teamId);
      
      interface PurchasedItem {
        [key: string]: unknown;
      }
      let purchasedItems: PurchasedItem[] = [];
      try {
        if (typeof member.purchasedItems === 'string') {
          purchasedItems = JSON.parse(member.purchasedItems);
        } else if (Array.isArray(member.purchasedItems)) {
          purchasedItems = member.purchasedItems as PurchasedItem[];
        }
      } catch {
        purchasedItems = [];
      }
      
      return {
        id: member.$id,
        name: member.name || '',
        email: member.email || '',
        slackId: member.slackId || '',
        slackName: member.slackName || '',
        xp: member.experiencePoints || 0,
        teamId: teamId,
        teamName: teamName,
        banned: member.banned || false,
        banreason: member.banReason || '',
        inviteId: member.inviteId || '',
        purchasedItems: purchasedItems
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const slackUserId = cookieStore.get('slack_user_id')?.value;
    
    if (!slackUserId) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const user = await findUserBySlackId(slackUserId);
    
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const purchasedItems = user.purchasedItems;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.slackId,
        name: user.name,
        email: user.email,
        xp: user.xp,
        teamId: user.teamId,
        teamName: user.teamName,
        inviteId: user.inviteId,
        purchasedItems: purchasedItems,
      }
    });

  } catch (error) {
    console.error('Error getting user data:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
