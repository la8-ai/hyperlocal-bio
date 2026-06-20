'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BookingModal from '../components/BookingModal';
import { supabase } from '../utils/supabase';

type Creator = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  city: string;
  social_url: string;
  verification_status: string;
};

type Slot = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  platforms: string[] | null;
  profiles: {
    display_name: string | null;
    username: string | null;
  };
};

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<Creator | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const username = params?.username?.toLowerCase();
      if (!username) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, city, social_url, verification_status, account_type')
        .eq('username', username)
        .eq('account_type', 'creator')
        .maybeSingle();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setCreator(profileData as Creator);

      const { data: slotData } = await supabase
        .from('slots')
        .select('id, user_id, title, description, price, platforms, profiles ( display_name, username )')
        .eq('user_id', profileData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      setSlots((slotData || []) as unknown as Slot[]);
      setLoading(false);
    };

    loadProfile();
  }, [params?.username]);

  if (loading) {
    return <div className="min-h-[calc(100vh-73px)] bg-slate-50 py-20 text-center text-sm font-bold text-slate-500">Loading creator...</div>;
  }

  if (!creator) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-950">Creator not found</h1>
          <p className="mt-2 text-sm text-slate-500">This public creator profile is not live yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50">
      <div className="bg-slate-950">
        <section className="mx-auto max-w-6xl px-4 py-12 text-white">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-300">{creator.city || 'Online creator'}</p>
            <h1 className="mt-3 text-5xl font-black tracking-tight">{creator.display_name}</h1>
            <p className="mt-2 text-sm font-bold text-slate-300">@{creator.username}</p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{creator.bio || 'Creator profile coming soon.'}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-white">
                {creator.verification_status === 'verified' ? 'Verified creator' : 'Social submitted'}
              </span>
              {creator.social_url && (
                <a href={creator.social_url} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-400 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 hover:bg-emerald-300">
                  View social
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Available offers</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Book {creator.display_name}</h2>
          </div>
        </div>

        {slots.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h3 className="font-black text-slate-950">No live offers yet</h3>
            <p className="mt-2 text-sm text-slate-500">Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot) => (
              <article key={slot.id} className="flex min-h-[250px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-black leading-tight text-slate-950">{slot.title}</h3>
                  <span className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-800">GBP {slot.price}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{slot.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {slot.platforms?.map((platform) => (
                    <span key={platform} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">{platform}</span>
                  ))}
                </div>
                <button onClick={() => setSelectedSlot(slot)} className="mt-auto rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
                  Request offer
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedSlot && <BookingModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />}
    </div>
  );
}
