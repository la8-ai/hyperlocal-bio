'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
      
      if (!user) {
        router.push('/login');
        return;
      }

      // 1. Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setUsername(profileData.username || '');
        setDisplayName(profileData.display_name || '');
        setBio(profileData.bio || '');
        setCity(profileData.city || '');
      }

      // 2. Fetch existing slots
      const { data: slotsData } = await supabase
        .from('slots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (slotsData) {
        setSlots(slotsData);
      }

      // 3. Fetch inbound booking proposals matching this creator
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          business_name,
          business_email,
          proposal_details,
          created_at,
          slots ( title )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsData) {
        setBookings(bookingsData);
      }

      setLoading(false);
    };

    loadDashboardData();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: username.toLowerCase().trim(),
      display_name: displayName,
      bio: bio,
      city: city,
    });

    setSaving(false);
    if (error) alert(error.message);
    else alert('Profile updated successfully! 🚀');
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('slots').insert({
      user_id: user.id,
      title: slotTitle,
      description: slotDescription,
      price: parseFloat(slotPrice),
    }).select().single();

    if (error) {
      alert(error.message);
    } else if (data) {
      setSlots([...slots, data]);
      setSlotTitle('');
      setSlotDescription('');
      setSlotPrice('');
      alert('Sponsorship slot added live! 💸');
    }
  };

  // NEW: Delete Function
  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    const { error } = await supabase.from('slots').delete().eq('id', slotId);
    if (!error) {
      setSlots(slots.filter(s => s.id !== slotId));
    }
  };

  // NEW: Edit Function
  const handleEditSlot = async (slot: any) => {
    const newTitle = prompt("Edit Title:", slot.title);
    const newPrice = prompt("Edit Price:", slot.price);
    if (newTitle && newPrice) {
      const { error } = await supabase.from('slots').update({ 
        title: newTitle, 
        price: parseFloat(newPrice) 
      }).eq('id', slot.id);
      
      if (!error) {
        setSlots(slots.map(s => s.id === slot.id ? { ...s, title: newTitle, price: newPrice } : s));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <p className="font-medium animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
        
        {/* Profile Settings Block */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Creator Dashboard</h1>
          <p className="text-slate-500 mb-6">Customize your profile metadata.</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Handle</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Display Name</label>
                  <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">City Target</label>
                <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Bio</label>
                <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-violet-500" />
              </div>
              <button type="submit" disabled={saving} className="bg-violet-600 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-sm hover:bg-violet-700">
                {saving ? 'Saving...' : 'Save Profile Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* Sponsorship Management Block */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Sponsorship Offerings</h2>
          <p className="text-slate-500 mb-6">Create predefined pricing options for local brands.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit">
              <h3 className="font-bold text-slate-800 mb-4">Add New Slot</h3>
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Service Title</label>
                  <input type="text" required placeholder="e.g. Dedicated Video Review" value={slotTitle} onChange={(e) => setSlotTitle(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Price (£ GBP)</label>
                  <input type="number" required placeholder="150" value={slotPrice} onChange={(e) => setSlotPrice(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-violet-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Deliverable Description</label>
                  <textarea rows={2} required placeholder="What exactly does the business get?" value={slotDescription} onChange={(e) => setSlotDescription(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-violet-500" />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-slate-800">
                  Publish Offering
                </button>
              </form>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 px-1">Active Slots ({slots.length})</h3>
              {slots.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 bg-white rounded-2xl text-slate-400 text-sm">
                  No slots published yet. Build your first one!
                </div>
              ) : (
                slots.map((slot) => (
                  <div key={slot.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{slot.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{slot.description}</p>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => handleEditSlot(slot)} className="text-[10px] font-bold text-blue-600 uppercase">Edit</button>
                        <button onClick={() => handleDeleteSlot(slot.id)} className="text-[10px] font-bold text-red-600 uppercase">Delete</button>
                      </div>
                    </div>
                    <span className="font-extrabold text-sm text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      £{slot.price}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* INBOX SECTION BLOCK */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Inbound Booking Requests</h2>
          <p className="text-slate-500 mb-6">Proposals submitted by local brands directly through your landing page.</p>
          
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                Your inbox is empty. When brands submit proposals, they will load here instantly!
              </div>
            ) : (
              bookings.map((booking) => (
                <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                        Requested: {(booking.slots as any)?.title || 'Custom Offering'}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-2">{booking.business_name}</h3>
                    </div>
                    <a 
                      href={`mailto:${booking.business_email}?subject=Regarding your Hyperlocal Bio proposal`}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition"
                    >
                      Reply via Email ✉️
                    </a>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 italic leading-relaxed">
                    "{booking.proposal_details}"
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium px-1">
                    Contact: <span className="underline font-semibold">{booking.business_email}</span> • Received: {new Date(booking.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}