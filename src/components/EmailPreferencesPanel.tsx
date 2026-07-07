import { useEffect, useState } from "react";
import { createClient } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface EmailPreferences {
  welcome_email: boolean;
  request_confirmation: boolean;
  upvote_notifications: boolean;
  moderation_alerts: boolean;
  max_emails_per_day: number;
  digest_time_utc: number;
}

export default function EmailPreferencesPanel() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from("email_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading preferences:", error);
          return;
        }

        if (data) {
          setPreferences(data);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleToggle = (key: keyof EmailPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleMaxEmailsChange = (value: number) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      max_emails_per_day: value,
    });
  };

  const handleDigestTimeChange = (value: number) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      digest_time_utc: value,
    });
  };

  const handleSave = async () => {
    if (!preferences || !user) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("email_preferences")
        .update({
          welcome_email: preferences.welcome_email,
          request_confirmation: preferences.request_confirmation,
          upvote_notifications: preferences.upvote_notifications,
          moderation_alerts: preferences.moderation_alerts,
          max_emails_per_day: preferences.max_emails_per_day,
          digest_time_utc: preferences.digest_time_utc,
        })
        .eq("user_id", user.id);

      if (error) {
        setMessage("Failed to save preferences");
        console.error("Error:", error);
      } else {
        setMessage("Preferences saved successfully");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("An error occurred");
      console.error("Error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-text-lo">Loading preferences...</div>;
  }

  if (!preferences) {
    return <div className="text-text-lo">Unable to load preferences</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
        <p className="text-sm text-text-lo mb-6">
          Choose which emails you'd like to receive from Murma.
        </p>
      </div>

      {/* Welcome Email */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <Label className="font-medium">Welcome Email</Label>
          <p className="text-sm text-text-lo">Sent when you join Murma</p>
        </div>
        <Switch
          checked={preferences.welcome_email}
          onCheckedChange={() => handleToggle("welcome_email")}
        />
      </div>

      {/* Request Confirmation */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <Label className="font-medium">Request Confirmation</Label>
          <p className="text-sm text-text-lo">Sent when your request goes live</p>
        </div>
        <Switch
          checked={preferences.request_confirmation}
          onCheckedChange={() => handleToggle("request_confirmation")}
        />
      </div>

      {/* Upvote Notifications */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <Label className="font-medium">Upvote Notifications</Label>
          <p className="text-sm text-text-lo">Daily digest of upvotes on your requests</p>
        </div>
        <Switch
          checked={preferences.upvote_notifications}
          onCheckedChange={() => handleToggle("upvote_notifications")}
        />
      </div>

      {/* Moderation Alerts */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <div>
          <Label className="font-medium">Moderation Alerts</Label>
          <p className="text-sm text-text-lo">If your request is hidden or removed</p>
        </div>
        <Switch
          checked={preferences.moderation_alerts}
          onCheckedChange={() => handleToggle("moderation_alerts")}
        />
      </div>

      {/* Max Emails Per Day */}
      {preferences.upvote_notifications && (
        <div className="py-3 border-b border-border">
          <Label className="font-medium mb-2 block">Max Emails Per Day</Label>
          <p className="text-sm text-text-lo mb-3">
            Limit notification emails to control inbox volume
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map((num) => (
              <Button
                key={num}
                variant={preferences.max_emails_per_day === num ? "default" : "outline"}
                size="sm"
                onClick={() => handleMaxEmailsChange(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Digest Time */}
      {preferences.upvote_notifications && (
        <div className="py-3 border-b border-border">
          <Label className="font-medium mb-2 block">Preferred Digest Time (UTC)</Label>
          <p className="text-sm text-text-lo mb-3">
            When you'd like to receive your daily digest
          </p>
          <select
            value={preferences.digest_time_utc}
            onChange={(e) => handleDigestTimeChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, "0")}:00 UTC
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
        {message && (
          <p className={`mt-2 text-sm ${message.includes("success") ? "text-primary" : "text-accent"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
