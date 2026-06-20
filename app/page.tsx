'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center space-y-8">
      <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
        🚀 Now Live for Local Influencers
      </div>
      
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
        The simplest way for local creators to sell sponsorships.
      </h1>
      
      <p className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
        Create your custom storefront profile, list your rates for local business packages, and get booked directly.
      </p>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link 
          href="/login" 
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-4 rounded-xl shadow-md transition-all"
        >
          Claim Your Storefront Page
        </Link>
      </div>
    </div>
  );
}