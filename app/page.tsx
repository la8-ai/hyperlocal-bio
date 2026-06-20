import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50">
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div className="space-y-7">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700">
            Local creator campaigns, booked properly
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-6xl">
              Buy creator promos from people your customers already trust.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Hyperlocal lets small businesses request shoutouts, video reviews, visits, and local launch campaigns from verified creators.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/browse" className="rounded-xl bg-slate-950 px-6 py-3 text-center text-sm font-black text-white shadow-sm hover:bg-slate-800">
              Browse creators
            </Link>
            <Link href="/login?mode=creator" className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100">
              Creator login
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4">
            {[
              ['Shoutout package', 'A short reel or story post for a launch.', 'GBP 80'],
              ['Video review', 'A creator visits, films, and shares feedback.', 'GBP 220'],
              ['Local live mention', 'A same-day promo during a live stream.', 'GBP 120'],
            ].map(([title, copy, price]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-black text-slate-950">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-black text-emerald-800">{price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
