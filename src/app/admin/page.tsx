'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { Search, Users, Settings, LogOut, Calendar, Newspaper, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth');
        if (!response.ok) {
          router.push('/');
          return;
        }
        const data = await response.json();
        if (!data.isAdmin) {
          router.push('/');
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    setSearching(true);
    try {
      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-zinc-400">Manage hackathon users and settings</p>
            </div>

            {/* Search Section */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6 mb-8">
              <form onSubmit={handleSearch}>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or Slack ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-[#7d82b8]/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-6 py-3 bg-[#7d82b8] hover:bg-[#7d82b8]/80 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-white font-semibold mb-4">Results ({searchResults.length})</h3>
                  {searchResults.map((user) => (
                    <Link
                      key={user.inviteId}
                      href={`/admin/user/getuserinfo/${user.inviteId}`}
                      className="block p-4 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg border border-zinc-700/30 hover:border-zinc-600/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-zinc-400 text-sm">{user.email}</p>
                          <p className="text-zinc-500 text-sm mt-1">
                            <span className="text-zinc-400">Slack:</span> {user.slackName}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-[#7d82b8] font-semibold">{user.xp} XP</div>
                          {user.banned && <div className="text-red-400 text-sm">Banned</div>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {hasSearched && searchResults.length === 0 && !searching && (
                <div className="mt-6 text-center text-zinc-400">
                  No users found matching your search.
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Link
                href="/admin/settings"
                className="bg-zinc-900/50 hover:bg-zinc-900/70 backdrop-blur-sm rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 p-6 transition-all"
              >
                <Settings className="w-8 h-8 text-[#7d82b8] mb-3" />
                <h3 className="text-white font-semibold mb-2">Settings</h3>
                <p className="text-zinc-400 text-sm">Manage hackathon settings and configuration</p>
              </Link>

              <Link
                href="/admin/users"
                className="bg-zinc-900/50 hover:bg-zinc-900/70 backdrop-blur-sm rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 p-6 transition-all"
              >
                <Users className="w-8 h-8 text-[#7d82b8] mb-3" />
                <h3 className="text-white font-semibold mb-2">Users</h3>
                <p className="text-zinc-400 text-sm">View and manage all users</p>
              </Link>

              <Link
                href="/admin/events"
                className="bg-zinc-900/50 hover:bg-zinc-900/70 backdrop-blur-sm rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 p-6 transition-all"
              >
                <Calendar className="w-8 h-8 text-[#7d82b8] mb-3" />
                <h3 className="text-white font-semibold mb-2">Events</h3>
                <p className="text-zinc-400 text-sm">Create and manage events</p>
              </Link>

              <Link
                href="/admin/news"
                className="bg-zinc-900/50 hover:bg-zinc-900/70 backdrop-blur-sm rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 p-6 transition-all"
              >
                <Newspaper className="w-8 h-8 text-[#7d82b8] mb-3" />
                <h3 className="text-white font-semibold mb-2">News</h3>
                <p className="text-zinc-400 text-sm">Create and manage news posts</p>
              </Link>

              <Link
                href="/admin/store"
                className="bg-zinc-900/50 hover:bg-zinc-900/70 backdrop-blur-sm rounded-xl border border-zinc-800/50 hover:border-zinc-700/50 p-6 transition-all"
              >
                <ShoppingBag className="w-8 h-8 text-[#7d82b8] mb-3" />
                <h3 className="text-white font-semibold mb-2">Store</h3>
                <p className="text-zinc-400 text-sm">Manage store items</p>
              </Link>

              <button
                onClick={handleLogout}
                className="bg-red-900/30 hover:bg-red-900/50 backdrop-blur-sm rounded-xl border border-red-700/30 hover:border-red-600/50 p-6 transition-all text-left"
              >
                <LogOut className="w-8 h-8 text-red-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">Logout</h3>
                <p className="text-zinc-400 text-sm">Sign out of admin panel</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
