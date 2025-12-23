'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

function isoToDatetimeLocal(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function datetimeLocalToIso(datetimeLocal: string): string {
  if (!datetimeLocal) return '';
  const date = new Date(datetimeLocal + ':00Z');
  return date.toISOString();
}

interface HackathonSettings {
  startDateAndTime: string;
  endDateAndTime: string;
  eventCode: string;
  signUpsEnabled: boolean;
  minAge: number;
  maxAge: number;
  votingEnabled: boolean;
  projectsEnabled: boolean;
  teamEnabled: boolean;
  eventsEnabled: boolean;
  newsEnabled: boolean;
  leaderboardEnabled: boolean;
  storeEnabled: boolean;
  friday: string;
  saturday: string;
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  dateOrder: string[];
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HackathonSettings>({
    startDateAndTime: '',
    endDateAndTime: '',
    eventCode: '',
    signUpsEnabled: false,
    minAge: 13,
    maxAge: 100,
    votingEnabled: false,
    projectsEnabled: false,
    teamEnabled: false,
    eventsEnabled: false,
    newsEnabled: false,
    leaderboardEnabled: false,
    storeEnabled: false,
    friday: '',
    saturday: '',
    sunday: '',
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    dateOrder: []
  });
  useEffect(() => {
    const checkAuthAndFetchSettings = async () => {
      try {
        const authResponse = await fetch('/api/admin/check-auth');
        if (!authResponse.ok) {
          router.push('/');
          return;
        }
        const authData = await authResponse.json();
        if (!authData.isAdmin) {
          router.push('/');
          return;
        }
        setIsAdmin(true);

        const settingsResponse = await fetch('/api/admin/settings');
        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          setSettings({
            ...data.settings,
            startDateAndTime: isoToDatetimeLocal(data.settings.startDateAndTime),
            endDateAndTime: isoToDatetimeLocal(data.settings.endDateAndTime)
          });
        }
      } catch (error) {
        console.error('Error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchSettings();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          startDateAndTime: datetimeLocalToIso(settings.startDateAndTime),
          endDateAndTime: datetimeLocalToIso(settings.endDateAndTime)
        })
      });

      if (response.ok) {
        alert('Settings saved successfully');
      } else {
        alert('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const handleDateRangeChange = (newStartDateTime: string, newEndDateTime: string) => {
    if (!newStartDateTime || !newEndDateTime) {
      setSettings({
        ...settings,
        startDateAndTime: newStartDateTime,
        endDateAndTime: newEndDateTime
      });
      return;
    }

    const [startDatePart] = newStartDateTime.split('T');
    const [endDatePart] = newEndDateTime.split('T');
    
    const startDate = new Date(startDatePart + 'T00:00:00');
    const endDate = new Date(endDatePart + 'T23:59:59');

    const dayToDateMap: Record<string, string> = {};
    const foundDays: string[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayIndex = currentDate.getDay();
      const dayName = dayNames[dayIndex];
      const dateString = currentDate.getFullYear() + '-' + 
                        String(currentDate.getMonth() + 1).padStart(2, '0') + '-' +
                        String(currentDate.getDate()).padStart(2, '0');

      if (!dayToDateMap[dayName]) {
        dayToDateMap[dayName] = dateString;
        foundDays.push(dayName);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setSettings({
      ...settings,
      startDateAndTime: newStartDateTime,
      endDateAndTime: newEndDateTime,
      sunday: dayToDateMap['sunday'] || settings.sunday,
      monday: dayToDateMap['monday'] || settings.monday,
      tuesday: dayToDateMap['tuesday'] || settings.tuesday,
      wednesday: dayToDateMap['wednesday'] || settings.wednesday,
      thursday: dayToDateMap['thursday'] || settings.thursday,
      friday: dayToDateMap['friday'] || settings.friday,
      saturday: dayToDateMap['saturday'] || settings.saturday,
      dateOrder: foundDays
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,130,184,0.1)_1px,transparent_0)] bg-[length:50px_50px]"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,130,184,0.1)_1px,transparent_0)] bg-[length:50px_50px]"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">Access Denied</div>
            <div className="text-zinc-400">You are not authorized to view this page.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(125,130,184,0.1)_1px,transparent_0)] bg-[length:50px_50px]"></div>

      <div className="relative z-10">
        <TopNav currentPage="admin" />

        <div className="container mx-auto px-6 -mt-16">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                <p className="text-zinc-400">Manage hackathon configuration</p>
              </div>
            </div>

            {/* Settings Form */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-8 space-y-8">
              {/* Event Code */}
              <div>
                <label className="block text-white font-semibold mb-3">Event Code</label>
                <input
                  type="text"
                  value={settings.eventCode}
                  onChange={(e) =>
                    setSettings({ ...settings, eventCode: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-[#7d82b8]/50"
                  placeholder="e.g., HACKATHON2024"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-3">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={settings.startDateAndTime}
                    onChange={(e) =>
                      handleDateRangeChange(e.target.value, settings.endDateAndTime)
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-3">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={settings.endDateAndTime}
                    onChange={(e) =>
                      handleDateRangeChange(settings.startDateAndTime, e.target.value)
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                  />
                </div>
              </div>

              {/* Age Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-3">Minimum Age</label>
                  <input
                    type="number"
                    value={settings.minAge}
                    onChange={(e) =>
                      setSettings({ ...settings, minAge: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                  />
                </div>
                <div>
                  <label className="block text-white font-semibold mb-3">Maximum Age</label>
                  <input
                    type="number"
                    value={settings.maxAge}
                    onChange={(e) =>
                      setSettings({ ...settings, maxAge: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div>
                <h3 className="text-white font-semibold mb-4">Feature Toggles</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'signUpsEnabled', label: 'Sign-ups Enabled' },
                    { key: 'votingEnabled', label: 'Voting Enabled' },
                    { key: 'projectsEnabled', label: 'Projects Enabled' },
                    { key: 'teamEnabled', label: 'Teams Enabled' },
                    { key: 'eventsEnabled', label: 'Events Enabled' },
                    { key: 'newsEnabled', label: 'News Enabled' },
                    { key: 'leaderboardEnabled', label: 'Leaderboard Enabled' },
                    { key: 'storeEnabled', label: 'Store Enabled' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[key as keyof HackathonSettings] as boolean}
                        onChange={(e) =>
                          setSettings({ ...settings, [key]: e.target.checked })
                        }
                        className="w-5 h-5 rounded accent-[#7d82b8]"
                      />
                      <span className="text-white font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Event Days */}
              <div>
                <label className="block text-white font-semibold mb-4">Event Days</label>
                <p className="text-zinc-400 text-sm mb-4">The following days fall within your event date range:</p>
                <div className="grid grid-cols-2 gap-3">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className={`p-3 rounded-lg font-medium transition-all ${
                        settings.dateOrder.includes(day)
                          ? 'bg-[#7d82b8]/20 border border-[#7d82b8] text-white'
                          : 'bg-zinc-800/30 border border-zinc-700/30 text-zinc-500'
                      }`}
                    >
                      <div className="font-semibold">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                      <div className="text-xs text-zinc-400 mt-1">
                        {settings[day as keyof HackathonSettings] || '—'}
                      </div>
                    </div>
                  ))}
                </div>
                {settings.dateOrder.length > 0 && (
                  <div className="mt-4 p-4 bg-zinc-800/20 rounded-lg border border-zinc-700/30">
                    <p className="text-zinc-400 text-sm mb-2">Event spans {settings.dateOrder.length} day(s):</p>
                    <p className="text-white font-mono text-sm">{settings.dateOrder.join(', ')}</p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#7d82b8] hover:bg-[#7d82b8]/80 disabled:opacity-50 text-white rounded-lg transition-colors font-semibold"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
