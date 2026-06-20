'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../utils/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking');
  const sessionId = searchParams.get('session_id');
  const [message, setMessage] = useState('Confirming your payment...');

  useEffect(() => {
    const markPaid = async () => {
      if (!bookingId) {
        setMessage('Payment completed. You can return to your account.');
        return;
      }

      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid', checkout_session_id: sessionId })
        .eq('id', bookingId);

      setMessage(error ? error.message : 'Payment confirmed. The creator can now complete your request.');
    };

    markPaid();
  }, [bookingId, sessionId]);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-20">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Payment</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Thank you</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <Link href="/settings" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800">
          Back to account
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm font-bold text-slate-500">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
