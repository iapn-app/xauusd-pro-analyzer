import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { STRIPE_PLANS } from '../../src/config/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, plan } = req.body;

    if (!email || !plan) {
      return res.status(400).json({ error: 'Email and plan are required' });
    }

    const priceId = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]?.priceId;

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const origin = req.headers.origin || process.env.APP_URL || 'https://ais-dev-rsk2mwkmqlqecr3dtwnddg-282592173187.us-east1.run.app';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/#checkout-success?plan=${plan}`,
      cancel_url: `${origin}/#checkout-cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}
