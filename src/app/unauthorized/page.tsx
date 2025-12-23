import { Ban } from 'lucide-react'
import Link from 'next/link'

export default async function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,130,184,0.1)_1px,transparent_0)] bg-[length:50px_50px]"></div>
      
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <Ban className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Registrations Closed</h1>
            <p className="text-zinc-400">
              Sign-ups for this event are currently closed. Please contact the event organizers if you believe you should have access.
            </p>
            <div className="pt-4 w-full">
              <Link 
                href="/api/auth/logout"
                className="block w-full text-center px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
            <p className="text-xs text-zinc-500 pt-2">
              Already registered? Try logging in again.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}