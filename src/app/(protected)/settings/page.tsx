"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LiveRegion } from "@/components/a11y";
import { insforge } from "@/lib/insforge";
import { useUser } from "@insforge/nextjs";
import type { UserPreferences } from "@/types";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadPreferences() {
      const { data } = await insforge.database
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        setPreferences({
          user_id: user!.id,
          high_contrast: false,
          font_size: "medium",
          screen_reader_verbosity: "normal",
          reduced_motion: false,
        });
      }
    }

    loadPreferences();
  }, [user]);

  const savePreferences = async () => {
    if (!preferences || !user) return;
    setSaving(true);

    const { error } = await insforge.database
      .from("user_preferences")
      .insert({
        ...preferences,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      // Try update if insert fails (row exists)
      await insforge.database
        .from("user_preferences")
        .update({
          ...preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    setSaving(false);
    setStatusMessage("Settings saved successfully.");
  };

  if (!isLoaded || !preferences) {
    return (
      <div className="p-8" role="status">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <LiveRegion message={statusMessage} politeness="assertive" />

      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your accessibility preferences
        </p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Display</CardTitle>
          <CardDescription>
            Adjust visual settings for your comfort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="high-contrast">High contrast mode</Label>
            <input
              id="high-contrast"
              type="checkbox"
              checked={preferences.high_contrast}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  high_contrast: e.target.checked,
                })
              }
              className="h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size">Font size</Label>
            <select
              id="font-size"
              value={preferences.font_size}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  font_size: e.target.value as UserPreferences["font_size"],
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (default)</option>
              <option value="large">Large</option>
              <option value="x-large">Extra Large</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="reduced-motion">Reduce motion</Label>
            <input
              id="reduced-motion"
              type="checkbox"
              checked={preferences.reduced_motion}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  reduced_motion: e.target.checked,
                })
              }
              className="h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Screen Reader</CardTitle>
          <CardDescription>
            Adjust how much detail Tack provides in responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="verbosity">Response verbosity</Label>
            <select
              id="verbosity"
              value={preferences.screen_reader_verbosity}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  screen_reader_verbosity: e.target
                    .value as UserPreferences["screen_reader_verbosity"],
                })
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="concise">
                Concise — Brief, to-the-point responses
              </option>
              <option value="normal">
                Normal — Balanced detail (default)
              </option>
              <option value="verbose">
                Verbose — Maximum detail and context
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={savePreferences} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
