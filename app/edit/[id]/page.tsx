'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', price: '', description: '' });

  useEffect(() => {
    const fetchSlot = async () => {
      const { data } = await supabase.from('slots').select('*').eq('id', id).single();
      if (data) setFormData(data);
      setLoading(false);
    };
    fetchSlot();
  }, [id]);

  const updateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('slots').update(formData).eq('id', id);
    if (error) alert("Error updating: " + error.message);
    else router.push('/dashboard');
  };

  if (loading) return <div className="p-12">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>
      <form onSubmit={updateListing} className="space-y-4">
        <div>
          <label className="block text-sm font-bold">Title</label>
          <input className="border w-full p-2 rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold">Price (£)</label>
          <input type="number" className="border w-full p-2 rounded" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        </div>
        <div>
          <label className="block text-sm font-bold">Description</label>
          <textarea className="border w-full p-2 rounded" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
        <button className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold">Save Changes</button>
      </form>
    </div>
  );
}