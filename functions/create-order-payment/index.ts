import { createClient } from 'npm:@insforge/sdk';
import Stripe from 'npm:stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const userToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;
  if (!userToken) return json({ error: 'Unauthorized' }, 401);

  const client = createClient({
    baseUrl: Deno.env.get('INSFORGE_BASE_URL')!,
    anonKey: Deno.env.get('ANON_KEY')!,
    edgeFunctionToken: userToken,
  });

  const { data: authData } = await client.auth.getCurrentUser();
  const userId = authData?.user?.id;
  console.log('[create-order-payment] userId:', userId);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const { restaurantId, items, subtotal, deliveryFee, serviceFee, total, deliveryAddress } =
    await req.json();
  console.log('[create-order-payment] payload:', { restaurantId, total });

  // Step 1: Create Stripe PaymentIntent FIRST so we have the ID before inserting.
  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { userId },
    });
    console.log('[create-order-payment] PaymentIntent created:', paymentIntent.id);
  } catch (err: any) {
    console.error('[create-order-payment] Stripe error:', err.message);
    return json({ error: 'Failed to create payment intent: ' + err.message }, 500);
  }

  // Step 2: Insert order with stripe_payment_intent_id already set — no separate UPDATE needed.
  const { data: orderRows, error: orderError } = await client.database
    .from('orders')
    .insert([
      {
        customer_id: userId,
        restaurant_id: restaurantId,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        total,
        delivery_address: deliveryAddress,
        payment_status: 'unconfirmed',
        order_status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
      },
    ])
    .select();

  console.log('[create-order-payment] insert result:', { orderRows, orderError });

  if (orderError || !orderRows?.[0]?.id) {
    return json({ error: orderError?.message ?? 'Failed to create order' }, 400);
  }

  const orderId: string = orderRows[0].id;
  console.log('[create-order-payment] order created:', orderId);

  return json({
    orderId,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  });
}
