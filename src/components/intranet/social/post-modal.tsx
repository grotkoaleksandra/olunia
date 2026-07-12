"use client";

import { useEffect, useState } from "react";
import {
  PLATFORMS,
  STATUSES,
  type SocialPost,
  type SocialPlatform,
  type SocialPostStatus,
} from "@/types/social";

export interface PostFormValues {
  title: string;
  content: string | null;
  platform: SocialPlatform;
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  post_url: string | null;
  tags: string[];
  notes: string | null;
}

interface PostModalProps {
  /** Existing post when editing, null when creating. */
  post: SocialPost | null;
  /** Prefill for the scheduled date when creating from the calendar (YYYY-MM-DD). */
  defaultDate?: string | null;
  /** Prefill from a weekly-plan slot when creating from a ghost entry. */
  defaultSlot?: {
    title: string;
    platform: SocialPlatform;
    time: string | null; // "HH:MM"
  } | null;
  onSave: (values: PostFormValues, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function PostModal({
  post,
  defaultDate,
  defaultSlot,
  onSave,
  onDelete,
  onClose,
}: PostModalProps) {
  const [title, setTitle] = useState(post?.title || defaultSlot?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [platform, setPlatform] = useState<SocialPlatform>(
    post?.platform || defaultSlot?.platform || "instagram"
  );
  const [status, setStatus] = useState<SocialPostStatus>(
    post?.status || (defaultDate ? "scheduled" : "draft")
  );
  const [scheduledAt, setScheduledAt] = useState(
    post?.scheduled_at
      ? toLocalInputValue(post.scheduled_at)
      : defaultDate
      ? `${defaultDate}T${defaultSlot?.time || "12:00"}`
      : ""
  );
  const [postUrl, setPostUrl] = useState(post?.post_url || "");
  const [tags, setTags] = useState((post?.tags || []).join(", "));
  const [notes, setNotes] = useState(post?.notes || "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    const values: PostFormValues = {
      title: title.trim(),
      content: content.trim() || null,
      platform,
      status,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      published_at:
        status === "published"
          ? post?.published_at || new Date().toISOString()
          : null,
      post_url: postUrl.trim() || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      notes: notes.trim() || null,
    };
    await onSave(values, post?.id);
    setSaving(false);
  };

  const inputClass =
    "w-full bg-transparent border-0 border-b border-stone-300 px-0 py-2 text-sm text-ink placeholder:text-stone-300 focus:outline-none focus:border-ink transition-colors";
  const labelClass = "microcaps text-[10px] text-stone-500 block mb-1";

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/25 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-paper border border-ink p-8 shadow-[8px_8px_0_rgba(28,27,26,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display italic text-3xl font-light text-ink mb-8">
          {post ? "Edit post" : "New post"}
        </h2>

        <div className="space-y-6">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              className={`${inputClass} font-display text-lg`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New illustration series teaser"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className={labelClass}>Platform</label>
              <select
                className={inputClass}
                value={platform}
                onChange={(e) =>
                  setPlatform(e.target.value as SocialPlatform)
                }
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as SocialPostStatus)
                }
              >
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Scheduled for</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Caption / content</label>
            <textarea
              className={inputClass}
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post caption, hashtags…"
            />
          </div>

          <div>
            <label className={labelClass}>Tags — comma separated</label>
            <input
              className={inputClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="illustration, reel, behind-the-scenes"
            />
          </div>

          <div>
            <label className={labelClass}>Post URL — after publishing</label>
            <input
              className={inputClass}
              value={postUrl}
              onChange={(e) => setPostUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              className={inputClass}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ideas, assets to prepare…"
            />
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div>
            {post && onDelete && (
              <button
                onClick={() =>
                  confirmingDelete ? onDelete(post.id) : setConfirmingDelete(true)
                }
                className={`microcaps transition-colors ${
                  confirmingDelete
                    ? "bg-red-900 text-paper px-4 py-2.5"
                    : "text-red-900/70 hover:text-red-900"
                }`}
              >
                {confirmingDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="microcaps text-stone-500 hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="microcaps bg-ink text-paper px-6 py-3 hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
