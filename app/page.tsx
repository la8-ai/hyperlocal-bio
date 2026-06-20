'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-violet-500 selection:text-white">
      {/* Simple Navigation Bar */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900">
              ⚡ Hyperlocal<span className="text-violet-600">Bio</span>
            </span>
          </div>
          <nav>
            <Link 
              href="/login" 
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm"
            >
              Creator Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase">
          🚀 Now Live for Local Influencers
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 max-w-2xl mx-auto leading-[1.1]">
          The simplest way for local creators to sell sponsorships.
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
          Create your custom storefront profile, list your rates for local business packages, and get booked directly. No endless email threads.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/login" 
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-center"
          >
            Claim Your Storefront Page
          </Link>
          <a 
            href="#how-it-works" 
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold px-8 py-4 rounded-xl hover:bg-slate-50 transition text-center"
          >
            Learn More
          </a>
        </div>
      </main>

      {/* Quick Features / How it works */}
      <section id="how-it-works" className="border-t border-slate-100 bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-900 mb-12">
            Built for the Hyperlocal Economy
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
              <div className="text-2xl">✨</div>
              <h3 className="font-bold text-lg text-slate-900">1. List Your Slots</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Define your deliverables clearly—like Instagram Stories, TikTok posts, or physical appearances—with transparent pricing.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
              <div className="text-2xl">🏬</div>
              <h3 className="font-bold text-lg text-slate-900">2. Local Brands Propose</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Local restaurants, shops, and event organizers fill out your customized proposal form directly on your custom public URL.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
              <div className="text-2xl">✉️</div>
              <h3 className="font-bold text-lg text-slate-900">3. Land Leads Instantly</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Review campaign context inside your creator inbox and click one button to instantly fire back an email response to close the deal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-xs font-medium text-slate-400">
        &copy; {new Date().getFullYear()} Hyperlocal Bio. All rights reserved.
      </footer>
    </div>
  );
}