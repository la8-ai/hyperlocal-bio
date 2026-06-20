'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Profile state
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');

  // Slots state
  const [slots, setSlots] = useState<any[]>([]);
  const [slotTitle, setSlotTitle] = useState('');
  const [slotDescription, setSlotDescription] = useState('');
  const [slotPrice, setSlotPrice] = useState('');

  // Inbox Bookings state
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        setUsername(profileData.username || '');
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
        setCity(profileData.city || '');
      }

      const { data: slotsData } = await supabase.from('slots').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      if (slotsData) setSlots(slotsData);

      const { data: bookingsData } = await supabase.from('bookings').select(`id, business_name, business_email, proposal_details, created_at, slots ( title )`).eq('creator_id', user.id).order('created_at', { ascending: false });
      if (bookingsData) setBookings(bookingsData);
      
      setLoading(false);
    };

    loadDashboardData();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id, username: username.toLowerCase().trim(), display_name: displayName, bio, city,
    });

    setSaving(false);
    if (error) setErrorMessage("Failed to update profile: " + error.message);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('slots').insert({
      user_id: user.id, title: slotTitle, description: slotDescription, price: parseFloat(slotPrice),
    }).select().single();

    if (error) setErrorMessage("Failed to add slot: " + error.message);
    else {
      setSlots([...slots, data]);
      setSlotTitle(''); setSlotDescription(''); setSlotPrice('');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from('slots').delete().eq('id', slotId);
    if (error) setErrorMessage("Failed to delete slot.");
    else setSlots(slots.filter(s => s.id !== slotId));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
        {errorMessage && <div className="bg-red-50 text-red-600 p-4 rounded-xl font-medium">{errorMessage}</div>}
        
        <div>
          <h1 className="text-3xl font-extrabold mb-6">Creator Dashboard</h1>
          <div className="bg-white rounded-2xl p-6 border shadow-sm">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Handle" value={username} onChange={(e) => setUsername(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
                <input placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
              </div>
              <textarea rows={3} placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <button type="submit" className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">{saving ? 'Saving...' : 'Save Profile'}</button>
            </form>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Your Sponsorship Offerings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleAddSlot} className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <input required placeholder="Service Title" value={slotTitle} onChange={(e) => setSlotTitle(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <input required type="number" placeholder="Price (£)" value={slotPrice} onChange={(e) => setSlotPrice(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <textarea required placeholder="Description" value={slotDescription} onChange={(e) => setSlotDescription(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm" />
              <button className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-bold">Publish Offering</button>
            </form>

            <div className="space-y-3">
              {slots.map((slot) => (
                <div key={slot.id} className="bg-white border p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-sm">{slot.title}</h4>
                    <p className="text-xs text-slate-500">£{slot.price}</p>
                  </div>
                  <div className="flex gap-3 text-xs font-semibold">
                    <Link href={`/edit/${slot.id}`} className="text-blue-600">Edit</Link>
                    <button onClick={() => handleDeleteSlot(slot.id)} className="text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Inbound Booking Requests</h2>
          {bookings.map((b) => (
            <div key={b.id} className="bg-white border rounded-2xl p-6 mb-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="font-bold">{b.business_name}</h3>
                <a href={`mailto:${b.business_email}`} className="text-xs bg-violet-100 text-violet-700 px-3 py-1 rounded-lg">Reply</a>
              </div>
              <p className="text-sm text-slate-600 italic">"{b.proposal_details}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}