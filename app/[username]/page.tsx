'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../utils/supabase';
import { useParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function ProfileContent() {
  const routeParams = useParams();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [proposalDetails, setProposalDetails] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchProfileAndSlots = async () => {
      const usernameParam = routeParams?.username;

      if (!usernameParam) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', (usernameParam as string).toLowerCase())
        .single();

      if (profileData) {
        setCreator({
          id: profileData.id,
          displayName: profileData.display_name,
          username: profileData.username,
          bio: profileData.bio,
          city: profileData.city,
        });

        const { data: slotsData } = await supabase
          .from('slots')
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: true });

        if (slotsData) {
          setSlots(slotsData);
        }
      }
      setLoading(false);
    };

    fetchProfileAndSlots();
  }, [routeParams]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator || !selectedSlot) return;
    setSubmittingLead(true);

    const { error } = await supabase.from('bookings').insert({
      creator_id: creator.id,
      slot_id: selectedSlot.id,
      business_name: businessName,
      business_email: businessEmail,
      proposal_details: proposalDetails,
    });

    setSubmittingLead(false);
    if (error) {
      alert(error.message);
    } else {
      setBookingSuccess(true);
      setBusinessName('');
      setBusinessEmail('');
      setProposalDetails('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <p className="font-medium animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <p className="font-medium">No creator profile found at this handle.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600"></div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-16 pb-24">
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{creator.displayName}</h1>
              <p className="text-violet-600 font-medium mt-0.5">@{creator.username}</p>
              <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600 mt-3">
                📍 {creator.city}
              </div>
            </div>
          </div>
          <hr className="my-6 border-slate-100" />
          <p className="text-slate-600 leading-relaxed">{creator.bio}</p>
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Available Sponsorships</h2>
        
        {slots.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm shadow-sm">
            This creator hasn't listed any sponsorship offerings yet. Check back soon!
          </div>
        ) : (
          <div className="space-y-4">
            {slots.map((slot: any) => (
              <div key={slot.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{slot.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{slot.description}</p>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-4">
                  <span className="text-2xl font-black text-slate-900">£{slot.price}</span>
                  <button 
                    onClick={() => { setSelectedSlot(slot); setBookingSuccess(false); }}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm transition"
                  >
                    Book Slot
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 relative">
            <button 
              onClick={() => setSelectedSlot(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-medium"
            >
              ✕
            </button>

            {!bookingSuccess ? (
              <>
                <div className="mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md">
                    Booking Request
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-2">{selectedSlot.title}</h3>
                  <p className="text-sm text-slate-500 font-semibold mt-0.5">Price: £{selectedSlot.price}</p>
                </div>

                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Business Name</label>
                    <input type="text" required placeholder="e.g. Local Pizzeria" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Contact Email</label>
                    <input type="email" required placeholder="marketing@business.co.uk" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Campaign Goals & Details</label>
                    <textarea rows={3} required placeholder="Tell the creator what you want to promote..." value={proposalDetails} onChange={(e) => setProposalDetails(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <button type="submit" disabled={submittingLead} className="w-full bg-violet-600 text-white font-bold text-sm py-3 rounded-xl shadow-sm hover:bg-violet-700 transition disabled:opacity-50">
                    {submittingLead ? 'Sending Request...' : 'Submit Proposal'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl">🎉</div>
                <h3 className="text-xl font-extrabold text-slate-900">Proposal Submitted!</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Your details have been passed straight onto <strong>@{creator?.username}</strong>.
                </p>
                <button 
                  onClick={() => setSelectedSlot(null)}
                  className="mt-4 bg-slate-900 text-white font-semibold text-sm px-6 py-2 rounded-xl hover:bg-slate-800"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <p className="font-medium animate-pulse">Loading layout components...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}