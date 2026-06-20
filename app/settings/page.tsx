'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export default function SettingsPage() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setEmail(data.session.user.email || '');
      }
    };
    getSession();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <p className="text-sm text-slate-500 mb-4">Logged in as: <strong>{email}</strong></p>
        {/* Add your profile update forms here */}
        <button 
          onClick={() => supabase.auth.signOut()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
        >
          Sign Out of Account
        </button>
      </div>
    </div>
  );
}