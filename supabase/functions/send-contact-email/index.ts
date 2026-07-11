import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
const fromEmail = Deno.env.get("FROM_EMAIL") || "Ahia <care@ahia-shop.com>";
const adminEmail = Deno.env.get("ADMIN_EMAIL")!;

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

  if (!adminEmail) {
    console.error("Missing ADMIN_EMAIL");
    return new Response(JSON.stringify({ error: "Missing Admin Email configuration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { first_name, last_name, email, order_number, message } = await req.json();

    if (!first_name || !last_name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required contact form fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const subject = `✉️ New Contact Form Message - ${first_name} ${last_name}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Message</title>
      </head>
      <body style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="font-weight: 300; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">New Customer Inquiry</h2>
        <p>From: <strong>${first_name} ${last_name}</strong> (<a href="mailto:${email}">${email}</a>)</p>
        ${order_number ? `<p>Associated Order Number: <strong>${order_number}</strong></p>` : ""}
        <br/>
        <div style="background-color: #f9f9f9; border-left: 4px solid #1a1a1a; padding: 15px; font-style: italic;">
          "${message.replace(/\n/g, "<br/>")}"
        </div>
      </body>
      </html>
    `;

    // Send email to Admin via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: adminEmail,
        subject: subject,
        html: htmlContent,
        replyTo: email, // Set Reply-To as the customer's email so the admin can reply directly!
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
    return new Response(JSON.stringify({ success: true, messageId: resData.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Error in send-contact-email function:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
