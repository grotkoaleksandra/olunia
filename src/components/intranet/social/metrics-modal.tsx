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
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/25 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-paper border border-ink p-8 shadow-[8px_8px_0_rgba(28,27,26,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="microcaps text-[10px] text-stone-400 mb-1">
          {PLATFORM_META[post.platform].label}
        </p>
        <h2 className="font-display italic text-3xl font-light text-ink mb-8">
          {post.title}
        </h2>

        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="microcaps text-[10px] text-stone-500 block mb-1">
                {f.label}
              </label>
              <input
                type="number"
                min={0}
                className="w-full bg-transparent border-0 border-b border-stone-300 px-0 py-2 font-display text-xl text-ink tabular-nums focus:outline-none focus:border-ink transition-colors"
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
          <p className="mt-6 text-xs text-stone-400">
            Last recorded{" "}
            {new Date(latest.recorded_at).toLocaleDateString("en", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {engagementRate(latest) !== null && (
              <>
                {" — engagement rate "}
                <span className="text-ink">
                  {engagementRate(latest)!.toFixed(1)}%
                </span>
              </>
            )}
          </p>
        )}

        <div className="mt-10 flex justify-end items-center gap-6">
          <button
            onClick={onClose}
            className="microcaps text-stone-500 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="microcaps bg-ink text-paper px-6 py-3 hover:bg-stone-700 disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving…" : "Save snapshot"}
          </button>
        </div>
      </div>
    </div>
  );
}
