"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PLATFORM_META,
  engagementRate,
  type SocialMetric,
  type SocialPost,
} from "@/types/social";

const FIELDS: { key: keyof MetricValues; label: string }[] = [
  { key: "likes", label: "Likes" },
  { key: "comments", label: "Comments" },
  { key: "shares", label: "Shares" },
  { key: "saves", label: "Saves" },
  { key: "impressions", label: "Impressions" },
  { key: "reach", label: "Reach" },
  { key: "clicks", label: "Clicks" },
];

interface MetricValues {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  clicks: number;
}

interface MetricsModalProps {
  post: SocialPost;
  onSaved: () => void;
  onError: (message: string) => void;
  onClose: () => void;
}

export function MetricsModal({
  post,
  onSaved,
  onError,
  onClose,
}: MetricsModalProps) {
  const [history, setHistory] = useState<SocialMetric[]>([]);
  const [values, setValues] = useState<MetricValues>({
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    impressions: 0,
    reach: 0,
    clicks: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchHistory() {
      const { data } = await supabase
        .from("social_metrics")
        .select("*")
        .eq("post_id", post.id)
        .order("recorded_at", { ascending: false });
      const rows = (data as SocialMetric[]) || [];
      setHistory(rows);
      if (rows.length > 0) {
        // Prefill with the latest snapshot so Ola only bumps the changed numbers
        const { likes, comments, shares, saves, impressions, reach, clicks } =
          rows[0];
        setValues({ likes, comments, shares, saves, impressions, reach, clicks });
      }
    }
    fetchHistory();
  }, [post.id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("social_metrics")
      .insert({ post_id: post.id, ...values });
    setSaving(false);
    if (error) {
      onError(error.message);
    } else {
      onSaved();
      onClose();
    }
  };

  const latest = history[0];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-slate-900 mb-1">Record Stats</h2>
        <p className="text-sm text-slate-500 mb-4">
          {PLATFORM_META[post.platform].label} — {post.title}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {f.label}
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={values[f.key]}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [f.key]: Math.max(0, parseInt(e.target.value) || 0),
                  }))
                }
              />
            </div>
          ))}
        </div>

        {latest && (
          <p className="mt-4 text-xs text-slate-400">
            Last recorded{" "}
            {new Date(latest.recorded_at).toLocaleDateString("en", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {engagementRate(latest) !== null &&
              ` — engagement rate ${engagementRate(latest)!.toFixed(1)}%`}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? "Saving..." : "Save snapshot"}
          </button>
        </div>
      </div>
    </div>
  );
}
