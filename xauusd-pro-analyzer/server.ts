import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseServiceKey) {
  console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is not set. Webhook updates to Supabase will fail due to RLS.");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STRIPE_PLANS = {
  pro: {
    priceId: "price_1TCmJ13TRPJOmdRRIolxuXyi"
  },
  premium: {
    priceId: "price_1TCmJU3TRPJOmdRRKAKPcWd8"
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe webhook needs raw body
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;

      try {
        if (!sig || !webhookSecret) {
          throw new Error("Missing stripe signature or webhook secret");
        }
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_email || session.customer_details?.email;
        
        if (email) {
          // Find the plan based on priceId
          let plan = "free";
          
          // We need to get the line items to find the price ID
          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const priceId = lineItems.data[0]?.price?.id;
            
            if (priceId === STRIPE_PLANS.pro.priceId) {
              plan = "pro";
            } else if (priceId === STRIPE_PLANS.premium.priceId) {
              plan = "premium";
            }

            if (plan !== "free") {
              const { error } = await supabase
                .from("user_profiles")
                .update({
                  plan: plan,
                  subscription_status: "active",
                  subscription_plan: plan,
                  stripe_customer_id: session.customer as string,
                  stripe_subscription_id: session.subscription as string,
                })
                .eq("email", email.toLowerCase());

              if (error) {
                console.error("Error updating user profile:", error);
              } else {
                console.log(`Successfully updated user ${email} to plan ${plan}`);
              }
            }
          } catch (err) {
            console.error("Error processing line items:", err);
          }
        }
      }

      res.json({ received: true });
    }
  );

  // Regular JSON parsing for other routes
  app.use(express.json());

  app.post("/api/stripe/create-checkout-session", async (req, res) => {
    try {
      const { email, plan } = req.body;

      if (!email || !plan) {
        return res.status(400).json({ error: "Email and plan are required" });
      }

      const priceId = STRIPE_PLANS[plan as keyof typeof STRIPE_PLANS]?.priceId;

      if (!priceId) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const origin = req.headers.origin || process.env.APP_URL || "https://ais-dev-rsk2mwkmqlqecr3dtwnddg-282592173187.us-east1.run.app";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
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

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
