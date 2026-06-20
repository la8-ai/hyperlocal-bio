'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

type Slot = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  platforms: string[] | null;
  profiles?: {
    display_name: string | null;
    username: string | null;
  } | null;
};

export default function BookingModal({ slot, onClose }: { slot: Slot; onClose: () => void }) {
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [details, setDetails] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setBusinessEmail(user?.email || '');

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, account_type')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.account_type === 'creator') {
          setBusinessName(data.display_name || '');
        } else {
          setBusinessName(data?.display_name || '');
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    const { error } = await supabase.from('bookings').insert({
      creator_id: slot.user_id,
      customer_id: userId,
      slot_id: slot.id,
      business_name: businessName,
      business_email: businessEmail,
      proposal_details: details,
      status: 'pending',
      payment_status: 'unpaid',
    });

    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Booking request</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{slot.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Creator: {slot.profiles?.display_name || 'Creator'} - GBP {slot.price}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-black text-slate-500 hover:bg-slate-50">
            X
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm font-bold text-slate-500">Checking account...</div>
        ) : !userId ? (
          <div className="rounded-2xl bg-slate-50 p-5 text-center">
            <h3 className="font-black text-slate-950">Log in to request this offer</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Normal accounts can send campaign details and pay after the creator accepts.</p>
            <Link href="/login" className="mt-4 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
              Normal login
            </Link>
          </div>
        ) : done ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-center">
            <h3 className="font-black text-emerald-950">Request sent</h3>
            <p className="mt-2 text-sm leading-6 text-emerald-800">The creator can now accept your request. If accepted, you will see a payment button in your account page.</p>
            <button onClick={onClose} className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submitBooking} className="space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Business name</span>
              <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Contact email</span>
              <input type="email" required value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">What do you want the creator to make?</span>
              <textarea required rows={4} value={details} onChange={(e) => setDetails(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Campaign goals, deadline, product/service, key message..." />
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button disabled={submitting} className="flex-1 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
                {submitting ? 'Sending...' : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
