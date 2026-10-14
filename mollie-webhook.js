const textResponse = (text, status=200) => new Response(text,{status,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});
export async function onRequestPost({request,env}) {
  if (!env.MOLLIE_API_KEY || !env.DB) return textResponse("Not configured",503);
  const form = await request.formData();
  const paymentId = form.get("id");
  if (typeof paymentId !== "string" || !/^tr_[A-Za-z0-9]+$/.test(paymentId)) return textResponse("Missing payment ID",400);
  try {
    const response = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`,{
      headers:{"Authorization":`Bearer ${env.MOLLIE_API_KEY}`}
    });
    if (!response.ok) return textResponse("Could not verify payment",502);
    const payment = await response.json();
    const orderId = payment?.metadata?.orderId;
    if (!orderId || typeof orderId !== "string") return textResponse("Order not found",404);
    const order = await env.DB.prepare("SELECT id, total_cents FROM orders WHERE id=? AND payment_id=?").bind(orderId,paymentId).first();
    if (!order) return textResponse("Order not found",404);
    // Always trust the status fetched directly from Mollie, never webhook form fields.
    if (payment.amount?.currency !== "EUR" || Number(payment.amount?.value) !== Number(order.total_cents/100)) {
      return textResponse("Payment amount mismatch",400);
    }
    await env.DB.prepare("UPDATE orders SET payment_status=?, updated_at=? WHERE id=?").bind(payment.status,new Date().toISOString(),orderId).run();
    return textResponse("OK");
  } catch {
    return textResponse("Webhook processing failed",500);
  }
}
