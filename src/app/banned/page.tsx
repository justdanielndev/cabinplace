import { Ban } from 'lucide-react'

export default async function BannedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const params = await searchParams
  const banReason = params.reason ? decodeURIComponent(params.reason) : 'You have been banned from this event.'
  
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,130,184,0.1)_1px,transparent_0)] bg-[length:50px_50px]"></div>
      
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <Ban className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-zinc-400">
              {banReason}
            </p>
            <p className="text-sm text-zinc-500 mt-4">
              If you believe this is a mistake, please contact the event organizers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}