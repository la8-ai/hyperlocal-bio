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
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]); // New state

  const PLATFORM_OPTIONS = ['TikTok', 'Instagram', 'YouTube', 'Twitch', 'Live', 'Shoutout'];

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

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlatforms.length === 0) { alert("Please select at least one platform."); return; }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.from('slots').insert({
      user_id: user.id,
      title: slotTitle,
      description: slotDescription,
      price: parseFloat(slotPrice),
      platforms: selectedPlatforms, // Saving the array
    }).select().single();

    if (error) alert(error.message);
    else {
      setSlots([...slots, data]);
      setSlotTitle(''); setSlotDescription(''); setSlotPrice(''); setSelectedPlatforms([]);
      alert('Sponsorship slot added with platforms! 💸');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({ id: user.id, username: username.toLowerCase().trim(), display_name: displayName, bio, city });
    setSaving(false);
    if (error) alert(error.message);
    else alert('Profile updated!');
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('slots').delete().eq('id', slotId);
    if (!error) setSlots(slots.filter(s => s.id !== slotId));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      <div className="max-w-3xl mx-auto px-4 pt-12 space-y-12">
        {/* ... Profile Settings UI (Same as your original) ... */}
        
        {/* Updated Sponsorship Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleAddSlot} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="font-bold">Add New Slot</h3>
            <input required placeholder="Service Title" value={slotTitle} onChange={e => setSlotTitle(e.target.value)} className="w-full border rounded-xl p-2 text-sm" />
            <input required type="number" placeholder="Price (£)" value={slotPrice} onChange={e => setSlotPrice(e.target.value)} className="w-full border rounded-xl p-2 text-sm" />
            <textarea required placeholder="Description" value={slotDescription} onChange={e => setSlotDescription(e.target.value)} className="w-full border rounded-xl p-2 text-sm" />
            
            {/* Multi-Select Platform Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Select Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map(p => (
                  <button 
                    key={p} type="button"
                    onClick={() => togglePlatform(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${selectedPlatforms.includes(p) ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-100'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold">Publish Offering</button>
          </form>

          {/* Active Slots list... */}
        </div>
      </div>
    </div>
  );
}