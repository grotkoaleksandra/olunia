"use client";

import { useMemo, useState } from "react";
import { useSocialPosts } from "@/hooks/use-social-posts";
import { PLATFORM_META, PLATFORMS, type SocialPost } from "@/types/social";
import { PostModal, type PostFormValues } from "./post-modal";
import { Toast, useToast } from "./toast";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function SocialCalendar() {
  const { posts, loading, error, savePost, deletePost } = useSocialPosts();
  const { toast, showToast } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [newPostDate, setNewPostDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const postsByDay = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    for (const post of posts) {
      if (!post.scheduled_at) continue;
      const key = localDateKey(new Date(post.scheduled_at));
      const list = map.get(key) || [];
      list.push(post);
      map.set(key, list);
    }
    return map;
  }, [posts]);

  const unscheduled = useMemo(
    () => posts.filter((p) => !p.scheduled_at && p.status !== "published"),
    [posts]
  );

  // Build the month grid: cells start on Monday
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(year, month, d));
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const moveMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const openNew = (dateKey: string | null) => {
    setEditingPost(null);
    setNewPostDate(dateKey);
    setModalOpen(true);
  };

  const openEdit = (post: SocialPost) => {
    setEditingPost(post);
    setNewPostDate(null);
    setModalOpen(true);
  };

  const handleSave = async (values: PostFormValues, id?: string) => {
    const { error: saveError } = await savePost(values, id);
    if (saveError) {
      showToast("error", saveError);
    } else {
      showToast("success", id ? "Post updated." : "Post added.");
      setModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await deletePost(id);
    if (deleteError) {
      showToast("error", deleteError);
    } else {
      showToast("success", "Post deleted.");
      setModalOpen(false);
    }
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
  const todayKey = localDateKey(today);

  if (loading) {
    return <p className="text-slate-500">Loading calendar...</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Content Calendar</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => moveMonth(-1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="text-sm font-medium text-slate-900 w-36 text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => moveMonth(1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            aria-label="Next month"
          >
            →
          </button>
          <button
            onClick={() => openNew(null)}
            className="ml-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + New Post
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-red-700">
          Could not load posts: {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={i}
                  className="min-h-24 border-b border-r border-slate-100 bg-slate-50/50"
                />
              );
            }
            const key = localDateKey(date);
            const dayPosts = postsByDay.get(key) || [];
            const isToday = key === todayKey;
            return (
              <div
                key={i}
                onClick={() => openNew(key)}
                className="min-h-24 border-b border-r border-slate-100 p-1.5 cursor-pointer hover:bg-amber-50/50 transition-colors"
              >
                <div
                  className={`text-xs mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? "bg-amber-600 text-white font-bold"
                      : "text-slate-500"
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(post);
                      }}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-xs text-white ${
                        post.status === "published" ? "opacity-60" : ""
                      }`}
                      style={{
                        backgroundColor: PLATFORM_META[post.platform].color,
                      }}
                      title={`${PLATFORM_META[post.platform].label}: ${post.title}`}
                    >
                      {post.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
        {PLATFORMS.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            {p.label}
          </span>
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Not scheduled yet ({unscheduled.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((post) => (
              <button
                key={post.id}
                onClick={() => openEdit(post)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: PLATFORM_META[post.platform].color }}
                />
                {post.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <PostModal
          post={editingPost}
          defaultDate={newPostDate}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalOpen(false)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
