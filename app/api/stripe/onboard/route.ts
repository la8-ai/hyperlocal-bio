import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe. 
// Ensure STRIPE_SECRET_KEY is in your Vercel Environment Variables.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

export async function POST(req: Request) {
  try {
    // 1. Validate that the base URL is set
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_BASE_URL is not configured' },
        { status: 500 }
      );
    }

    // 2. Create a connected account
    const account = await stripe.accounts.create({ 
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // 3. Create the onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
    
  } catch (error: any) {
    console.error('Stripe Onboarding Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}