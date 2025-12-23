import { NextResponse } from 'next/server';
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite';

async function getMemberXP(slackId: string): Promise<number> {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [
        Query.equal('slackId', slackId)
      ]
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
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.TEAMS,
      []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams = await Promise.all(response.documents.map(async (doc: any) => {
      let members: unknown[] = [];
      let projects: string[] = [];
      let joinRequests: unknown[] = [];

      try {
        members = Array.isArray(doc.members) 
          ? doc.members 
          : JSON.parse(doc.members || '[]');
      } catch {
        members = [];
      }

      try {
        projects = Array.isArray(doc.projects) 
          ? doc.projects 
          : JSON.parse(doc.projects || '[]');
      } catch {
        projects = [];
      }

      try {
        joinRequests = Array.isArray(doc.joinRequests) 
          ? doc.joinRequests 
          : JSON.parse(doc.joinRequests || '[]');
      } catch {
        joinRequests = [];
      }

      const membersWithXP = await Promise.all(members.map(async (member: any) => ({
        ...member,
        name: member.name || member.slackName || '',
        xp: await getMemberXP(member.id)
      })));
      
      return {
        id: doc.$id,
        teamId: doc.teamId || '',
        name: doc.name || '',
        teamSize: doc.teamSize || 0,
        members: membersWithXP,
        projects: projects,
        joinRequests: joinRequests,
        type: doc.type || 'Public',
        createdTime: doc.$createdAt,
        lastEditedTime: doc.$updatedAt,
      };
    }));

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}