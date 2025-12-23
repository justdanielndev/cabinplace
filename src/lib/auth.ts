import { redirect } from 'next/navigation'
import { databases, DB, APPWRITE_DATABASE_ID, Query } from './appwrite'

export async function checkUserPendingStatus(slackUserId: string) {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      DB.MEMBERS,
      [
        Query.equal('slackId', slackUserId)
      ]
    )

    if (response.documents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = response.documents[0] as any
      const isPending = user.pending === true
      
      if (isPending) {
        redirect('/event-code')
      }
    }
  } catch (error) {
    console.error('Error checking pending status:', error)
  }
}