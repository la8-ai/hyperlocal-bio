'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

interface Profile {
  username: string;
  display_name: string;
  city: string;
}

interface Slot {
  id: string;
  title: string;
  description: string;
  price: number;
  platforms: string[]; // Now expecting an array of strings
  profiles: Profile; 
}

export default function BrowsePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // These must match the options in your Dashboard
  const filterOptions = ['All', 'TikTok', 'Instagram', 'YouTube', 'Twitch', 'Live', 'Shoutout'];

  useEffect(() => {
    const fetchMarketplace = async () => {
      const { data, error } = await supabase
        .from('slots')
        .select(`
          id, title, description, price, platforms,
          profiles ( username, display_name, city )
        `)
        .order('created_at', { ascending: false });

      if (data) setSlots(data as unknown as Slot[]);
      if (error) console.error("Error fetching marketplace:", error);
      
      setLoading(false);
    };

    fetchMarketplace();
  }, []);

  // Filter logic: Search by text OR filter by specific platform array
  const filteredSlots = slots.filter((slot) => {
    const matchesSearch = `${slot.title} ${slot.description}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = activeFilter === 'All' || slot.platforms?.includes(activeFilter);

    return matchesSearch && matchesPlatform;
  });

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black">Creator Marketplace</h1>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border space-y-4">
          <input
            placeholder="Search by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border rounded-xl px-4 py-3"
          />
          
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold ${
                  activeFilter === f ? 'bg-violet-600 text-white' : 'bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredSlots.map((slot) => (
            <div key={slot.id} className="bg-white p-6 rounded-3xl border flex flex-col">
              <h3 className="font-bold">{slot.profiles?.display_name}</h3>
              <h2 className="text-xl font-black my-2">{slot.title}</h2>
              
              {/* Platform Tags Display */}
              <div className="flex flex-wrap gap-1 my-3">
                {slot.platforms?.map(p => (
                  <span key={p} className="bg-violet-50 text-violet-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                    {p}
                  </span>
                ))}
              </div>
              
              <div className="mt-auto pt-4 border-t flex justify-between items-center">
                <span className="font-black text-xl">£{slot.price}</span>
                <Link href={`/${slot.profiles?.username}`} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold">
                  Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}