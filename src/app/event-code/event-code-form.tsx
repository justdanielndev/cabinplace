'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Loader2, Phone, Calendar, Key } from 'lucide-react'

interface EventCodeFormProps {
  slackUserData: {
    id: string
    name: string
    real_name: string
    email: string
  }
}

export function EventCodeForm({ slackUserData }: EventCodeFormProps) {
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [birthday, setBirthday] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-event-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: code.toUpperCase(),
          phone: phone.trim(),
          birthday: birthday.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setError(data.error || 'Invalid event code')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,130,184,0.1)_1px,transparent_0)] bg-[length:50px_50px]"></div>
      
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#7d82b8]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-[#7d82b8]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Complete Registration</h1>
            <p className="text-zinc-400 text-sm">
              Welcome {slackUserData.real_name}! Please provide the following information to complete your registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Event code"
                className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#7d82b8] transition-colors"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="text-xs text-zinc-400/80 mt-2 text-center italic tracking-wide">This code should have been provided by the organizers!</p>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#7d82b8] transition-colors"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="Birthday"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#7d82b8] transition-colors"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim() || !phone.trim() || !birthday}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#7d82b8] text-white rounded-lg font-medium hover:bg-[#9ca0cc] disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5" />
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}