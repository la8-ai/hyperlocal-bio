'use client';

import Link from 'next/link';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
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
    <nav className="border-b border-slate-100 bg-white p-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-black text-xl text-violet-600">Hyperlocal</Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold text-slate-600">Dashboard</Link>
              <button 
                onClick={handleSignOut}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-slate-900 text-white text-sm px-4 py-2 rounded-xl font-bold">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}