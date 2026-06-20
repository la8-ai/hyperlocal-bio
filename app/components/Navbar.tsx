'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    const syncSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (!session) {
        setAccountType(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('account_type')
        .eq('id', session.user.id)
        .maybeSingle();

      setAccountType(data?.account_type || null);
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (!session) setAccountType(null);
      if (session) syncSession();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-950">
          Hyperlocal<span className="text-emerald-600">.</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/browse" className="text-sm font-bold text-slate-600 hover:text-slate-950">
            Browse
          </Link>
          {isLoggedIn ? (
            <>
              {accountType === 'creator' && (
                <Link href="/dashboard" className="hidden text-sm font-bold text-slate-600 hover:text-slate-950 sm:inline">
                  Studio
                </Link>
              )}
              <Link href="/settings" className="text-sm font-bold text-slate-600 hover:text-slate-950">
                Account
              </Link>
              <button onClick={signOut} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
