'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Event {
  id: string;
  name: string;
  location: string;
  description: string;
  dayOfWeek: string;
  hour: string;
  extras: string[];
  xpToBuy: string | null;
  maxAttendees: number | null;
  storeItemId: string | null;
}

export default function EventsAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  interface StoreItem {
    id: string;
    name: string;
    xpPrice: number;
  }
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    dayOfWeek: '',
    hour: '',
    extras: [] as string[],
    xpToBuy: '',
    maxAttendees: '',
    storeItemId: '',
  });

  const extraOptions = ['Main event', 'Store-unlockable', 'Limited attendees'];
  const dayOptions = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    const checkAuthAndFetch = async () => {
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

        const [eventsResponse, storeResponse] = await Promise.all([
          fetch('/api/admin/events'),
          fetch('/api/admin/store')
        ]);

        if (eventsResponse.ok) {
          const data = await eventsResponse.json();
          setEvents(data.events || []);
        }

        if (storeResponse.ok) {
          const data = await storeResponse.json();
          setStoreItems(data.items || []);
        }
      } catch (error) {
        console.error('Error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = {
        ...formData,
        xpToBuy: formData.xpToBuy ? parseInt(formData.xpToBuy) : null,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        ...(editingId && { id: editingId }),
      };

      const response = await fetch('/api/admin/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          location: '',
          description: '',
          dayOfWeek: '',
          hour: '',
          extras: [],
          xpToBuy: '',
          maxAttendees: '',
          storeItemId: '',
        });
        
        const eventsResponse = await fetch('/api/admin/events');
        if (eventsResponse.ok) {
          const data = await eventsResponse.json();
          setEvents(data.events || []);
        }
      } else {
        alert('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    }
  };

  const handleEdit = (event: Event) => {
    setFormData({
      name: event.name,
      location: event.location,
      description: event.description,
      dayOfWeek: event.dayOfWeek,
      hour: event.hour,
      extras: event.extras,
      xpToBuy: event.xpToBuy ? event.xpToBuy.toString() : '',
      maxAttendees: event.maxAttendees ? event.maxAttendees.toString() : '',
      storeItemId: event.storeItemId || '',
    });
    setEditingId(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const response = await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEvents(events.filter(e => e.id !== id));
      } else {
        alert('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      location: '',
      description: '',
      dayOfWeek: '',
      hour: '',
      extras: [],
      xpToBuy: '',
      maxAttendees: '',
      storeItemId: '',
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
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Manage Events</h1>
                <p className="text-zinc-400">Create, edit, or delete hackathon events</p>
              </div>
            </div>

            {/* Events List */}
            <div className="space-y-4 mb-8">
              {events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{event.name}</h3>
                        <p className="text-zinc-400 text-sm mb-3">{event.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-zinc-500">Location:</span>
                            <p className="text-white">{event.location}</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">Day & Time:</span>
                            <p className="text-white">{event.dayOfWeek} at {event.hour}</p>
                          </div>
                        </div>
                        {event.extras.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {event.extras.map((extra) => (
                              <span key={extra} className="px-2 py-1 bg-[#7d82b8]/20 text-[#7d82b8] text-xs rounded">
                                {extra}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-[#7d82b8]" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-400">No events yet</div>
              )}
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit Event' : 'Create Event'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-3">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-3">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50 min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-3">Day of Week</label>
                      <select
                        value={formData.dayOfWeek}
                        onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      >
                        <option value="">Select day...</option>
                        {dayOptions.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-3">Hour</label>
                      <input
                        type="text"
                        value={formData.hour}
                        onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                        placeholder="e.g., 10:00"
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Tags</label>
                    <div className="grid grid-cols-3 gap-3">
                      {extraOptions.map((extra) => (
                        <label key={extra} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.extras.includes(extra)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, extras: [...formData.extras, extra] });
                              } else {
                                setFormData({ ...formData, extras: formData.extras.filter(x => x !== extra) });
                              }
                            }}
                            className="w-4 h-4 rounded accent-[#7d82b8]"
                          />
                          <span className="text-white text-sm">{extra}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-3">XP to Buy (if unlockable)</label>
                      <input
                        type="number"
                        value={formData.xpToBuy}
                        onChange={(e) => setFormData({ ...formData, xpToBuy: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-3">Max Attendees (if limited)</label>
                      <input
                        type="number"
                        value={formData.maxAttendees}
                        onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Link to Store Item (optional)</label>
                    <select
                      value={formData.storeItemId}
                      onChange={(e) => setFormData({ ...formData, storeItemId: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                    >
                      <option value="">No store item linked</option>
                      {storeItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.xpPrice} XP)
                        </option>
                      ))}
                    </select>
                    <p className="text-zinc-400 text-sm mt-2">Selecting a store item means users must purchase it to unlock this event</p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#7d82b8] hover:bg-[#7d82b8]/80 text-white rounded-lg transition-colors font-semibold"
                    >
                      {editingId ? 'Update Event' : 'Create Event'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Button */}
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#7d82b8] hover:bg-[#7d82b8]/80 text-white rounded-lg transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
