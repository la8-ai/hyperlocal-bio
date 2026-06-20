'use client';

import { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      // Handle User Registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else if (data?.user) {
        // Automatically provision a default profile row for them
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: `creator-${Math.floor(1000 + Math.random() * 9000)}`,
          display_name: 'New Creator',
          bio: 'Welcome to your new sponsorship profile! Click edit settings to change this bio text.',
          city: 'London',
        });
        
        alert('Account created successfully! Welcome aboard. 🚀');
        router.push('/dashboard'); // <-- Redirect straight to dashboard
      }
    } else {
      // Handle User Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        router.push('/dashboard'); // <-- Redirect straight to dashboard
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight">
            {isSignUp ? 'Create your profile' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-400">
            {isSignUp ? 'Start monetizing your local audience' : 'Manage your sponsorship inbox'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-50/50" 
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 bg-slate-50/50" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-violet-600 text-white font-bold text-sm py-3 rounded-xl shadow-sm hover:bg-violet-700 transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs font-semibold text-violet-600 hover:underline"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}