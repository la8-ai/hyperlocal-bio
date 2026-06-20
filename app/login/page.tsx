'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../utils/supabase';

type AccountType = 'customer' | 'creator';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'creator' ? 'creator' : 'customer';

  const [accountType, setAccountType] = useState<AccountType>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const copy = useMemo(() => {
    if (accountType === 'creator') {
      return {
        title: isSignUp ? 'Create a creator account' : 'Creator login',
        subtitle: isSignUp ? 'List offers, verify your socials, and get paid.' : 'Manage requests, offers, and payouts.',
        cta: isSignUp ? 'Create creator account' : 'Sign in as creator',
      };
    }

    return {
      title: isSignUp ? 'Create a business account' : 'Business login',
      subtitle: isSignUp ? 'Request campaigns from verified local creators.' : 'Track requests and pay for accepted offers.',
      cta: isSignUp ? 'Create business account' : 'Sign in',
    };
  }, [accountType, isSignUp]);

  const slugify = (value: string) => {
    const clean = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return clean || `${accountType}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { account_type: accountType } },
        });

        if (error) throw error;
        if (!data.user) throw new Error('Account was not created. Please try again.');

        const publicName = accountType === 'creator' ? displayName : businessName;
        const profile = {
          id: data.user.id,
          account_type: accountType,
          username: slugify(publicName || email.split('@')[0]),
          display_name: publicName || (accountType === 'creator' ? 'New Creator' : 'New Business'),
          bio: accountType === 'creator'
            ? 'Creator profile pending setup.'
            : 'Business account.',
          city: '',
          social_url: '',
          verification_status: accountType === 'creator' ? 'pending' : 'not_required',
        };

        const { error: profileError } = await supabase.from('profiles').upsert(profile);
        if (profileError) throw profileError;

        router.push(accountType === 'creator' ? '/dashboard' : '/browse');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', user?.id)
        .maybeSingle();

      router.push(profile?.account_type === 'creator' ? '/dashboard' : '/browse');
    } catch (error: unknown) {
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50 px-4 py-12">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            {(['customer', 'creator'] as AccountType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`rounded-lg px-3 py-2 text-sm font-black ${accountType === type ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
              >
                {type === 'customer' ? 'Normal login' : 'Creator login'}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-950">{copy.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{copy.subtitle}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && accountType === 'creator' && (
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">Creator name</span>
                <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Maya Eats Manchester" />
              </label>
            )}

            {isSignUp && accountType === 'customer' && (
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-slate-600">Business name</span>
                <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="North Street Coffee" />
              </label>
            )}

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="you@example.com" />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-600">Password</span>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="At least 6 characters" />
            </label>

            <button disabled={loading} className="w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
              {loading ? 'Working...' : copy.cta}
            </button>
          </form>

          <button onClick={() => setIsSignUp(!isSignUp)} className="mt-5 w-full text-center text-sm font-bold text-emerald-700 hover:text-emerald-800">
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </button>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm sm:p-8">
          <h2 className="text-2xl font-black">How it works</h2>
          <div className="mt-6 grid gap-4">
            {[
              ['1', 'Creators create profiles', 'Creators add a social link and Stripe payout account before publishing offers.'],
              ['2', 'Businesses send requests', 'Normal accounts browse offers and send campaign details to the creator.'],
              ['3', 'Creators accept', 'Accepted requests unlock payment for the buyer, then creators complete the work.'],
            ].map(([step, title, body]) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400 text-sm font-black text-slate-950">{step}</span>
                  <div>
                    <h3 className="font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm font-bold text-slate-500">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
