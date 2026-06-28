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
  console.log('[confirm-order-payment] userId:', userId);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const { orderId, paymentIntentId } = await req.json();
  console.log('[confirm-order-payment] orderId:', orderId, 'paymentIntentId:', paymentIntentId);

  // Verify with Stripe that the payment actually succeeded.
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  console.log('[confirm-order-payment] Stripe status:', paymentIntent.status);

  if (paymentIntent.status !== 'succeeded') {
    return json({ error: 'Payment not completed', stripeStatus: paymentIntent.status }, 400);
  }

  // Update payment_status via SECURITY DEFINER function (also checks ownership + intent match).
  const { data: confirmed, error: rpcError } = await client.database.rpc(
    'confirm_order_payment',
    { p_order_id: orderId, p_payment_intent_id: paymentIntentId }
  );

  console.log('[confirm-order-payment] rpc result:', { confirmed, rpcError });

  if (rpcError) return json({ error: rpcError.message }, 400);

  // PostgREST returns the boolean directly; treat any truthy value as success.
  const success = confirmed === true || confirmed === 'true' || confirmed === 1;
  return json({ success });
}
