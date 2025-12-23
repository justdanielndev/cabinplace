'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface News {
  id: string;
  name: string;
  description: string;
  mdContent: string;
  author: string;
  publicationDate: string;
}

export default function NewsAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<News[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mdContent: '',
    author: '',
    publicationDate: '',
  });

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

        const newsResponse = await fetch('/api/admin/news');
        if (newsResponse.ok) {
          const data = await newsResponse.json();
          setNews(data.news || []);
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
        ...(editingId && { id: editingId }),
      };

      const response = await fetch('/api/admin/news', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          description: '',
          mdContent: '',
          author: '',
          publicationDate: '',
        });
        
        const newsResponse = await fetch('/api/admin/news');
        if (newsResponse.ok) {
          const data = await newsResponse.json();
          setNews(data.news || []);
        }
      } else {
        alert('Failed to save news');
      }
    } catch (error) {
      console.error('Error saving news:', error);
      alert('Error saving news');
    }
  };

  const handleEdit = (newsItem: News) => {
    setFormData({
      name: newsItem.name,
      description: newsItem.description,
      mdContent: newsItem.mdContent,
      author: newsItem.author,
      publicationDate: newsItem.publicationDate,
    });
    setEditingId(newsItem.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this news?')) return;
    try {
      const response = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setNews(news.filter(n => n.id !== id));
      } else {
        alert('Failed to delete news');
      }
    } catch (error) {
      console.error('Error deleting news:', error);
      alert('Error deleting news');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      mdContent: '',
      author: '',
      publicationDate: '',
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
                <h1 className="text-4xl font-bold text-white mb-2">Manage News</h1>
                <p className="text-zinc-400">Create, edit, or delete news posts</p>
              </div>
            </div>

            {/* News List */}
            <div className="space-y-4 mb-8">
              {news.length > 0 ? (
                news.map((newsItem) => (
                  <div key={newsItem.id} className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{newsItem.name}</h3>
                        <p className="text-zinc-400 text-sm mb-3">{newsItem.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-zinc-500">Author:</span>
                            <p className="text-white">{newsItem.author}</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">Published:</span>
                            <p className="text-white">{newsItem.publicationDate}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(newsItem)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-[#7d82b8]" />
                        </button>
                        <button
                          onClick={() => handleDelete(newsItem.id)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-400">No news yet</div>
              )}
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit News' : 'Create News'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3">Title</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50 min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Markdown Content</label>
                    <textarea
                      value={formData.mdContent}
                      onChange={(e) => setFormData({ ...formData, mdContent: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50 min-h-[200px] font-mono text-sm"
                      placeholder="Enter markdown content here..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-3">Author</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-3">Publication Date</label>
                      <input
                        type="date"
                        value={formData.publicationDate}
                        onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#7d82b8] hover:bg-[#7d82b8]/80 text-white rounded-lg transition-colors font-semibold"
                    >
                      {editingId ? 'Update News' : 'Create News'}
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
                Add News
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
