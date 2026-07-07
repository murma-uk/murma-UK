import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UpvoteEmailRequest {
  userId: string;
  userEmail: string;
  isDigest?: boolean;
  digests?: Array<{
    requestId: string;
    title: string;
    location: string;
    upvoteCount: number;
  }>;
  requestId?: string;
  requestTitle?: string;
  requestLocation?: string;
  requestUrl?: string;
  upvoteCount?: number;
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
    const data = (await req.json()) as UpvoteEmailRequest;
    const { userId, userEmail, isDigest } = data;

    if (!userId || !userEmail) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const baseUrl = Deno.env.get("SITE_URL") || "https://murma.uk";

    let emailHtml: string;
    let subject: string;
    let requestId: string | null = null;

    if (isDigest && data.digests && data.digests.length > 0) {
      emailHtml = generateDigestEmail(data.digests, baseUrl);
      subject = data.digests.length === 1
        ? "Your request got traction — daily digest from Murma"
        : `${data.digests.length} of your requests got traction — daily digest from Murma`;
    } else if (data.requestId && data.requestTitle && data.requestUrl && data.upvoteCount) {
      emailHtml = generateSingleUpvoteEmail(
        data.requestTitle,
        data.requestLocation || "",
        data.requestUrl,
        data.upvoteCount,
        baseUrl
      );
      subject = "Your request got upvoted — daily digest from Murma";
      requestId = data.requestId;
    } else {
      return new Response(JSON.stringify({ error: "Missing email content data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Murma <notify@murma.uk>",
        to: userEmail,
        subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      console.error("Resend API error:", error);

      await supabase.from("email_log").insert({
        user_id: userId,
        email_type: isDigest ? "upvote_digest" : "upvote_digest",
        recipient_email: userEmail,
        request_id: requestId,
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
      email_type: "upvote_digest",
      recipient_email: userEmail,
      request_id: requestId,
      upvote_count: data.upvoteCount || (data.digests?.length || 0),
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

function generateSingleUpvoteEmail(
  title: string,
  location: string,
  requestUrl: string,
  upvoteCount: number,
  baseUrl: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <p class="eyebrow">People Care</p>
      <h1>Your request got upvoted</h1>
    </div>

    <div class="content">
      <p>Someone upvoted your request today.</p>

      <div class="accent-strip">
        <strong>${escapeHtml(title)}</strong><br>
        <span style="color: #93938c; font-size: 14px;">${escapeHtml(location)}</span>
      </div>

      <div class="stat-box">
        <div class="stat-value">${upvoteCount}</div>
        <div class="stat-label">Total Upvotes</div>
      </div>

      <div style="text-align: center;">
        <a href="${escapeHtml(requestUrl)}" class="cta-button">See Your Request</a>
      </div>

      <p style="font-size: 14px; color: #93938c; margin-top: 24px; border-top: 1px solid #e4e2dc; padding-top: 16px;">
        You receive a maximum of one notification email per day. <a href="${escapeHtml(baseUrl)}/settings" style="color: #256b47;">Manage your preferences</a>.
      </p>
    </div>

    <div class="footer">
      <p>© Murma | <a href="${escapeHtml(baseUrl)}/privacy">Privacy</a> | <a href="${escapeHtml(baseUrl)}/terms">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

function generateDigestEmail(
  digests: Array<{
    requestId: string;
    title: string;
    location: string;
    upvoteCount: number;
  }>,
  baseUrl: string
): string {
  const itemsHtml = digests
    .map(
      (d) => `
    <div class="accent-strip">
      <strong>${escapeHtml(d.title)}</strong><br>
      <span style="color: #93938c; font-size: 14px;">${escapeHtml(d.location)}</span>
      <div style="margin-top: 8px;">
        <div class="stat-value">${d.upvoteCount}</div>
        <div class="stat-label">upvotes today</div>
      </div>
    </div>
    <div style="text-align: center; margin-bottom: 16px;">
      <a href="${escapeHtml(baseUrl)}/request/${d.requestId}" style="color: #256b47; text-decoration: none; font-weight: 600;">View Request →</a>
    </div>
  `
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <p class="eyebrow">Daily Digest</p>
      <h1>Your requests got traction</h1>
    </div>

    <div class="content">
      <p>People continue to care about what you've requested. Here's today's activity:</p>

      ${itemsHtml}

      <p style="font-size: 14px; color: #93938c; margin-top: 24px; border-top: 1px solid #e4e2dc; padding-top: 16px;">
        You receive a maximum of one notification email per day. <a href="${escapeHtml(baseUrl)}/settings" style="color: #256b47;">Manage your preferences</a>.
      </p>
    </div>

    <div class="footer">
      <p>© Murma | <a href="${escapeHtml(baseUrl)}/privacy">Privacy</a> | <a href="${escapeHtml(baseUrl)}/terms">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

function getEmailStyles(): string {
  return `
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
    .accent-strip {
      border-left: 4px solid #256b47;
      padding-left: 16px;
      margin: 24px 0;
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .stat-box {
      background-color: #f6f5f3;
      border: 1px solid #e4e2dc;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #256b47;
    }
    .stat-label {
      font-family: 'DM Mono', monospace;
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #93938c;
      margin-top: 8px;
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
  `;
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
