'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/top-nav';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  xpPrice: number;
  quantity: number;
  category: string;
  limitPerPerson: number | null;
  relatedEvent: string | null;
}

export default function StoreAdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    xpPrice: '',
    quantity: '-1',
    category: '',
    limitPerPerson: '',
    relatedEvent: '',
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

        const itemsResponse = await fetch('/api/admin/store');
        if (itemsResponse.ok) {
          const data = await itemsResponse.json();
          setItems(data.items || []);
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
        xpPrice: parseInt(formData.xpPrice),
        quantity: parseInt(formData.quantity),
        limitPerPerson: formData.limitPerPerson ? parseInt(formData.limitPerPerson) : null,
        ...(editingId && { id: editingId }),
      };

      const response = await fetch('/api/admin/store', {
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
          xpPrice: '',
          stockStatus: 'unlimited',
          category: '',
          limitPerPerson: '',
          relatedEvent: '',
        });
        
        const itemsResponse = await fetch('/api/admin/store');
        if (itemsResponse.ok) {
          const data = await itemsResponse.json();
          setItems(data.items || []);
        }
      } else {
        alert('Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item');
    }
  };

  const handleEdit = (item: StoreItem) => {
    setFormData({
      name: item.name,
      description: item.description,
      xpPrice: item.xpPrice.toString(),
      quantity: item.quantity.toString(),
      category: item.category,
      limitPerPerson: item.limitPerPerson ? item.limitPerPerson.toString() : '',
      relatedEvent: item.relatedEvent || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`/api/admin/store?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setItems(items.filter(i => i.id !== id));
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      xpPrice: '',
      quantity: '-1',
      category: '',
      limitPerPerson: '',
      relatedEvent: '',
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
                <h1 className="text-4xl font-bold text-white mb-2">Manage Store</h1>
                <p className="text-zinc-400">Create, edit, or delete store items</p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4 mb-8">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{item.name}</h3>
                        <p className="text-zinc-400 text-sm mb-3">{item.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                          <div>
                            <span className="text-zinc-500">Price:</span>
                            <p className="text-white font-semibold">{item.xpPrice} XP</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">Category:</span>
                            <p className="text-white">{item.category}</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">Quantity:</span>
                            <p className="text-white">{item.quantity === -1 ? 'Unlimited' : item.quantity}</p>
                          </div>
                          <div>
                            <span className="text-zinc-500">Limit/Person:</span>
                            <p className="text-white">{item.limitPerPerson || '—'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-5 h-5 text-[#7d82b8]" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-400">No store items yet</div>
              )}
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white">{editingId ? 'Edit Item' : 'Create Item'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <label className="block text-white font-semibold mb-3">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50 min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-semibold mb-3">XP Price</label>
                      <input
                        type="number"
                        value={formData.xpPrice}
                        onChange={(e) => setFormData({ ...formData, xpPrice: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-white font-semibold mb-3">Quantity (-1 for unlimited)</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Limit Per Person</label>
                    <input
                      type="number"
                      value={formData.limitPerPerson}
                      onChange={(e) => setFormData({ ...formData, limitPerPerson: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Related Event ID (optional)</label>
                    <input
                      type="text"
                      value={formData.relatedEvent}
                      onChange={(e) => setFormData({ ...formData, relatedEvent: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:border-[#7d82b8]/50"
                      placeholder="Leave blank if not related to an event"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#7d82b8] hover:bg-[#7d82b8]/80 text-white rounded-lg transition-colors font-semibold"
                    >
                      {editingId ? 'Update Item' : 'Create Item'}
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
                Add Item
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
