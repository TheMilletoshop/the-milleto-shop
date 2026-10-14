const CATALOG = {
  "cranberry-pistachio": { name: "Cranberry Pistachio", priceCents: 450 },
  "chocolate": { name: "Chocolate", priceCents: 450 },
  "coconut": { name: "Coconut", priceCents: 450 },
  "cashew-cardamom": { name: "Cashew Cardamom", priceCents: 450 }
};
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});
const safeText = (value, max) => typeof value === "string" ? value.trim().slice(0,max) : "";
export async function onRequestPost({request, env}) {
  if (!env.MOLLIE_API_KEY) return json({error:"Online checkout is not configured yet. Please try again later."},503);
  if (!env.DB) return json({error:"Order storage is not configured yet. Please try again later."},503);
  let body;
  try { body = await request.json(); } catch { return json({error:"Please check the order details and try again."},400); }
  const customer = body?.customer || {};
  const name = safeText(customer.name,100);
  const email = safeText(customer.email,150);
  const phone = safeText(customer.phone,40);
  const pickupPreference = safeText(customer.pickupPreference,120);
  const note = safeText(customer.note,500);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({error:"Enter your name and a valid email address."},400);
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 4) return json({error:"Your basket doesn't look right. Please refresh and try again."},400);
  let items = [], totalCents = 0;
  for (const item of body.items) {
    const product = CATALOG[item?.id];
    const quantity = Number(item?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 30) return json({error:"One of the basket items is invalid. Please refresh and try again."},400);
    items.push({id:item.id,name:product.name,quantity,unitPriceCents:product.priceCents,lineTotalCents:product.priceCents*quantity});
    totalCents += product.priceCents*quantity;
  }
  if (totalCents < 1 || totalCents > 50000) return json({error:"This basket total is outside the allowed range. Please contact The Milleto."},400);
  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`INSERT INTO orders (id, created_at, customer_name, customer_email, customer_phone, pickup_preference, customer_note, items_json, total_cents, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'creating')`)
      .bind(orderId,now,name,email,phone,pickupPreference,note,JSON.stringify(items),totalCents).run();
    const origin = new URL(request.url).origin;
    const amount = (totalCents/100).toFixed(2);
    const mollieResponse = await fetch("https://api.mollie.com/v2/payments", {
      method:"POST",
      headers:{"Authorization":`Bearer ${env.MOLLIE_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        amount:{currency:"EUR",value:amount},
        description:`The Milleto order ${orderId.slice(0,8)}`,
        redirectUrl:`${origin}/success.html?order=${encodeURIComponent(orderId)}`,
        webhookUrl:`${origin}/api/mollie-webhook`,
        method:"ideal",
        locale:"nl_NL",
        metadata:{orderId,items:items.map(i=>({name:i.name,quantity:i.quantity})),pickup:"Wageningen"}
      })
    });
    const payment = await mollieResponse.json();
    if (!mollieResponse.ok || !payment?._links?.checkout?.href || !payment?.id) {
      await env.DB.prepare("UPDATE orders SET payment_status='error' WHERE id=?").bind(orderId).run();
      return json({error:"The payment provider could not start checkout. Please try again in a moment."},502);
    }
    await env.DB.prepare("UPDATE orders SET payment_id=?, payment_status=? WHERE id=?").bind(payment.id,payment.status,orderId).run();
    return json({checkoutUrl:payment._links.checkout.href});
  } catch (error) {
    // Do not return internal error details or secrets to the browser.
    return json({error:"We couldn't prepare your order. Please try again, or contact The Milleto."},500);
  }
}
