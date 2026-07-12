"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSocialPosts } from "@/hooks/use-social-posts";
import {
  PLATFORM_META,
  PLATFORMS,
  STATUSES,
  engagementOf,
  type SocialMetric,
  type SocialPost,
  type SocialPostStatus,
} from "@/types/social";
import { PostModal, type PostFormValues } from "./post-modal";
import { MetricsModal } from "./metrics-modal";
import { Toast, useToast } from "./toast";

const STATUS_GLYPH: Record<SocialPostStatus, string> = {
  idea: "◌",
  draft: "◔",
  scheduled: "◑",
  published: "●",
};

export function SocialPosts() {
  const { posts, loading, error, savePost, deletePost } = useSocialPosts();
  const { toast, showToast } = useToast();

  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [metricsPost, setMetricsPost] = useState<SocialPost | null>(null);
  const [latestMetrics, setLatestMetrics] = useState<
    Record<string, SocialMetric>
  >({});

  useEffect(() => {
    async function fetchMetrics() {
      const { data } = await supabase
        .from("social_metrics")
        .select("*")
        .order("recorded_at", { ascending: true });
      if (data) {
        // Later snapshots overwrite earlier ones, leaving the latest per post
        const map: Record<string, SocialMetric> = {};
        for (const m of data as SocialMetric[]) {
          map[m.post_id] = m;
        }
        setLatestMetrics(map);
      }
    }
    fetchMetrics();
  }, [posts]);

  const filtered = useMemo(
    () =>
      posts.filter(
        (p) =>
          (platformFilter === "all" || p.platform === platformFilter) &&
          (statusFilter === "all" || p.status === statusFilter)
      ),
    [posts, platformFilter, statusFilter]
  );

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

  const selectClass =
    "bg-transparent border-0 border-b border-stone-300 px-0 py-2 microcaps text-[10px] text-ink focus:outline-none focus:border-ink transition-colors cursor-pointer";

  if (loading) {
    return <p className="text-sm text-stone-400">Loading posts…</p>;
  }

  return (
    <div>
      <p className="microcaps text-stone-400 mb-2">Social Media</p>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
        <h1 className="font-display font-light text-4xl sm:text-5xl text-ink leading-none">
          Posts
        </h1>
        <div className="flex flex-wrap items-end gap-8">
          <select
            className={selectClass}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
          >
            <option value="all">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setEditingPost(null);
              setModalOpen(true);
            }}
            className="microcaps bg-ink text-paper px-6 py-3 hover:bg-stone-700 transition-colors"
          >
            New Post
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm border-l-2 border-ink pl-4 py-1 text-stone-600">
          Could not load posts: {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-t border-hairline pt-10 text-center">
          <p className="font-display italic text-xl text-stone-400">
            Nothing here yet — add your first post to start planning.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-t-2 border-ink">
            <thead>
              <tr className="border-b border-hairline">
                {["Title", "Platform", "Status", "Scheduled", "Engagement", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left microcaps text-[10px] text-stone-400 py-4 pr-6 font-normal"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const metric = latestMetrics[post.id];
                return (
                  <tr
                    key={post.id}
                    className="border-b border-hairline group"
                  >
                    <td className="py-5 pr-6">
                      <button
                        onClick={() => {
                          setEditingPost(post);
                          setModalOpen(true);
                        }}
                        className="font-display text-lg text-ink text-left leading-snug hover:italic"
                      >
                        {post.title}
                      </button>
                      {post.tags.length > 0 && (
                        <div className="microcaps text-[9px] text-stone-400 mt-1.5">
                          {post.tags.join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="py-5 pr-6 text-sm text-stone-600 whitespace-nowrap">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2"
                        style={{
                          backgroundColor: PLATFORM_META[post.platform].color,
                        }}
                      />
                      {PLATFORM_META[post.platform].label}
                    </td>
                    <td className="py-5 pr-6 whitespace-nowrap">
                      <span
                        className={`microcaps text-[10px] ${
                          post.status === "published"
                            ? "text-ink"
                            : post.status === "scheduled"
                            ? "text-stone-600"
                            : "text-stone-400"
                        }`}
                      >
                        <span className="mr-1.5">
                          {STATUS_GLYPH[post.status]}
                        </span>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-5 pr-6 text-sm text-stone-500 tabular-nums whitespace-nowrap">
                      {post.scheduled_at
                        ? new Date(post.scheduled_at).toLocaleString("en", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-5 pr-6 text-sm text-ink tabular-nums whitespace-nowrap">
                      {metric ? (
                        <span title="likes + comments + shares + saves">
                          {engagementOf(metric).toLocaleString()}
                          {metric.impressions > 0 && (
                            <span className="text-xs text-stone-400">
                              {" "}
                              / {metric.impressions.toLocaleString()}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="py-5 text-right whitespace-nowrap">
                      {post.status === "published" && (
                        <button
                          onClick={() => setMetricsPost(post)}
                          className="microcaps text-[10px] text-stone-500 hover:text-ink transition-colors mr-5"
                        >
                          Stats
                        </button>
                      )}
                      {post.post_url && (
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="microcaps text-[10px] text-stone-400 hover:text-ink transition-colors"
                        >
                          Open ↗
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <PostModal
          post={editingPost}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModalOpen(false)}
        />
      )}

      {metricsPost && (
        <MetricsModal
          post={metricsPost}
          onSaved={() => showToast("success", "Metrics recorded.")}
          onError={(msg) => showToast("error", msg)}
          onClose={() => setMetricsPost(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
