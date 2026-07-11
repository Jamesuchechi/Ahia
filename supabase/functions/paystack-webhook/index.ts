import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")!;

const textEncoder = new TextEncoder();

const createHmacSha512 = async (payload: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const timingSafeEqual = (left: string, right: string): boolean => {
  const l = textEncoder.encode(left);
  const r = textEncoder.encode(right);
  if (l.byteLength !== r.byteLength) return false;
  let result = 0;
  for (let i = 0; i < l.byteLength; i++) result |= l[i] ^ r[i];
  return result === 0;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase server configuration", { status: 500 });
  }

  if (!paystackSecret) {
    return new Response("Missing Paystack secret configuration", { status: 500 });
  }

  const signature = req.headers.get("x-paystack-signature");
  const payload = await req.text();

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const expectedSignature = await createHmacSha512(payload, paystackSecret);
  if (!timingSafeEqual(signature, expectedSignature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const status = (event?.data as Record<string, unknown>)?.status;
  const orderId = ((event?.data as Record<string, unknown>)?.metadata as Record<string, unknown>)?.order_id as string | undefined;

  if (!orderId) {
    return new Response("Missing order_id in metadata", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (status === "success") {
    const { data: existingOrder, error: lookupError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (lookupError) {
      console.error("Failed to fetch order:", lookupError);
      return new Response("Failed to fetch order", { status: 500 });
    }

    if (!existingOrder) {
      return new Response("Order not found", { status: 404 });
    }

    // Idempotent — skip if already marked paid
    if (existingOrder.status !== "paid") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order status:", updateError);
        return new Response("Failed to update order", { status: 500 });
      }

      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          status: "paid",
          notes: `Payment confirmed via Paystack webhook (${event.event ?? "charge.success"}).`,
        });

      if (historyError) {
        console.error("Failed to record status history:", historyError);
        return new Response("Failed to record status history", { status: 500 });
      }

      console.log(`Order ${orderId} marked as paid.`);

      // Trigger order confirmation email
      try {
        const emailUrl = `${supabaseUrl}/functions/v1/send-order-email`;
        const emailRes = await fetch(emailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRoleKey}`
          },
          body: JSON.stringify({
            order_id: orderId,
            type: "confirmation"
          })
        });
        if (!emailRes.ok) {
          console.error("Failed to trigger order confirmation email:", await emailRes.text());
        } else {
          console.log(`Order confirmation email triggered for order ${orderId}`);
        }
      } catch (emailErr) {
        console.error("Error triggering order confirmation email:", emailErr);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
