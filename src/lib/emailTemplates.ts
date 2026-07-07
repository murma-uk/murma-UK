/**
 * Email template utilities for Murma notifications.
 * Applies the "quiet civic" design system to email communications.
 */

const MURMA_COLORS = {
  primary: "#256b47",      // Signal green
  accent: "#c06a44",       // Demand orange
  ink: "#191a1c",          // Text color
  background: "#f6f5f3",   // Off-white
  surface: "#ffffff",      // White
  border: "#e4e2dc",       // Hairline
  textMuted: "#93938c",    // Low-emphasis text
};

const MURMA_FONTS = {
  body: "'Bricolage Grotesque', system-ui, sans-serif",
  mono: "'DM Mono', 'IBM Plex Mono', monospace",
};

interface EmailTemplateProps {
  baseUrl: string;
  userName?: string;
  userEmail?: string;
}

interface WelcomeEmailProps extends EmailTemplateProps {
  userName: string;
}

interface RequestConfirmationProps extends EmailTemplateProps {
  requestTitle: string;
  requestLocation: string;
  requestUrl: string;
  category: string;
}

interface UpvoteNotificationProps extends EmailTemplateProps {
  requestTitle: string;
  requestLocation: string;
  requestUrl: string;
  upvoteCount: number;
  isDigest?: boolean;
  digests?: Array<{
    title: string;
    location: string;
    url: string;
    count: number;
  }>;
}

interface ModerationAlertProps extends EmailTemplateProps {
  requestTitle: string;
  requestUrl: string;
  action: "hidden" | "removed";
  reason?: string;
  note?: string;
}

const baseEmailStyle = `
  body {
    font-family: ${MURMA_FONTS.body};
    background-color: ${MURMA_COLORS.background};
    color: ${MURMA_COLORS.ink};
    margin: 0;
    padding: 0;
  }
  .email-container {
    max-width: 600px;
    margin: 0 auto;
    background-color: ${MURMA_COLORS.surface};
    border: 1px solid ${MURMA_COLORS.border};
    border-radius: 8px;
    overflow: hidden;
  }
  .header {
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${MURMA_COLORS.primary}33 18%,
      ${MURMA_COLORS.primary} 50%,
      ${MURMA_COLORS.primary}33 82%,
      transparent 100%
    );
    padding: 32px 24px;
    text-align: center;
    border-bottom: 2px solid ${MURMA_COLORS.primary};
  }
  .logo {
    margin-bottom: 12px;
  }
  .eyebrow {
    font-family: ${MURMA_FONTS.mono};
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${MURMA_COLORS.textMuted};
    margin: 0;
  }
  h1 {
    font-size: 24px;
    line-height: 1.2;
    margin: 16px 0 0 0;
    color: ${MURMA_COLORS.ink};
    font-weight: 600;
  }
  .content {
    padding: 32px 24px;
    line-height: 1.6;
  }
  .content p {
    margin: 0 0 16px 0;
    color: ${MURMA_COLORS.ink};
  }
  .cta-button {
    display: inline-block;
    background-color: ${MURMA_COLORS.primary};
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    margin: 16px 0;
    box-shadow: 0 1px 2px ${MURMA_COLORS.primary}2D;
  }
  .cta-button:hover {
    background-color: #1f5838;
    box-shadow: 0 6px 18px ${MURMA_COLORS.primary}3D;
  }
  .accent-strip {
    border-left: 4px solid ${MURMA_COLORS.primary};
    padding-left: 16px;
    margin: 24px 0;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .accent-strip.demand {
    border-left-color: ${MURMA_COLORS.accent};
  }
  .footer {
    background-color: ${MURMA_COLORS.background};
    padding: 24px;
    text-align: center;
    border-top: 1px solid ${MURMA_COLORS.border};
    font-size: 12px;
    color: ${MURMA_COLORS.textMuted};
  }
  .footer a {
    color: ${MURMA_COLORS.primary};
    text-decoration: none;
  }
  .stat-box {
    background-color: ${MURMA_COLORS.background};
    border: 1px solid ${MURMA_COLORS.border};
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    text-align: center;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: ${MURMA_COLORS.primary};
  }
  .stat-label {
    font-family: ${MURMA_FONTS.mono};
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: ${MURMA_COLORS.textMuted};
    margin-top: 8px;
  }
`;

export function welcomeEmail(props: WelcomeEmailProps): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseEmailStyle}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <p class="eyebrow">Welcome to Murma</p>
      <h1>Your voice matters</h1>
    </div>

    <div class="content">
      <p>Hi ${escapeHtml(props.userName)},</p>

      <p>Thanks for joining Murma, the community demand-signaling platform. You can now:</p>

      <ul style="margin: 16px 0; padding-left: 20px;">
        <li>Request new services, branches, or venues in your town</li>
        <li>Upvote what matters to you and see what others care about</li>
        <li>Help shape better decisions by councils and businesses</li>
      </ul>

      <div style="text-align: center;">
        <a href="${escapeHtml(props.baseUrl)}" class="cta-button">Get Started</a>
      </div>

      <p style="margin-top: 24px;">Ready to make a difference? Head to Murma and add your first request or upvote an existing one.</p>
    </div>

    <div class="footer">
      <p>© Murma | <a href="${escapeHtml(props.baseUrl)}/privacy">Privacy</a> | <a href="${escapeHtml(props.baseUrl)}/terms">Terms</a></p>
      <p><a href="${escapeHtml(props.baseUrl)}/settings">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function requestConfirmationEmail(props: RequestConfirmationProps): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseEmailStyle}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <p class="eyebrow">Request Confirmed</p>
      <h1>Your signal is live</h1>
    </div>

    <div class="content">
      <p>Your request has been published and is now live on Murma.</p>

      <div class="accent-strip">
        <strong>${escapeHtml(props.requestTitle)}</strong><br>
        <span style="color: ${MURMA_COLORS.textMuted}; font-size: 14px;">${escapeHtml(props.requestLocation)}</span>
      </div>

      <p>Others can now see and upvote your request. You'll receive daily digests of upvotes you get, helping you track demand for what matters.</p>

      <div style="text-align: center;">
        <a href="${escapeHtml(props.requestUrl)}" class="cta-button">View Request</a>
      </div>

      <p style="font-size: 14px; color: ${MURMA_COLORS.textMuted}; margin-top: 24px;">
        You'll receive email notifications for upvotes (max 1 per day). Adjust these in your <a href="${escapeHtml(props.baseUrl)}/settings" style="color: ${MURMA_COLORS.primary};">account settings</a>.
      </p>
    </div>

    <div class="footer">
      <p>© Murma | <a href="${escapeHtml(props.baseUrl)}/privacy">Privacy</a> | <a href="${escapeHtml(props.baseUrl)}/terms">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function upvoteNotificationEmail(props: UpvoteNotificationProps): string {
  const isMultiple = props.isDigest && props.digests && props.digests.length > 1;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseEmailStyle}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <p class="eyebrow">${isMultiple ? "Daily Digest" : "People Care"}</p>
      <h1>${isMultiple ? "Your requests got traction" : "Your request got upvoted"}</h1>
    </div>

    <div class="content">
      ${isMultiple ? `<p>People continue to care about what you've requested. Here's today's activity:</p>` : `<p>Someone upvoted your request today.</p>`}

      ${isMultiple
        ? props.digests!.map(d => `
          <div class="accent-strip">
            <strong>${escapeHtml(d.title)}</strong><br>
            <span style="color: ${MURMA_COLORS.textMuted}; font-size: 14px;">${escapeHtml(d.location)}</span>
            <div style="margin-top: 8px;">
              <div class="stat-value">${d.count}</div>
              <div class="stat-label">upvotes today</div>
            </div>
          </div>
          <div style="text-align: center; margin-bottom: 16px;">
            <a href="${escapeHtml(d.url)}" style="color: ${MURMA_COLORS.primary}; text-decoration: none; font-weight: 600;">View Request →</a>
          </div>
        `).join('')
        : `
          <div class="accent-strip">
            <strong>${escapeHtml(props.requestTitle)}</strong><br>
            <span style="color: ${MURMA_COLORS.textMuted}; font-size: 14px;">${escapeHtml(props.requestLocation)}</span>
          </div>

          <div class="stat-box">
            <div class="stat-value">${props.upvoteCount}</div>
            <div class="stat-label">Total Upvotes</div>
          </div>

          <div style="text-align: center;">
            <a href="${escapeHtml(props.requestUrl)}" class="cta-button">See Your Request</a>
          </div>
        `
      }

      <p style="font-size: 14px; color: ${MURMA_COLORS.textMuted}; margin-top: 24px; border-top: 1px solid ${MURMA_COLORS.border}; padding-top: 16px;">
        You receive a maximum of one notification email per day. <a href="${escapeHtml(props.baseUrl)}/settings" style="color: ${MURMA_COLORS.primary};">Manage your preferences</a>.
      </p>
    </div>

    <div class="footer">
      <p>© Murma | <a href="${escapeHtml(props.baseUrl)}/privacy">Privacy</a> | <a href="${escapeHtml(props.baseUrl)}/terms">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function moderationAlertEmail(props: ModerationAlertProps): string {
  const isRemoved = props.action === "removed";
  const title = isRemoved ? "Request Removed" : "Request Hidden for Review";
  const eyebrow = isRemoved ? "Action Taken" : "Pending Review";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseEmailStyle}</style>
</head>
<body>
  <div class="email-container">
    <div class="header" style="border-bottom-color: ${MURMA_COLORS.accent};">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
    </div>

    <div class="content">
      <p>Your request has been ${isRemoved ? "removed" : "hidden pending review"} by our moderation team.</p>

      <div class="accent-strip demand">
        <strong>${escapeHtml(props.requestTitle)}</strong>
      </div>

      ${props.reason ? `
        <p><strong>Reason:</strong> ${escapeHtml(props.reason)}</p>
      ` : ''}

      ${props.note ? `
        <p><strong>Details:</strong> ${escapeHtml(props.note)}</p>
      ` : ''}

      ${!isRemoved ? `
        <p style="margin-top: 16px;">Your request is temporarily hidden while we review it. You can:</p>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li>Edit your request to address the concern</li>
          <li>Submit it again, which clears it for re-review</li>
        </ul>

        <div style="text-align: center;">
          <a href="${escapeHtml(props.requestUrl)}" class="cta-button">Edit Request</a>
        </div>
      ` : ''}

      <p style="font-size: 14px; color: ${MURMA_COLORS.textMuted}; margin-top: 24px;">
        If you think this was a mistake, please <a href="${escapeHtml(props.baseUrl)}/contact" style="color: ${MURMA_COLORS.primary};">contact us</a>.
      </p>
    </div>

    <div class="footer">
      <p>© Murma | <a href="${escapeHtml(props.baseUrl)}/privacy">Privacy</a> | <a href="${escapeHtml(props.baseUrl)}/terms">Terms</a></p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
