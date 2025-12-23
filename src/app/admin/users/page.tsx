'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { ArrowLeft, Ban, Shield, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  inviteId: string;
  name: string;
  email: string;
  slackName: string;
  slackId: string;
  xp: number;
  banned: boolean;
  teamId: string;
  pending: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'banned' | 'pending'>('all');

  useEffect(() => {
    const checkAuthAndFetchUsers = async () => {
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

        const usersResponse = await fetch('/api/admin/users');
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUsers();
  }, [router]);

  const filteredUsers = users.filter(user => {
    switch (filter) {
      case 'banned':
        return user.banned;
      case 'active':
        return !user.banned && !user.pending;
      case 'pending':
        return user.pending;
      default:
        return true;
    }
  });

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
            <div className="mb-8 flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Users</h1>
                <p className="text-zinc-400">Manage all hackathon users</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6 mb-8">
              <div className="flex flex-wrap gap-3">
                {['all', 'active', 'pending', 'banned'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as any)}
                    className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                      filter === f
                        ? 'bg-[#7d82b8] text-white'
                        : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                    }`}
                  >
                    {f === 'all' ? `All (${users.length})` : `${f} (${users.filter(u => {
                      if (f === 'banned') return u.banned;
                      if (f === 'active') return !u.banned && !u.pending;
                      if (f === 'pending') return u.pending;
                      return true;
                    }).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-zinc-700/50">
                    <tr className="bg-zinc-800/30">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Slack</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-400">XP</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-t border-zinc-700/30 hover:bg-zinc-800/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{user.name}</p>
                              <p className="text-zinc-500 text-sm">{user.slackId}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">{user.email}</td>
                          <td className="px-6 py-4 text-zinc-400">{user.slackName}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-white font-semibold">{user.xp}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {user.banned && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-900/30 text-red-400">
                                  Banned
                                </span>
                              )}
                              {user.pending && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-900/30 text-yellow-400">
                                  Pending
                                </span>
                              )}
                              {!user.banned && !user.pending && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">
                                  Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/admin/user/getuserinfo/${user.inviteId}`}
                              className="text-[#7d82b8] hover:text-[#7d82b8]/80 transition-colors text-sm font-medium"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
