import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, userName } = (await req.json()) as WelcomeEmailRequest;

    if (!userId || !userEmail || !userName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get site URL from environment or use murma.uk
    const baseUrl = Deno.env.get("SITE_URL") || "https://murma.uk";

    const emailHtml = generateWelcomeEmail(userName, baseUrl);

    // Send via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Murma <welcome@murma.uk>",
        to: userEmail,
        subject: "Welcome to Murma — Your voice matters",
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Resend API error:", error);

      // Log failed email
      await supabase.from("email_log").insert({
        user_id: userId,
        email_type: "welcome",
        recipient_email: userEmail,
        status: "failed",
        error_message: `Resend API error: ${error}`,
      });

      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailData = await emailResponse.json();

    // Log sent email
    await supabase.from("email_log").insert({
      user_id: userId,
      email_type: "welcome",
      recipient_email: userEmail,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, messageId: emailData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateWelcomeEmail(userName: string, baseUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Bricolage Grotesque', system-ui, sans-serif;
      background-color: #f6f5f3;
      color: #191a1c;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e4e2dc;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(90deg, transparent 0%, rgba(37,107,71,0.2) 18%, #256b47 50%, rgba(37,107,71,0.2) 82%, transparent 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 2px solid #256b47;
    }
    .eyebrow {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #93938c;
      margin: 0;
    }
    h1 {
      font-size: 24px;
      line-height: 1.2;
      margin: 16px 0 0 0;
      color: #191a1c;
      font-weight: 600;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
    }
    .content p {
      margin: 0 0 16px 0;
      color: #191a1c;
    }
    .cta-button {
      display: inline-block;
      background-color: #256b47;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 16px 0;
      box-shadow: 0 1px 2px rgba(37,107,71,0.18);
    }
    .cta-button:hover {
      background-color: #1f5838;
      box-shadow: 0 6px 18px rgba(37,107,71,0.24);
    }
    .footer {
      background-color: #f6f5f3;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e4e2dc;
      font-size: 12px;
      color: #93938c;
    }
    .footer a {
      color: #256b47;
      text-decoration: none;
    }
    ul {
      margin: 16px 0;
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <p class="eyebrow">Welcome to Murma</p>
      <h1>Your voice matters</h1>
    </div>

    <div class="content">
      <p>Hi ${escapeHtml(userName)},</p>

      <p>Thanks for joining Murma, the community demand-signaling platform. You can now:</p>

      <ul>
        <li>Request new services, branches, or venues in your town</li>
        <li>Upvote what matters to you and see what others care about</li>
        <li>Help shape better decisions by councils and businesses</li>
      </ul>

      <div style="text-align: center;">
        <a href="${escapeHtml(baseUrl)}" class="cta-button">Get Started</a>
      </div>

      <p style="margin-top: 24px;">Ready to make a difference? Head to Murma and add your first request or upvote an existing one.</p>
    </div>

    <div class="footer">
      <p>© Murma | <a href="${escapeHtml(baseUrl)}/privacy">Privacy</a> | <a href="${escapeHtml(baseUrl)}/terms">Terms</a></p>
      <p><a href="${escapeHtml(baseUrl)}/settings">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
