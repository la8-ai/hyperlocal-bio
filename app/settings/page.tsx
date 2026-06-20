'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

type Booking = {
  id: string;
  status: string;
  payment_status: string | null;
  business_name: string;
  proposal_details: string;
  checkout_session_id: string | null;
  slots: { title: string; price: number; profiles: { display_name: string; stripe_account_id: string | null } | null } | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState({ display_name: '', account_type: 'customer' });
  const [bookings, setBookings] = useState<Booking[]>([]);

  const loadAccount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setEmail(user.email || '');

    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name, account_type')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) setProfile(profileData);

    const { data: bookingData } = await supabase
      .from('bookings')
      .select('id, status, payment_status, business_name, proposal_details, checkout_session_id, slots ( title, price, profiles ( display_name, stripe_account_id ) )')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    setBookings((bookingData || []) as unknown as Booking[]);
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAccount();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('profile');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: profile.display_name })
      .eq('id', user.id);

    setBusy(null);
    if (error) alert(error.message);
    else alert('Account saved.');
  };

  const payBooking = async (booking: Booking) => {
    setBusy(booking.id);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create payment link.');

      if (data.sessionId) {
        await supabase
          .from('bookings')
          .update({ checkout_session_id: data.sessionId, payment_status: 'pending' })
          .eq('id', booking.id);
      }

      window.location.assign(data.url);
    } catch (error: unknown) {
      alert(getErrorMessage(error));
      setBusy(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="min-h-[calc(100vh-73px)] bg-slate-50 py-20 text-center text-sm font-bold text-slate-500">Loading account...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Account</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Settings and requests</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={saveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Profile</h2>
            <p className="mt-2 text-sm text-slate-500">Logged in as {email}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{profile.account_type} account</p>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Name</span>
              <input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <button disabled={busy === 'profile'} className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
              {busy === 'profile' ? 'Saving...' : 'Save account'}
            </button>
            <button type="button" onClick={signOut} className="mt-3 w-full rounded-xl border border-red-200 px-5 py-3 text-sm font-black text-red-700 hover:bg-red-50">
              Sign out
            </button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Your requests</h2>
            <div className="mt-5 space-y-3">
              {bookings.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No requests yet. Browse creator offers to get started.</p>
              ) : bookings.map((booking) => (
                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {booking.status} - {booking.payment_status || 'unpaid'}
                      </p>
                      <h3 className="mt-1 font-black text-slate-950">{booking.slots?.title || 'Creator offer'}</h3>
                      <p className="mt-1 text-sm text-slate-500">{booking.slots?.profiles?.display_name || 'Creator'}</p>
                    </div>
                    <span className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-800">GBP {booking.slots?.price || 0}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{booking.proposal_details}</p>
                  {booking.status === 'accepted' && booking.payment_status !== 'paid' && (
                    <button disabled={busy === booking.id} onClick={() => payBooking(booking)} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-60">
                      {busy === booking.id ? 'Starting payment...' : 'Pay now'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
