"use client";

import { useMemo, useState } from "react";
import { useSocialPosts } from "@/hooks/use-social-posts";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import {
  PLATFORM_META,
  PLATFORMS,
  type SocialPost,
  type WeeklySlot,
} from "@/types/social";
import { PostModal, type PostFormValues } from "./post-modal";
import { Toast, useToast } from "./toast";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function SocialCalendar() {
  const { posts, loading, error, savePost, deletePost } = useSocialPosts();
  const { slots, monthly } = useWeeklyPlan();
  const { toast, showToast } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [newPostDate, setNewPostDate] = useState<string | null>(null);
  const [slotPrefill, setSlotPrefill] = useState<WeeklySlot | null>(null);
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

  // Ghost entries: with "repeat monthly" on, weekly-plan slots appear on every
  // matching weekday. A slot is hidden once a real post with the same title
  // and platform exists on that day (i.e., it has been turned into a post).
  const ghostsForDay = (date: Date): WeeklySlot[] => {
    if (!monthly) return [];
    const weekday = (date.getDay() + 6) % 7; // Monday = 0
    const dayPosts = postsByDay.get(localDateKey(date)) || [];
    return slots.filter(
      (s) =>
        s.weekday === weekday &&
        !dayPosts.some(
          (p) => p.platform === s.platform && p.title === s.title
        )
    );
  };

  const openNew = (dateKey: string | null) => {
    setEditingPost(null);
    setNewPostDate(dateKey);
    setSlotPrefill(null);
    setModalOpen(true);
  };

  const openFromSlot = (dateKey: string, slot: WeeklySlot) => {
    setEditingPost(null);
    setNewPostDate(dateKey);
    setSlotPrefill(slot);
    setModalOpen(true);
  };

  const openEdit = (post: SocialPost) => {
    setEditingPost(post);
    setNewPostDate(null);
    setSlotPrefill(null);
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

  // Agenda list for small screens: this month's scheduled posts (and ghost
  // slots from the weekly plan) grouped by day
  const agendaDays = useMemo(() => {
    const days: { date: Date; posts: SocialPost[]; ghosts: WeeklySlot[] }[] =
      [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayPosts = postsByDay.get(localDateKey(date)) || [];
      const ghosts = ghostsForDay(date);
      if (dayPosts.length > 0 || ghosts.length > 0)
        days.push({ date, posts: dayPosts, ghosts });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, postsByDay, slots, monthly]);

  const monthName = new Date(year, month, 1).toLocaleDateString("en", {
    month: "long",
  });
  const todayKey = localDateKey(today);

  if (loading) {
    return <p className="text-sm text-stone-400">Loading calendar…</p>;
  }

  return (
    <div>
      <p className="microcaps text-stone-400 mb-2">Social Media</p>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-8 sm:mb-10">
        <div className="flex items-baseline gap-5">
          <h1 className="font-display font-light text-4xl sm:text-5xl text-ink leading-none">
            {monthName}{" "}
            <span className="italic text-stone-400">{year}</span>
          </h1>
          <div className="flex items-center gap-1 text-lg">
            <button
              onClick={() => moveMonth(-1)}
              className="px-2 text-stone-400 hover:text-ink transition-colors"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              onClick={() => moveMonth(1)}
              className="px-2 text-stone-400 hover:text-ink transition-colors"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>
        <button
          onClick={() => openNew(null)}
          className="microcaps bg-ink text-paper px-6 py-3 hover:bg-stone-700 transition-colors"
        >
          New Post
        </button>
      </div>

      {error && (
        <div className="mb-6 text-sm border-l-2 border-ink pl-4 py-1 text-stone-600">
          Could not load posts: {error}
        </div>
      )}

      {/* Agenda list on small screens; the 7-column grid needs more width */}
      <div className="sm:hidden border-t border-hairline">
        {agendaDays.length === 0 ? (
          <p className="font-display italic text-lg text-stone-400 pt-8 text-center">
            Nothing scheduled this month.
          </p>
        ) : (
          agendaDays.map(({ date, posts: dayPosts, ghosts }) => {
            const key = localDateKey(date);
            const isToday = key === todayKey;
            return (
              <div key={key} className="border-b border-hairline py-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span
                    className={`font-display text-2xl tabular-nums ${
                      isToday ? "italic text-ink" : "text-ink"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span className="microcaps text-[10px] text-stone-400">
                    {date.toLocaleDateString("en", { weekday: "long" })}
                    {isToday && " — today"}
                  </span>
                </div>
                <div className="space-y-2 pl-0.5">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => openEdit(post)}
                      className={`block w-full border-l-2 pl-2.5 text-left text-sm text-ink ${
                        post.status === "published" ? "opacity-45" : ""
                      }`}
                      style={{
                        borderLeftColor: PLATFORM_META[post.platform].color,
                      }}
                    >
                      {post.title}
                      {post.scheduled_at && (
                        <span className="text-xs text-stone-400 tabular-nums ml-2">
                          {new Date(post.scheduled_at).toLocaleTimeString("en", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </button>
                  ))}
                  {ghosts.map((slot) => (
                    <button
                      key={`ghost-${slot.id}`}
                      onClick={() => openFromSlot(key, slot)}
                      className="block w-full border-l-2 border-dashed pl-2.5 text-left text-sm font-display italic text-stone-400 hover:text-ink transition-colors"
                      style={{
                        borderLeftColor: `${PLATFORM_META[slot.platform].color}80`,
                      }}
                    >
                      {slot.title}
                      {slot.time_of_day && (
                        <span className="text-xs not-italic font-sans tabular-nums ml-2">
                          {slot.time_of_day.slice(0, 5)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden sm:block border-t border-hairline">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center microcaps text-[10px] text-stone-400"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-hairline">
          {cells.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={i}
                  className="min-h-28 border-b border-r border-hairline bg-stone-50/50"
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
                className="group min-h-28 border-b border-r border-hairline p-2 cursor-pointer hover:bg-white transition-colors"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs tabular-nums w-6 h-6 flex items-center justify-center ${
                      isToday
                        ? "bg-ink text-paper rounded-full"
                        : "text-stone-400"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none">
                    +
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(post);
                      }}
                      className={`block w-full truncate border-l-2 pl-1.5 text-left text-[11px] leading-tight text-ink hover:underline underline-offset-2 ${
                        post.status === "published" ? "opacity-45" : ""
                      }`}
                      style={{
                        borderLeftColor: PLATFORM_META[post.platform].color,
                      }}
                      title={`${PLATFORM_META[post.platform].label}: ${post.title}`}
                    >
                      {post.title}
                    </button>
                  ))}
                  {ghostsForDay(date).map((slot) => (
                    <button
                      key={`ghost-${slot.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openFromSlot(key, slot);
                      }}
                      className="block w-full truncate border-l-2 border-dashed pl-1.5 text-left text-[11px] leading-tight font-display italic text-stone-400 hover:text-ink transition-colors"
                      style={{
                        borderLeftColor: `${PLATFORM_META[slot.platform].color}80`,
                      }}
                      title={`Weekly plan — ${PLATFORM_META[slot.platform].label}: ${slot.title}`}
                    >
                      {slot.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
        {PLATFORMS.map((p) => (
          <span
            key={p.key}
            className="flex items-center gap-2 microcaps text-[10px] text-stone-500"
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            {p.label}
          </span>
        ))}
      </div>

      {unscheduled.length > 0 && (
        <div className="mt-14 border-t border-hairline pt-6">
          <h2 className="microcaps text-stone-400 mb-4">
            Not yet scheduled — {unscheduled.length}
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {unscheduled.map((post) => (
              <button
                key={post.id}
                onClick={() => openEdit(post)}
                className="group flex items-center gap-2 text-sm text-ink"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: PLATFORM_META[post.platform].color,
                  }}
                />
                <span className="font-display text-base group-hover:italic">
                  {post.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <PostModal
          post={editingPost}
          defaultDate={newPostDate}
          defaultSlot={
            slotPrefill
              ? {
                  title: slotPrefill.title,
                  platform: slotPrefill.platform,
                  time: slotPrefill.time_of_day?.slice(0, 5) || null,
                }
              : null
          }
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalOpen(false)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
