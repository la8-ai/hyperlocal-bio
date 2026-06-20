import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to create checkout session.';
}

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not configured.' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
    });

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required for server-side checkout lookup.' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.headers.get('origin');
    if (!baseUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_BASE_URL is not configured.' }, { status: 500 });
    }

    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId.' }, { status: 400 });
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, business_email, status, slots ( title, description, price, profiles ( stripe_account_id ) )')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }

    if (booking.status !== 'accepted') {
      return NextResponse.json({ error: 'The creator must accept this request before payment.' }, { status: 400 });
    }

    const slot = Array.isArray(booking.slots) ? booking.slots[0] : booking.slots;
    const creatorProfile = Array.isArray(slot?.profiles) ? slot?.profiles[0] : slot?.profiles;
    const price = Number(slot?.price || 0);
    if (!slot || price <= 0) {
      return NextResponse.json({ error: 'Offer price is invalid.' }, { status: 400 });
    }

    const destination = creatorProfile?.stripe_account_id;
    const paymentIntentData = destination
      ? {
          application_fee_amount: Math.round(price * 100 * 0.1),
          transfer_data: { destination },
        }
      : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: booking.business_email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: slot.title || 'Creator offer',
              description: slot.description || undefined,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: paymentIntentData,
      metadata: { booking_id: booking.id },
      success_url: `${baseUrl}/checkout/success?booking=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/settings`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
