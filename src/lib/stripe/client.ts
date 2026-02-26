// Stripe client-side utilities

export interface CheckoutRequest {
  amount: number;
  description: string;
  paymentType: 'dues' | 'trip' | 'event' | 'other';
  youthMemberId?: string;
}

export interface CheckoutResponse {
  url: string;
  sessionId: string;
}

export async function createPayment(request: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Payment failed');
  }
  
  return response.json();
}

// Load Stripe.js for advanced features
export function loadStripe() {
  if (typeof window === 'undefined') return null;
  
  // In production with publishable key
  // return loadStripeWithSdk(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  
  return null;
}
