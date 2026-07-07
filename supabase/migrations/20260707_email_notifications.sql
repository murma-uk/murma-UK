-- Email notification preferences and tracking

-- Enum for email notification types
CREATE TYPE email_notification_type AS ENUM (
  'welcome',
  'request_confirmation',
  'upvote_digest',
  'moderation_alert'
);

-- Email notification preferences per user
CREATE TABLE email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification toggles
  welcome_email boolean DEFAULT true,
  request_confirmation boolean DEFAULT true,
  upvote_notifications boolean DEFAULT true,
  moderation_alerts boolean DEFAULT true,

  -- Settings
  max_emails_per_day integer DEFAULT 1 CHECK (max_emails_per_day > 0),
  digest_time_utc integer DEFAULT 9 CHECK (digest_time_utc >= 0 AND digest_time_utc < 24),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email send log for tracking
CREATE TABLE email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type email_notification_type NOT NULL,
  recipient_email text NOT NULL,

  -- Email content reference
  request_id uuid,

  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  error_message text,

  -- Metadata
  upvote_count integer,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),

  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
);

-- Daily email digest queue
CREATE TABLE email_digest_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Requests that got upvotes today
  request_ids uuid[] DEFAULT '{}',
  upvote_counts integer[] DEFAULT '{}',

  last_email_sent_at timestamptz,
  next_email_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_digest_queue ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own preferences
CREATE POLICY "Users can read own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read their own email log
CREATE POLICY "Users can read own email log"
  ON email_log FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything with email tables
CREATE POLICY "Service role can manage email preferences"
  ON email_preferences FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email log"
  ON email_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email digest queue"
  ON email_digest_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX idx_email_log_user_id ON email_log(user_id);
CREATE INDEX idx_email_log_email_type ON email_log(email_type);
CREATE INDEX idx_email_log_status ON email_log(status);
CREATE INDEX idx_email_log_created_at ON email_log(created_at);
CREATE INDEX idx_email_digest_queue_next_email_at ON email_digest_queue(next_email_at);
CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);

-- Trigger to update email_preferences.updated_at
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_preferences_update_timestamp
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Trigger to update email_digest_queue.updated_at
CREATE OR REPLACE FUNCTION update_email_digest_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_digest_queue_update_timestamp
  BEFORE UPDATE ON email_digest_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_email_digest_queue_updated_at();

-- Auto-create email preferences when user signs up
CREATE OR REPLACE FUNCTION create_email_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id);

  INSERT INTO email_digest_queue (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_email_preferences_for_user();
