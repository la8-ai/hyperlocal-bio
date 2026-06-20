'use client';

import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight text-slate-900">
          ⚡ Hyperlocal<span className="text-violet-600">Bio</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold text-slate-600">Dashboard</Link>
              <button onClick={handleSignOut} className="text-sm font-semibold text-red-600 hover:text-red-700">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm">
              Creator Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}