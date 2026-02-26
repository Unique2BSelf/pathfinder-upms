import Stripe from 'stripe';

// Stripe server-side SDK
// Initialize with API key from config (to be added by admin)

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    // In production, fetch keys from stripe_config table
    // For now, throw if not configured
    const apiKey = process.env.STRIPE_SECRET_KEY;
    
    if (!apiKey) {
      throw new Error('Stripe not configured. Add your API keys in Admin Settings.');
    }
    
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }
  
  return stripeInstance;
}

// Create a checkout session for payment
export async function createCheckoutSession(params: {
  householdId: string;
  youthMemberId?: string;
  amount: number; // in cents
  description: string;
  paymentType: 'dues' | 'trip' | 'event' | 'other';
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  
  // In production: look up or create Stripe customer
  // const customerId = await getOrCreateCustomer(householdId);
  
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: params.description,
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      household_id: params.householdId,
      youth_member_id: params.youthMemberId || '',
      payment_type: params.paymentType,
    },
  });
  
  return session;
}

// Create payment link (simpler for one-time payments)
export async function createPaymentLink(params: {
  name: string;
  amount: number; // in dollars
  description?: string;
}) {
  const stripe = getStripe();
  
  const product = await stripe.products.create({
    name: params.name,
    description: params.description,
  });
  
  const price = await stripe.prices.create({
    unit_amount: Math.round(params.amount * 100),
    currency: 'usd',
    product: product.id,
  });
  
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      payment_type: params.description?.toLowerCase().includes('dues') ? 'dues' : 'other',
    },
  });
  
  return paymentLink;
}

// Webhook handler helpers
export function constructWebhookEvent(payload: string | Buffer, signature: string) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Webhook secret not configured');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
