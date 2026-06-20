'use client';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* HEADER REMOVED: It is now managed by the global Navbar */}

      <main className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center space-y-8">
        {/* ... rest of your hero content ... */}
      </main>
      
      {/* ... rest of your sections and footer ... */}
    </div>
  );
}