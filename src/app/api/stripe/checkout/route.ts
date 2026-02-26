import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's household
    const { data: userData } = await supabase
      .from('users')
      .select('household_id, role')
      .eq('id', user.id)
      .single();
    
    if (!userData?.household_id) {
      return NextResponse.json({ error: 'No household found' }, { status: 400 });
    }
    
    const body = await request.json();
    const { amount, description, paymentType, youthMemberId } = body;
    
    // Validate amount
    const amountCents = Math.round(amount * 100); // Convert dollars to cents
    if (isNaN(amountCents) || amountCents < 50) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    
    const headers = request.headers;
    const protocol = headers.get('x-forwarded-proto') || 'http';
    const host = headers.get('host') || 'localhost:3000';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    
    const session = await createCheckoutSession({
      householdId: userData.household_id,
      youthMemberId,
      amount: amountCents,
      description: description || 'Pathfinder Payment',
      paymentType: paymentType || 'other',
      successUrl: `${baseUrl}/dashboard/finances?payment=success`,
      cancelUrl: `${baseUrl}/dashboard/finances?payment=cancelled`,
    });
    
    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });
    
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
}
