'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../utils/supabase';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      setIsLoggedIn(event === 'SIGNED_IN');
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="border-b bg-white p-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-black text-xl">Hyperlocal</Link>
        <div className="flex items-center gap-6">
          <Link href="/browse">Browse</Link>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/settings">⚙️</Link>
            </>
          ) : (
            <Link href="/login" className="bg-black text-white px-4 py-2 rounded-lg">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}