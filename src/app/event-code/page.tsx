import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { EventCodeForm } from './event-code-form'
import { databases, DB, APPWRITE_DATABASE_ID, Query } from '@/lib/appwrite'

async function getUserBySlackId(slackId: string) {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [Query.equal('slackId', slackId)]
    )

    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const member = response.documents[0] as any
      return {
        id: slackId,
        name: member.name || '',
        real_name: member.name || '',
        email: member.email || '',
        pending: member.pending === true ? 'true' : 'false'
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export default async function EventCodePage() {
  const cookieStore = await cookies()
  const slackUserId = cookieStore.get('slack_user_id')?.value
  
  if (!slackUserId) {
    redirect('/')
  }
  
  const userData = await getUserBySlackId(slackUserId)
  
  if (!userData) {
    redirect('/')
  }

  if (userData.pending !== 'true') {
    redirect('/dashboard')
  }
  
  return <EventCodeForm slackUserData={userData} />
}
