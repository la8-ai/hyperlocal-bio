'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed';

type Slot = {
  id: string;
  title: string;
  description: string;
  price: number;
  platforms: string[] | null;
  is_active: boolean | null;
};

type Booking = {
  id: string;
  business_name: string;
  business_email: string;
  proposal_details: string;
  status: BookingStatus;
  payment_status: string | null;
  created_at: string;
  slots: { title: string; price: number } | null;
};

const platformOptions = ['TikTok', 'Instagram', 'YouTube', 'Twitch', 'Live', 'Shoutout', 'Review'];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [userId, setUserId] = useState('');

  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    city: '',
    social_url: '',
    verification_status: 'pending',
    stripe_account_id: '',
    account_type: 'creator',
  });

  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotTitle, setSlotTitle] = useState('');
  const [slotDescription, setSlotDescription] = useState('');
  const [slotPrice, setSlotPrice] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?mode=creator');
      return;
    }

    setUserId(user.id);

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!profileData || profileData.account_type !== 'creator') {
      router.push('/login?mode=creator');
      return;
    }

    setProfile({
      username: profileData.username || '',
      display_name: profileData.display_name || '',
      bio: profileData.bio || '',
      city: profileData.city || '',
      social_url: profileData.social_url || '',
      verification_status: profileData.verification_status || 'pending',
      stripe_account_id: profileData.stripe_account_id || '',
      account_type: profileData.account_type || 'creator',
    });

    const { data: slotsData } = await supabase
      .from('slots')
      .select('id, title, description, price, platforms, is_active')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id, business_name, business_email, proposal_details, status, payment_status, created_at, slots ( title, price )')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    setSlots((slotsData || []) as Slot[]);
    setBookings((bookingsData || []) as unknown as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDashboardData();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) => prev.includes(platform) ? prev.filter((item) => item !== platform) : [...prev, platform]);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      account_type: 'creator',
      username: profile.username.toLowerCase().trim(),
      display_name: profile.display_name.trim(),
      bio: profile.bio,
      city: profile.city,
      social_url: profile.social_url,
      verification_status: profile.social_url ? profile.verification_status : 'pending',
    });

    setSavingProfile(false);
    if (error) alert(error.message);
    else alert('Profile saved.');
  };

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatforms.length) {
      alert('Pick at least one platform or format.');
      return;
    }

    const { data, error } = await supabase
      .from('slots')
      .insert({
        user_id: userId,
        title: slotTitle,
        description: slotDescription,
        price: Number(slotPrice),
        platforms: selectedPlatforms,
        is_active: true,
      })
      .select('id, title, description, price, platforms, is_active')
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setSlots([data as Slot, ...slots]);
    setSlotTitle('');
    setSlotDescription('');
    setSlotPrice('');
    setSelectedPlatforms([]);
  };

  const deleteSlot = async (slotId: string) => {
    if (!confirm('Delete this offer?')) return;
    const { error } = await supabase.from('slots').delete().eq('id', slotId).eq('user_id', userId);
    if (error) alert(error.message);
    else setSlots(slots.filter((slot) => slot.id !== slotId));
  };

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    setBusy(bookingId);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId).eq('creator_id', userId);
    setBusy(null);
    if (error) alert(error.message);
    else setBookings(bookings.map((booking) => booking.id === bookingId ? { ...booking, status } : booking));
  };

  const startOnboarding = async () => {
    setBusy('stripe');
    try {
      const response = await fetch('/api/stripe/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, existingAccountId: profile.stripe_account_id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start Stripe onboarding.');

      if (data.accountId && data.accountId !== profile.stripe_account_id) {
        await supabase.from('profiles').update({ stripe_account_id: data.accountId }).eq('id', userId);
      }

      window.location.assign(data.url);
    } catch (error: unknown) {
      alert(getErrorMessage(error));
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="min-h-[calc(100vh-73px)] bg-slate-50 py-20 text-center text-sm font-bold text-slate-500">Loading studio...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Creator studio</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Manage your offers</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Publish products, review requests, and connect payouts.</p>
          </div>
          {profile.username && (
            <Link href={`/${profile.username}`} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100">
              View public profile
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Creator profile</h2>
                <p className="mt-1 text-sm text-slate-500">Social verification is manual for now: add your public social link.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase text-amber-800">{profile.verification_status}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">Display name</span>
                <input required value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">Username</span>
                <input required value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">City</span>
                <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Manchester" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">Social link</span>
                <input value={profile.social_url} onChange={(e) => setProfile({ ...profile, social_url: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="https://instagram.com/yourname" />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Bio</span>
              <textarea rows={4} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button disabled={savingProfile} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
              <button type="button" onClick={startOnboarding} disabled={busy === 'stripe'} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100 disabled:opacity-60">
                {profile.stripe_account_id ? 'Continue Stripe setup' : 'Connect Stripe payouts'}
              </button>
            </div>
          </form>

          <form onSubmit={addSlot} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Create an offer</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_150px]">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">Offer title</span>
                <input required value={slotTitle} onChange={(e) => setSlotTitle(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Instagram reel review" />
              </label>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">Price GBP</span>
                <input required type="number" min="1" value={slotPrice} onChange={(e) => setSlotPrice(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </label>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Description</span>
              <textarea required rows={4} value={slotDescription} onChange={(e) => setSlotDescription(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="What the buyer gets, timeline, and what you need from them." />
            </label>
            <div className="mt-4">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Formats</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {platformOptions.map((platform) => (
                  <button key={platform} type="button" onClick={() => togglePlatform(platform)} className={`rounded-full px-3 py-2 text-xs font-black ${selectedPlatforms.includes(platform) ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                    {platform}
                  </button>
                ))}
              </div>
            </div>
            <button className="mt-5 w-full rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800">
              Publish offer
            </button>
          </form>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Live offers</h2>
            <div className="mt-5 space-y-3">
              {slots.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No offers yet.</p>
              ) : slots.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black text-slate-950">{slot.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{slot.description}</p>
                      <p className="mt-2 text-sm font-black text-emerald-700">GBP {slot.price}</p>
                    </div>
                    <button onClick={() => deleteSlot(slot.id)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Requests</h2>
            <div className="mt-5 space-y-3">
              {bookings.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No requests yet.</p>
              ) : bookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{booking.slots?.title || 'Offer'} - {booking.status} - {booking.payment_status || 'unpaid'}</p>
                      <h3 className="mt-1 font-black text-slate-950">{booking.business_name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{booking.business_email}</p>
                    </div>
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">GBP {booking.slots?.price || 0}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{booking.proposal_details}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {booking.status === 'pending' && (
                      <>
                        <button disabled={busy === booking.id} onClick={() => updateBookingStatus(booking.id, 'accepted')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white hover:bg-emerald-800 disabled:opacity-60">Accept</button>
                        <button disabled={busy === booking.id} onClick={() => updateBookingStatus(booking.id, 'declined')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-60">Decline</button>
                      </>
                    )}
                    {booking.status === 'accepted' && (
                      <button disabled={busy === booking.id} onClick={() => updateBookingStatus(booking.id, 'completed')} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60">Mark complete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
