import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const fromEmail = Deno.env.get("FROM_EMAIL") || "Ahia <orders@ahia-shop.com>";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!resendApiKey) {
    console.error("Missing RESEND_API_KEY");
    return new Response(JSON.stringify({ error: "Missing Resend API Key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { order_id, type } = await req.json();

    if (!order_id || !type) {
      return new Response(JSON.stringify({ error: "Missing order_id or type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    if (itemsError) {
      console.error("Order items not found:", itemsError);
      return new Response(JSON.stringify({ error: "Order items fetch failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Populate item names/SKUs from variants & products
    const populatedItems = await Promise.all(
      (items || []).map(async (item) => {
        if (!item.variant_id) {
          return { ...item, product_name: "Product", sku: "N/A" };
        }

        const { data: variantData } = await supabase
          .from("product_variants")
          .select("product_id, sku")
          .eq("id", item.variant_id)
          .single();

        if (variantData) {
          const { data: productData } = await supabase
            .from("products")
            .select("name")
            .eq("id", variantData.product_id)
            .single();

          return {
            ...item,
            product_name: productData?.name || "Product",
            sku: variantData.sku || "N/A",
          };
        }

        return { ...item, product_name: "Product Variant", sku: "N/A" };
      })
    );

    // 3. Construct HTML email body based on status/type
    let subject = "";
    let previewText = "";
    let headline = "";
    let leadParagraph = "";

    const orderRef = order.id.substring(0, 8).toUpperCase();

    if (type === "confirmation" || type === "paid") {
      subject = `Order Confirmed - #${orderRef}`;
      previewText = "Thank you for your order! We have confirmed your payment.";
      headline = "Thank You for Your Order";
      leadParagraph = `We've confirmed your payment for order <strong>#${orderRef}</strong>. Our team is now preparing your items for shipment. You will receive another notification with tracking details as soon as it departs our warehouse.`;
    } else if (type === "shipped") {
      subject = `Your Order has Shipped! - #${orderRef}`;
      previewText = "Great news! Your order is on its way.";
      headline = "Your Order is on its Way";
      leadParagraph = `Your order <strong>#${orderRef}</strong> has been shipped! It is on its way to your destination via ${order.shipping_option}.`;
    } else if (type === "delivered") {
      subject = `Delivered: Order #${orderRef}`;
      previewText = "Your package has been successfully delivered.";
      headline = "Order Delivered";
      leadParagraph = `Your package for order <strong>#${orderRef}</strong> was successfully delivered. We hope you enjoy your new pieces! Thank you for shopping with Ahia.`;
    } else if (type === "cancelled") {
      subject = `Order Cancelled - #${orderRef}`;
      previewText = "Your order has been cancelled.";
      headline = "Order Cancelled";
      leadParagraph = `Your order <strong>#${orderRef}</strong> has been cancelled. If you believe this was in error, or if you require assistance, please contact our support team immediately.`;
    } else {
      // fallback
      subject = `Update on Order #${orderRef}`;
      previewText = `Your order status is now ${type}.`;
      headline = `Order Status: ${type.toUpperCase()}`;
      leadParagraph = `This is a quick update regarding your order <strong>#${orderRef}</strong>. The fulfillment status is currently: <strong>${type}</strong>.`;
    }

    // Generate table rows for items
    const itemsTableRows = populatedItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; font-weight: 300; color: #1a1a1a;">
          ${item.product_name}<br/>
          <span style="font-size: 11px; color: #999999; font-family: monospace;">SKU: ${item.sku}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; font-weight: 300; color: #1a1a1a; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; font-weight: 300; color: #1a1a1a; text-align: right;">
          €${Number(item.price).toFixed(2)}
        </td>
      </tr>
    `
      )
      .join("");

    const discountRow =
      order.discount_amount > 0
        ? `
      <tr>
        <td colspan="2" style="padding: 6px 0; font-size: 13px; font-weight: 300; color: #10b981;">Discount:</td>
        <td style="padding: 6px 0; font-size: 13px; font-weight: 300; color: #10b981; text-align: right;">-€${Number(
          order.discount_amount
        ).toFixed(2)}</td>
      </tr>
    `
        : "";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #fcfcfc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fcfcfc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #eaeaea; max-width: 600px; width: 100%;">
                
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 40px 20px 40px;">
                    <img src="https://koohstccatsndjikozyz.supabase.co/storage/v1/object/public/assets/ahia-logo.png" alt="Ahia" style="height: 24px; width: auto; display: block;" onerror="this.style.display='none';">
                    <!-- Text fallback logo if image fails -->
                    <span style="font-size: 20px; font-weight: 200; tracking-wider: 0.1em; text-transform: uppercase; color: #1a1a1a; letter-spacing: 4px;">AHIA</span>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h1 style="font-size: 22px; font-weight: 300; color: #1a1a1a; margin-top: 0; margin-bottom: 16px; text-align: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px;">
                      ${headline}
                    </h1>
                    <p style="font-size: 14px; font-weight: 300; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px; margin-top: 0;">
                      Dear ${order.first_name},
                    </p>
                    <p style="font-size: 14px; font-weight: 300; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px; margin-top: 0;">
                      ${leadParagraph}
                    </p>

                    <!-- Order Summary -->
                    <h2 style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #999999; margin-bottom: 12px;">Order Summary</h2>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                      <thead>
                        <tr>
                          <th align="left" style="padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #999999;">Item</th>
                          <th align="center" style="padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #999999; width: 60px;">Qty</th>
                          <th align="right" style="padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #999999; width: 80px;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsTableRows}
                        <tr>
                          <td colspan="2" style="padding: 12px 0 6px 0; font-size: 13px; font-weight: 300; color: #666666;">Subtotal:</td>
                          <td style="padding: 12px 0 6px 0; font-size: 13px; font-weight: 300; color: #1a1a1a; text-align: right;">€${Number(
                            order.subtotal
                          ).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding: 6px 0; font-size: 13px; font-weight: 300; color: #666666;">Shipping (${
                            order.shipping_option
                          }):</td>
                          <td style="padding: 6px 0; font-size: 13px; font-weight: 300; color: #1a1a1a; text-align: right;">€${Number(
                            order.shipping_cost
                          ).toFixed(2)}</td>
                        </tr>
                        ${discountRow}
                        <tr>
                          <td colspan="2" style="padding: 12px 0; border-top: 1px solid #1a1a1a; font-size: 14px; font-weight: 600; color: #1a1a1a;">Total:</td>
                          <td style="padding: 12px 0; border-top: 1px solid #1a1a1a; font-size: 14px; font-weight: 600; color: #1a1a1a; text-align: right;">€${Number(
                            order.total
                          ).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Delivery & Shipping details -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #eeeeee; padding: 20px; margin-bottom: 30px;">
                      <tr>
                        <td width="50%" valign="top" style="padding-right: 10px;">
                          <h3 style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #999999; margin-top: 0; margin-bottom: 8px;">Shipping Address</h3>
                          <p style="font-size: 12px; font-weight: 300; line-height: 1.5; color: #4a4a4a; margin: 0;">
                            ${order.first_name} ${order.last_name}<br/>
                            ${order.shipping_address}<br/>
                            ${order.shipping_city}, ${order.shipping_postal_code}<br/>
                            ${order.shipping_country}
                          </p>
                        </td>
                        <td width="50%" valign="top" style="padding-left: 10px; border-left: 1px solid #eeeeee;">
                          <h3 style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #999999; margin-top: 0; margin-bottom: 8px;">Customer Contact</h3>
                          <p style="font-size: 12px; font-weight: 300; line-height: 1.5; color: #4a4a4a; margin: 0;">
                            Email: ${order.email}<br/>
                            Phone: ${order.phone}
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size: 12px; font-weight: 300; line-height: 1.5; color: #999999; text-align: center; margin-top: 40px; margin-bottom: 0;">
                      Need help? Reply directly to this email or visit our <a href="https://ahia-shop.com/about/customer-care" style="color: #1a1a1a; text-decoration: underline;">Customer Care</a> page.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td align="center" style="background-color: #1a1a1a; padding: 30px; font-size: 11px; font-weight: 300; color: #999999; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">AHIA</p>
                    <p style="margin: 0;">© ${new Date().getFullYear()} Ahia E-Commerce. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 4. Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: order.email,
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const resText = await res.text();
      console.error("Failed to send email via Resend:", resText);
      return new Response(JSON.stringify({ error: "Failed to send email via Resend", details: resText }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const resData = await res.json();

    // 5. Send new-order alert to admin if configured
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    if (adminEmail && (type === "confirmation" || type === "paid")) {
      const adminSubject = `🚨 New Order Received - #${orderRef}`;
      const adminHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${adminSubject}</title>
        </head>
        <body style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="font-weight: 300; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">New Order Placed & Paid!</h2>
          <p>Order Reference: <strong>#${orderRef}</strong></p>
          <p>Customer: <strong>${order.first_name} ${order.last_name}</strong> (${order.email})</p>
          <p>Phone: <strong>${order.phone}</strong></p>
          <p>Total: <strong>€${Number(order.total).toFixed(2)}</strong></p>
          <p>Shipping Option: <strong>${order.shipping_option}</strong></p>
          <p>Shipping Address: <strong>${order.shipping_address}, ${order.shipping_city}, ${order.shipping_postal_code}, ${order.shipping_country}</strong></p>
          <br/>
          <a href="${req.headers.get("origin") || "https://ahia-shop.com"}/admin" style="display: inline-block; background-color: #1a1a1a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 14px;">View in Admin Panel</a>
        </body>
        </html>
      `;

      try {
        const adminRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: fromEmail,
            to: adminEmail,
            subject: adminSubject,
            html: adminHtmlContent,
          }),
        });

        if (!adminRes.ok) {
          console.error("Failed to send admin email alert:", await adminRes.text());
        } else {
          console.log(`Admin order alert sent to ${adminEmail}`);
        }
      } catch (err) {
        console.error("Error sending admin alert email:", err);
      }
    }

    return new Response(JSON.stringify({ success: true, messageId: resData.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Error in send-order-email function:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
