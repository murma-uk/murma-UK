import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ModerationEmailRequest {
  userId: string;
  userEmail: string;
  requestId: string;
  requestTitle: string;
  requestUrl: string;
  action: "hidden" | "removed";
  reason?: string;
  note?: string;
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
    const data = (await req.json()) as ModerationEmailRequest;
    const { userId, userEmail, requestId, requestTitle, requestUrl, action, reason, note } = data;

    if (!userId || !userEmail || !requestId || !requestTitle || !requestUrl || !action) {
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

    const isRemoved = action === "removed";
    const subject = isRemoved
      ? "Your Murma request has been removed"
      : "Your Murma request is pending review";

    const emailHtml = generateModerationEmail(
      requestTitle,
      requestUrl,
      action,
      reason,
      note,
      baseUrl
    );

    // Send via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Murma <moderation@murma.uk>",
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
        email_type: "moderation_alert",
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
      email_type: "moderation_alert",
      recipient_email: userEmail,
      request_id: requestId,
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

function generateModerationEmail(
  title: string,
  requestUrl: string,
  action: "hidden" | "removed",
  reason: string | undefined,
  note: string | undefined,
  baseUrl: string
): string {
  const isRemoved = action === "removed";
  const pageTitle = isRemoved ? "Request Removed" : "Request Hidden for Review";
  const eyebrow = isRemoved ? "Action Taken" : "Pending Review";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="email-container">
    <div class="header" style="border-bottom-color: #c06a44;">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${pageTitle}</h1>
    </div>

    <div class="content">
      <p>Your request has been ${isRemoved ? "removed" : "hidden pending review"} by our moderation team.</p>

      <div class="accent-strip demand">
        <strong>${escapeHtml(title)}</strong>
      </div>

      ${reason ? `
        <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      ` : ""}

      ${note ? `
        <p><strong>Details:</strong> ${escapeHtml(note)}</p>
      ` : ""}

      ${!isRemoved
        ? `
        <p style="margin-top: 16px;">Your request is temporarily hidden while we review it. You can:</p>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li>Edit your request to address the concern</li>
          <li>Submit it again, which clears it for re-review</li>
        </ul>

        <div style="text-align: center;">
          <a href="${escapeHtml(requestUrl)}" class="cta-button">Edit Request</a>
        </div>
      `
        : ""
      }

      <p style="font-size: 14px; color: #93938c; margin-top: 24px;">
        If you think this was a mistake, please <a href="${escapeHtml(baseUrl)}/contact" style="color: #256b47;">contact us</a>.
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
    .accent-strip.demand {
      border-left-color: #c06a44;
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
      margin: 12px 0;
      padding-left: 20px;
    }
    li {
      margin: 6px 0;
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
