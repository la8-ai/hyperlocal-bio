'use client';

import { useEffect, useMemo, useState } from 'react';
import BookingModal from '../components/BookingModal';
import { supabase } from '../utils/supabase';

type Profile = {
  username: string | null;
  display_name: string | null;
  city: string | null;
  verification_status?: string | null;
};

type Slot = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  platforms: string[] | null;
  profiles: Profile | null;
};

const filterOptions = ['All', 'TikTok', 'Instagram', 'YouTube', 'Twitch', 'Live', 'Shoutout', 'Review'];

export default function BrowsePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    const fetchMarketplace = async () => {
      const { data, error } = await supabase
        .from('slots')
        .select(`
          id, user_id, title, description, price, platforms,
          profiles ( username, display_name, city, verification_status )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) console.error(error.message);
      if (data) setSlots(data as unknown as Slot[]);
      setLoading(false);
    };

    fetchMarketplace();
  }, []);

  const filteredSlots = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return slots.filter((slot) => {
      const text = `${slot.title} ${slot.description} ${slot.profiles?.display_name || ''} ${slot.profiles?.city || ''}`.toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const matchesPlatform = activeFilter === 'All' || slot.platforms?.includes(activeFilter);
      return matchesSearch && matchesPlatform;
    });
  }, [activeFilter, searchQuery, slots]);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Marketplace</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Browse creator offers</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Send a request first. You only pay once the creator accepts the brief.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:w-[420px]">
            <input
              placeholder="Search by creator, city, or offer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${activeFilter === filter ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-sm font-bold text-slate-500">
            Loading creator offers...
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center">
            <h2 className="font-black text-slate-950">No offers found</h2>
            <p className="mt-2 text-sm text-slate-500">Try another search or filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredSlots.map((slot) => (
              <article key={slot.id} className="flex min-h-[280px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-950">{slot.profiles?.display_name || 'Creator'}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{slot.profiles?.city || 'Online'} {slot.profiles?.verification_status === 'verified' ? '- Verified' : ''}</p>
                  </div>
                  <span className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-800">GBP {slot.price}</span>
                </div>

                <h2 className="mt-5 text-2xl font-black leading-tight text-slate-950">{slot.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{slot.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {slot.platforms?.map((platform) => (
                    <span key={platform} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                      {platform}
                    </span>
                  ))}
                </div>

                <button onClick={() => setSelectedSlot(slot)} className="mt-auto rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
                  Request offer
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && <BookingModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />}
    </div>
  );
}
