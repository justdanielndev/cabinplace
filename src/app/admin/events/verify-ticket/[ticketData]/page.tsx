'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Clock, Mail, User, Check, X, AlertTriangle } from 'lucide-react';

interface TicketInfo {
  valid: boolean;
  message: string;
  user?: {
    name: string;
    email: string;
    slackName: string;
  };
  event?: {
    name: string;
    location: string;
    dayOfWeek: string;
    hour: string;
  };
}

export default function VerifyTicketPage() {
  const params = useParams();
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const verifyTicket = async () => {
      try {
        const response = await fetch('/api/admin/events/verify-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketData: params.ticketData })
        });

        const data = await response.json();
        setTicketInfo(data);
      } catch (err) {
        console.error('Error verifying ticket:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.ticketData) {
      verifyTicket();
    }
  }, [params.ticketData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error || !ticketInfo) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <div className="text-white text-xl mb-2">Error</div>
          <div className="text-zinc-400">Unable to verify this ticket.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        {ticketInfo.valid ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-green-400 mb-2">Valid Ticket</h1>
            <p className="text-center text-zinc-300 mb-8">{ticketInfo.message}</p>

            {ticketInfo.user && ticketInfo.event && (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 rounded-xl p-6 space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Attendee</h2>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-zinc-400 text-sm">Name</p>
                          <p className="text-white font-medium">{ticketInfo.user.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-zinc-400 text-sm">Email</p>
                          <p className="text-white font-medium">{ticketInfo.user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <h2 className="text-lg font-semibold text-white mb-4">Event</h2>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-sm">Event</p>
                          <p className="text-white font-medium">{ticketInfo.event.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-zinc-400 text-sm">Location</p>
                          <p className="text-white font-medium">{ticketInfo.event.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-zinc-400 text-sm">Date</p>
                          <p className="text-white font-medium">{ticketInfo.event.dayOfWeek}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-zinc-400 text-sm">Time</p>
                          <p className="text-white font-medium">{ticketInfo.event.hour}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-red-400 mb-2">Invalid Ticket</h1>
            <p className="text-center text-zinc-300 mb-6">{ticketInfo.message}</p>

            {ticketInfo.user && (
              <div className="bg-zinc-900/50 rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-zinc-400 text-sm">Attendee</p>
                    <p className="text-white font-medium">{ticketInfo.user.name}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
