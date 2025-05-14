// actions/stripe.ts
import Stripe from 'stripe';

// Create a Stripe instance with your secret key
// Use environment variable for security
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16', // Use a consistent API version
});

// Create a Checkout Session
export async function createCheckoutSession({
  userId,
  plan,
  returnUrl,
}: {
  userId: string;
  plan: string;
  returnUrl: string;
}) {
  // Map your plan names to Stripe price IDs
  // These IDs should be created in your Stripe dashboard
  const PRICE_IDS: { [key: string]: string } = {
    PRO: process.env.STRIPE_PRICE_ID_PRO!,
    BUSINESS: process.env.STRIPE_PRICE_ID_BUSINESS!,
  };
  const priceId = PRICE_IDS[plan];
  
  if (!priceId) {
    throw new Error(`Invalid plan: ${plan}`);
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    client_reference_id: userId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: {
      userId,
      plan,
    },
  });

  return { sessionId: session.id, url: session.url };
}

// Verify a Stripe webhook event
export async function verifyStripeWebhookEvent(
  rawBody: string,
  signature: string,
  webhookSecret: string
) {
  try {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err);
    throw new Error('Invalid signature');
  }
}

// Verify a checkout session
export async function verifyCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("Failed to verify checkout session:", error);
    throw new Error("Invalid session");
  }
}