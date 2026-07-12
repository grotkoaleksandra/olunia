"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSocialPosts } from "@/hooks/use-social-posts";
import {
  PLATFORM_META,
  PLATFORMS,
  STATUSES,
  STATUS_STYLES,
  engagementOf,
  type SocialMetric,
  type SocialPost,
} from "@/types/social";
import { PostModal, type PostFormValues } from "./post-modal";
import { MetricsModal } from "./metrics-modal";
import { Toast, useToast } from "./toast";

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
    "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500";

  if (loading) {
    return <p className="text-slate-500">Loading posts...</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Posts</h1>
        <div className="flex flex-wrap items-center gap-3">
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
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          No posts yet. Add your first post to start planning.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Title", "Platform", "Status", "Scheduled", "Engagement", ""].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="text-left text-sm font-medium text-slate-700 px-4 py-3"
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
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <button
                        onClick={() => {
                          setEditingPost(post);
                          setModalOpen(true);
                        }}
                        className="font-medium hover:text-amber-700 text-left"
                      >
                        {post.title}
                      </button>
                      {post.tags.length > 0 && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {post.tags.map((t) => `#${t}`).join(" ")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{
                          backgroundColor: PLATFORM_META[post.platform].color,
                        }}
                      />
                      {PLATFORM_META[post.platform].label}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[post.status]}`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {post.scheduled_at
                        ? new Date(post.scheduled_at).toLocaleString("en", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {metric ? (
                        <span title="likes + comments + shares + saves">
                          {engagementOf(metric).toLocaleString()}
                          {metric.impressions > 0 && (
                            <span className="text-xs text-slate-400">
                              {" "}
                              / {metric.impressions.toLocaleString()} views
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {post.status === "published" && (
                        <button
                          onClick={() => setMetricsPost(post)}
                          className="text-sm font-medium text-amber-700 hover:text-amber-800 mr-3"
                        >
                          Stats
                        </button>
                      )}
                      {post.post_url && (
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-slate-500 hover:text-slate-700"
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
