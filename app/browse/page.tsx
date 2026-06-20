'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

// Define the shape of our joined data
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
  profiles: Profile; 
}

export default function BrowsePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Smart categories that filter based on keywords found in titles/descriptions
  const categories = [
    { name: 'All', keywords: [] },
    { name: 'TikTok', keywords: ['tiktok', 'tt'] },
    { name: 'Instagram', keywords: ['instagram', 'ig', 'reel', 'story', 'stories'] },
    { name: 'YouTube', keywords: ['youtube', 'yt', 'shorts', 'video'] },
    { name: 'Livestreams & Shoutouts', keywords: ['live', 'stream', 'twitch', 'shoutout', 'shout out', 'mention'] },
    { name: 'UGC & Reviews', keywords: ['ugc', 'review', 'user generated', 'dedicated', 'testing'] },
  ];

  useEffect(() => {
    const fetchMarketplace = async () => {
      // Fetch all slots and join the profile info to know who the creator is
      const { data, error } = await supabase
        .from('slots')
        .select(`
          id,
          title,
          description,
          price,
          profiles (
            username,
            display_name,
            city
          )
        `)
        .order('created_at', { ascending: false });

      if (data) setSlots(data as unknown as Slot[]);
      if (error) console.error("Error fetching marketplace:", error);
      
      setLoading(false);
    };

    fetchMarketplace();
  }, []);

  // Run the data through our text search and category keyword filters
  const filteredSlots = slots.filter((slot) => {
    const textToSearch = `${slot.title} ${slot.description}`.toLowerCase();
    const searchMatch = textToSearch.includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'All') return searchMatch;
    
    const activeKeywords = categories.find(c => c.name === activeFilter)?.keywords || [];
    const filterMatch = activeKeywords.some(kw => textToSearch.includes(kw));

    return searchMatch && filterMatch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="font-medium text-slate-500 animate-pulse">Loading marketplace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-12 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Creator Marketplace
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Browse live sponsorship offerings, shoutouts, and content packages from local creators. Build partnerships today.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="space-y-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <input
            type="text"
            placeholder="Search by keywords, niches, or deliverables (e.g., 'gaming', 'vlog', 'food')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setActiveFilter(category.name)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  activeFilter === category.name
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        {filteredSlots.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No active listings match your filters.</p>
            <button 
              onClick={() => { setActiveFilter('All'); setSearchQuery(''); }}
              className="mt-4 text-violet-600 font-bold text-sm hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSlots.map((slot) => {
              // Safety fallback in case a profile is missing/deleted
              const profile = slot.profiles || { display_name: 'Unknown Creator', username: '', city: 'Unknown' };

              return (
                <div key={slot.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
                  
                  {/* Creator Identity & Tag */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{profile.display_name}</h3>
                      <Link href={`/${profile.username}`} className="text-violet-600 text-xs font-bold hover:underline">
                        @{profile.username}
                      </Link>
                    </div>
                    {profile.city && (
                      <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                        {profile.city}
                      </span>
                    )}
                  </div>

                  {/* Pitch / Offering Details */}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                      {slot.title}
                    </h2>
                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {slot.description}
                    </p>
                  </div>

                  {/* Price & Call to Action */}
                  <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-900">
                      £{slot.price}
                    </span>
                    <Link 
                      href={`/${profile.username}`} 
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors"
                    >
                      Book Creator
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}