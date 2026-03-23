import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { STRIPE_PLANS } from '../../src/config/stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseServiceKey) {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Webhook updates to Supabase will fail due to RLS.");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// We need the raw body for Stripe webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let body: Buffer[] = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(body));
    });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!sig || !webhookSecret) {
      throw new Error('Missing stripe signature or webhook secret');
    }
    
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email || session.customer_details?.email;
    
    if (email) {
      let plan = 'free';
      
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        
        if (priceId === STRIPE_PLANS.pro.priceId) {
          plan = 'pro';
        } else if (priceId === STRIPE_PLANS.premium.priceId) {
          plan = 'premium';
        }

        if (plan !== 'free') {
          const { error } = await supabase
            .from('user_profiles')
            .update({
              plan: plan,
              subscription_status: 'active',
              subscription_plan: plan,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('email', email.toLowerCase());

          if (error) {
            console.error('Error updating user profile:', error);
          } else {
            console.log(`Successfully updated user ${email} to plan ${plan}`);
          }
        }
      } catch (err) {
        console.error('Error processing line items:', err);
      }
    }
  }

  res.json({ received: true });
}
