"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PLATFORMS,
  PLATFORM_META,
  engagementOf,
  engagementRate,
  type SocialAccountStat,
  type SocialMetric,
  type SocialPlatform,
  type SocialPost,
} from "@/types/social";
import { Toast, useToast } from "./toast";

interface TooltipState {
  x: number;
  y: number;
  lines: string[];
}

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-3xl font-bold text-slate-900 mt-1">{value}</div>
      {detail && <div className="text-xs text-slate-400 mt-1">{detail}</div>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ChartTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
      style={{ left: tip.x, top: tip.y, transform: "translate(-50%, -110%)" }}
    >
      {tip.lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

/** Horizontal bar chart: one bar per platform that has posts. */
function PlatformBars({ posts }: { posts: SocialPost[] }) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  const counts = PLATFORMS.map((p) => ({
    ...p,
    count: posts.filter((post) => post.platform === p.key).length,
  })).filter((p) => p.count > 0);

  if (counts.length === 0) {
    return <p className="text-sm text-slate-400">No posts yet.</p>;
  }

  const max = Math.max(...counts.map((c) => c.count));

  return (
    <div className="relative space-y-2">
      {counts.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-3"
          onMouseMove={(e) => {
            const rect = e.currentTarget.parentElement!.getBoundingClientRect();
            setTip({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
              lines: [`${c.label}: ${c.count} post${c.count === 1 ? "" : "s"}`],
            });
          }}
          onMouseLeave={() => setTip(null)}
        >
          <div className="w-20 shrink-0 text-xs text-slate-600 text-right">
            {c.label}
          </div>
          <div className="flex-1 h-5 flex items-center">
            <div
              className="h-4 rounded-r"
              style={{
                width: `${(c.count / max) * 100}%`,
                backgroundColor: c.color,
                minWidth: 4,
              }}
            />
            <span className="ml-2 text-xs text-slate-500">{c.count}</span>
          </div>
        </div>
      ))}
      <ChartTooltip tip={tip} />
    </div>
  );
}

interface SeriesPoint {
  t: number;
  value: number;
  label: string;
}

/**
 * Minimal SVG line chart. Renders one 2px line per series with hoverable
 * point markers; series carry entity colors and are direct-labeled at the
 * line end, with a legend below when there is more than one.
 */
function LineChart({
  series,
  valueFormat = (v) => v.toLocaleString(),
}: {
  series: { name: string; color: string; points: SeriesPoint[] }[];
  valueFormat?: (v: number) => string;
}) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  const visible = series.filter((s) => s.points.length > 0);
  if (visible.length === 0) {
    return <p className="text-sm text-slate-400">No data recorded yet.</p>;
  }

  const W = 560;
  const H = 180;
  // Reserve room for direct labels at line ends when there are multiple series
  const PAD = {
    left: 40,
    right: visible.length > 1 ? 64 : 8,
    top: 10,
    bottom: 22,
  };

  const allPoints = visible.flatMap((s) => s.points);
  const minT = Math.min(...allPoints.map((p) => p.t));
  const maxT = Math.max(...allPoints.map((p) => p.t));
  const maxV = Math.max(...allPoints.map((p) => p.value), 1);

  const x = (t: number) =>
    maxT === minT
      ? (PAD.left + W - PAD.right) / 2
      : PAD.left + ((t - minT) / (maxT - minT)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v / maxV) * (H - PAD.top - PAD.bottom);

  const gridValues = [0, maxV / 2, maxV];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        onMouseLeave={() => setTip(null)}
      >
        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 3}
              textAnchor="end"
              fontSize={9}
              fill="#94a3b8"
            >
              {valueFormat(Math.round(v))}
            </text>
          </g>
        ))}
        <text
          x={PAD.left}
          y={H - 6}
          fontSize={9}
          fill="#94a3b8"
        >
          {allPoints.find((p) => p.t === minT)?.label}
        </text>
        <text x={W - PAD.right} y={H - 6} fontSize={9} fill="#94a3b8" textAnchor="end">
          {allPoints.find((p) => p.t === maxT)?.label}
        </text>

        {visible.map((s) => {
          const sorted = [...s.points].sort((a, b) => a.t - b.t);
          const d = sorted
            .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t)},${y(p.value)}`)
            .join(" ");
          const last = sorted[sorted.length - 1];
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} />
              {visible.length > 1 && (
                <text
                  x={x(last.t) + 6}
                  y={y(last.value) + 3}
                  fontSize={9}
                  fill="#475569"
                >
                  {s.name}
                </text>
              )}
              {sorted.map((p, i) => (
                <circle
                  key={i}
                  cx={x(p.t)}
                  cy={y(p.value)}
                  r={8}
                  fill="transparent"
                  onMouseMove={(e) => {
                    const rect = (
                      e.currentTarget.ownerSVGElement!
                        .parentElement as HTMLElement
                    ).getBoundingClientRect();
                    setTip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      lines: [
                        `${s.name} — ${p.label}`,
                        valueFormat(p.value),
                      ],
                    });
                  }}
                />
              ))}
              {sorted.map((p, i) => (
                <circle
                  key={`v${i}`}
                  cx={x(p.t)}
                  cy={y(p.value)}
                  r={2.5}
                  fill={s.color}
                  stroke="#fff"
                  strokeWidth={1}
                  pointerEvents="none"
                />
              ))}
            </g>
          );
        })}
      </svg>
      {visible.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {visible.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <ChartTooltip tip={tip} />
    </div>
  );
}

export function SocialAnalytics() {
  const { toast, showToast } = useToast();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [metrics, setMetrics] = useState<SocialMetric[]>([]);
  const [accountStats, setAccountStats] = useState<SocialAccountStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [followerPlatform, setFollowerPlatform] =
    useState<SocialPlatform>("instagram");
  const [followerCount, setFollowerCount] = useState("");
  const [savingFollowers, setSavingFollowers] = useState(false);

  const refresh = async () => {
    const [postsRes, metricsRes, statsRes] = await Promise.all([
      supabase.from("social_posts").select("*"),
      supabase
        .from("social_metrics")
        .select("*")
        .order("recorded_at", { ascending: true }),
      supabase
        .from("social_account_stats")
        .select("*")
        .order("recorded_at", { ascending: true }),
    ]);
    const firstError =
      postsRes.error || metricsRes.error || statsRes.error || null;
    setLoadError(firstError ? firstError.message : null);
    setPosts((postsRes.data as SocialPost[]) || []);
    setMetrics((metricsRes.data as SocialMetric[]) || []);
    setAccountStats((statsRes.data as SocialAccountStat[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Latest metric snapshot per post
  const latestByPost = useMemo(() => {
    const map = new Map<string, SocialMetric>();
    for (const m of metrics) map.set(m.post_id, m);
    return map;
  }, [metrics]);

  const published = posts.filter((p) => p.status === "published");
  const now = new Date();
  const publishedThisMonth = published.filter((p) => {
    const d = new Date(p.published_at || p.created_at);
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  const totalEngagement = [...latestByPost.values()].reduce(
    (sum, m) => sum + engagementOf(m),
    0
  );

  const rates = [...latestByPost.values()]
    .map((m) => engagementRate(m))
    .filter((r): r is number => r !== null);
  const avgRate =
    rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;

  // Latest follower count per platform
  const latestFollowers = useMemo(() => {
    const map = new Map<SocialPlatform, number>();
    for (const s of accountStats) map.set(s.platform, s.followers);
    return map;
  }, [accountStats]);
  const totalFollowers = [...latestFollowers.values()].reduce(
    (a, b) => a + b,
    0
  );

  // Engagement over time: one series, latest snapshot per post bucketed by publish month
  const engagementSeries = useMemo(() => {
    const buckets = new Map<string, { t: number; value: number }>();
    for (const post of published) {
      const m = latestByPost.get(post.id);
      if (!m) continue;
      const d = new Date(post.published_at || post.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const t = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const bucket = buckets.get(key) || { t, value: 0 };
      bucket.value += engagementOf(m);
      buckets.set(key, bucket);
    }
    return [...buckets.values()].map((b) => ({
      ...b,
      label: new Date(b.t).toLocaleDateString("en", {
        month: "short",
        year: "2-digit",
      }),
    }));
  }, [published, latestByPost]);

  // Follower growth: one series per platform with recorded stats
  const followerSeries = useMemo(
    () =>
      PLATFORMS.map((p) => ({
        name: p.label,
        color: p.color,
        points: accountStats
          .filter((s) => s.platform === p.key)
          .map((s) => ({
            t: new Date(s.recorded_at).getTime(),
            value: s.followers,
            label: new Date(s.recorded_at).toLocaleDateString("en", {
              day: "numeric",
              month: "short",
            }),
          })),
      })),
    [accountStats]
  );

  // Top posts by engagement
  const topPosts = useMemo(
    () =>
      published
        .map((p) => ({ post: p, metric: latestByPost.get(p.id) }))
        .filter(
          (x): x is { post: SocialPost; metric: SocialMetric } => !!x.metric
        )
        .sort((a, b) => engagementOf(b.metric) - engagementOf(a.metric))
        .slice(0, 5),
    [published, latestByPost]
  );

  const handleRecordFollowers = async () => {
    const count = parseInt(followerCount);
    if (isNaN(count) || count < 0 || savingFollowers) return;
    setSavingFollowers(true);
    const { error } = await supabase
      .from("social_account_stats")
      .insert({ platform: followerPlatform, followers: count });
    setSavingFollowers(false);
    if (error) {
      showToast("error", error.message);
    } else {
      showToast("success", "Follower count recorded.");
      setFollowerCount("");
      refresh();
    }
  };

  if (loading) {
    return <p className="text-slate-500">Loading analytics...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Analytics</h1>

      {loadError && (
        <div className="mb-4 text-sm rounded-lg px-4 py-3 bg-red-50 border border-red-200 text-red-700">
          Could not load data: {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile
          label="Published posts"
          value={String(published.length)}
          detail={`${publishedThisMonth.length} this month`}
        />
        <StatTile
          label="Total engagement"
          value={totalEngagement.toLocaleString()}
          detail="likes + comments + shares + saves"
        />
        <StatTile
          label="Avg engagement rate"
          value={avgRate !== null ? `${avgRate.toFixed(1)}%` : "—"}
          detail="of impressions, across tracked posts"
        />
        <StatTile
          label="Followers"
          value={totalFollowers > 0 ? totalFollowers.toLocaleString() : "—"}
          detail="latest across all platforms"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Published posts by platform">
          <PlatformBars posts={published} />
        </ChartCard>

        <ChartCard title="Engagement per month">
          <LineChart
            series={[
              {
                name: "Engagement",
                color: "#b45309",
                points: engagementSeries,
              },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Follower growth">
          <LineChart series={followerSeries} />
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Platform
              </label>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={followerPlatform}
                onChange={(e) =>
                  setFollowerPlatform(e.target.value as SocialPlatform)
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
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Followers today
              </label>
              <input
                type="number"
                min={0}
                className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                placeholder="e.g. 1250"
              />
            </div>
            <button
              onClick={handleRecordFollowers}
              disabled={savingFollowers || followerCount === ""}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Record
            </button>
          </div>
        </ChartCard>

        <ChartCard title="Top posts by engagement">
          {topPosts.length === 0 ? (
            <p className="text-sm text-slate-400">
              Record stats on published posts (Posts tab → Stats) to see your
              best performers here.
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-500 py-2">
                    Post
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 py-2">
                    Engagement
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 py-2">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map(({ post, metric }) => (
                  <tr
                    key={post.id}
                    className="border-b border-slate-50 last:border-b-0"
                  >
                    <td className="py-2 text-sm text-slate-900">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1.5"
                        style={{
                          backgroundColor: PLATFORM_META[post.platform].color,
                        }}
                      />
                      {post.title}
                    </td>
                    <td className="py-2 text-sm text-slate-700 text-right">
                      {engagementOf(metric).toLocaleString()}
                    </td>
                    <td className="py-2 text-sm text-slate-500 text-right">
                      {engagementRate(metric) !== null
                        ? `${engagementRate(metric)!.toFixed(1)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ChartCard>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
