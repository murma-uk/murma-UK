# Murma Email Notifications System

This document describes the email notification system that applies the Murma design system ("quiet civic" identity) to all user-facing email communications.

## Design System

All email templates follow the Murma brand identity:

### Colors
- **Signal Green** (#256b47): Primary action, accents
- **Demand Orange** (#c06a44): Alerts, warnings
- **Ink** (#191a1c): Body text
- **Off-white** (#f6f5f3): Background
- **Hairline** (#e4e2dc): Borders

### Typography
- **Display**: Fraunces (serif) — used sparingly for impact
- **Headings/Body**: Bricolage Grotesque — soft, modern grotesque
- **Mono**: DM Mono — metadata, labels

### Visual Elements
- **Signal line**: Thin green gradient line in headers
- **Accent strip**: Left border accent (green for normal, orange for alerts)
- **Stat boxes**: Highlighted metrics with large numerals
- **Eyebrow labels**: Uppercase mono labels for email type

## Email Types

### 1. Welcome Email
Sent when a new user signs up (if enabled in preferences).

**Content**:
- Personalized greeting
- Overview of what they can do
- CTA to get started
- Link to settings

**Template**: `supabase/functions/send-welcome-email/index.ts`

### 2. Request Confirmation
Sent when a user's request goes live.

**Content**:
- Confirmation that request is published
- Request title and location with accent strip
- Explanation that others can upvote
- CTA to view request
- Note about notification settings

**Template**: `supabase/functions/send-confirmation-email/index.ts`

### 3. Upvote Notifications (Max 1 per day)
Sent as a daily digest of upvote activity on the user's requests.

**Two formats**:

**Single upvote**:
- Someone upvoted your request
- Request details with stat box showing total upvotes
- CTA to view request

**Daily digest** (multiple requests with activity):
- Summary of all requests that got upvotes today
- Each request with today's upvote count
- Individual CTAs per request
- Note about frequency limits

**Template**: `supabase/functions/send-upvote-email/index.ts`

**Database tracking**:
- `email_digest_queue`: Tracks pending upvotes for daily delivery
- `email_log`: Records all sent emails
- `email_preferences`: User controls

### 4. Moderation Alerts
Sent when a post is hidden for review or removed.

**Content**:
- Clear status (Hidden for Review vs. Removed)
- Request title with accent strip (orange)
- Reason and optional note from moderators
- If hidden: Options to edit and resubmit
- If removed: Contact support link

**Template**: `supabase/functions/send-moderation-email/index.ts`

## Database Schema

### Tables

**`email_preferences`**
```sql
- id: UUID (PK)
- user_id: UUID (FK to auth.users) - UNIQUE
- welcome_email: boolean (default: true)
- request_confirmation: boolean (default: true)
- upvote_notifications: boolean (default: true)
- moderation_alerts: boolean (default: true)
- max_emails_per_day: integer (default: 1, min: 1)
- digest_time_utc: integer (default: 9, range: 0-23)
- created_at, updated_at: timestamp
```

**`email_log`**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- email_type: enum (welcome, request_confirmation, upvote_digest, moderation_alert)
- recipient_email: text
- request_id: UUID (FK, nullable)
- status: text (pending, sent, failed, bounced)
- error_message: text (nullable)
- upvote_count: integer (nullable)
- sent_at: timestamp (nullable)
- created_at: timestamp
```

**`email_digest_queue`**
```sql
- id: UUID (PK)
- user_id: UUID (FK) - UNIQUE
- request_ids: UUID[] (array of requests with activity today)
- upvote_counts: integer[] (parallel array of counts)
- last_email_sent_at: timestamp (nullable)
- next_email_at: timestamp (nullable)
- created_at, updated_at: timestamp
```

### Automatic Setup
When a user signs up:
1. `email_preferences` row is created with defaults
2. `email_digest_queue` row is created empty
3. Auth trigger automatically handles this

## Environment Variables

Required for Supabase Edge Functions:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
RESEND_API_KEY=your-resend-api-key
SITE_URL=https://murma.uk  # For links in emails
```

## Using the System

### From Frontend Components

Call the email endpoints from your app when events happen:

```typescript
// Request created
await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-confirmation-email`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      userId: user.id,
      userEmail: user.email,
      requestId: request.id,
      requestTitle: request.title,
      requestLocation: request.location,
      requestUrl: `https://murma.uk/request/${request.id}`,
    }),
  }
);

// Upvote received
await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-upvote-email`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      userId: request.author_id,
      userEmail: request.author_email,
      requestId: request.id,
      requestTitle: request.title,
      requestLocation: request.location,
      requestUrl: `https://murma.uk/request/${request.id}`,
      upvoteCount: total_upvotes,
    }),
  }
);
```

### From Database Triggers

Set up triggers to automatically send emails on specific events:

```sql
-- Send confirmation when request status becomes 'active'
CREATE TRIGGER send_confirmation_on_request_active
AFTER UPDATE ON requests
FOR EACH ROW
WHEN (NEW.status = 'active' AND OLD.status != 'active')
EXECUTE FUNCTION send_confirmation_email_trigger();

-- Aggregate upvotes for digest
CREATE TRIGGER track_upvote_for_digest
AFTER INSERT ON upvotes
FOR EACH ROW
EXECUTE FUNCTION add_to_upvote_digest();
```

### Email Preferences Component

Add the settings panel to user profile/settings pages:

```typescript
import EmailPreferencesPanel from '@/components/EmailPreferencesPanel';

// In settings page
<EmailPreferencesPanel />
```

## Testing

### Preview Email Templates

Use the TypeScript email template utilities:

```typescript
import { welcomeEmail, requestConfirmationEmail } from '@/lib/emailTemplates';

const html = welcomeEmail({
  baseUrl: 'https://murma.uk',
  userName: 'Alice',
  userEmail: 'alice@example.com',
});
```

### Send Test Email

Use Resend dashboard or call the edge function:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/send-welcome-email \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "userEmail": "test@example.com",
    "userName": "Test User"
  }'
```

## Monitoring

### Email Log

Query the email log to monitor delivery:

```sql
-- Recent emails
SELECT * FROM email_log 
WHERE created_at > now() - interval '24 hours'
ORDER BY created_at DESC;

-- Failed emails
SELECT * FROM email_log 
WHERE status = 'failed'
ORDER BY created_at DESC;

-- By type
SELECT email_type, COUNT(*), 
       COUNT(*) FILTER (WHERE status = 'sent') as sent,
       COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM email_log 
GROUP BY email_type;
```

### User Preferences

Check user notification settings:

```sql
SELECT * FROM email_preferences WHERE user_id = 'user-uuid';
```

## Compliance

### GDPR/Privacy
- Users can disable all emails in preferences
- Unsubscribe link in footer of all emails points to settings
- Email log is retained per email_log retention policy
- Links in emails are tracked by recipient email, not user ID

### Bounce Handling
Configure Resend webhook to capture bounces and update email_log:

```typescript
// Handle bounce webhook from Resend
if (event.type === 'email.bounced') {
  await supabase
    .from('email_log')
    .update({ status: 'bounced' })
    .eq('id', event.email_log_id);
}
```

## Future Enhancements

- [ ] Email preference groups (e.g., "Digest only")
- [ ] Unsubscribe token per email type
- [ ] Multi-language support
- [ ] Weekly digest option
- [ ] Custom digest schedules per user
- [ ] Email template preview in settings
- [ ] A/B testing of subject lines
- [ ] Delivery analytics dashboard
