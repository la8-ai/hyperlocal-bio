'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function EditListingPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: '', price: '', description: '' });

  useEffect(() => {
    const fetchSlot = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?mode=creator');
        return;
      }

      const { data } = await supabase
        .from('slots')
        .select('title, price, description')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setFormData({ title: data.title || '', price: String(data.price || ''), description: data.description || '' });
      }

      setLoading(false);
    };

    fetchSlot();
  }, [params.id, router]);

  const updateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('slots')
      .update({ title: formData.title, price: Number(formData.price), description: formData.description })
      .eq('id', params.id)
      .eq('user_id', user?.id);

    setSaving(false);
    if (error) alert(error.message);
    else router.push('/dashboard');
  };

  if (loading) {
    return <div className="min-h-[calc(100vh-73px)] bg-slate-50 py-20 text-center text-sm font-bold text-slate-500">Loading offer...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10">
      <form onSubmit={updateListing} className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-slate-950">Edit offer</h1>
        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Title</span>
            <input required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Price GBP</span>
            <input required type="number" min="1" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">Description</span>
            <textarea required rows={5} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </label>
        </div>
        <button disabled={saving} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
