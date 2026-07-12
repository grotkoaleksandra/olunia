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

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="py-2">
      <div className="microcaps text-[10px] text-stone-400">{label}</div>
      <div className="font-display font-light text-5xl text-ink tabular-nums mt-3 leading-none">
        {value}
      </div>
      {detail && <div className="text-xs text-stone-400 mt-3">{detail}</div>}
    </div>
  );
}

function ChartSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-hairline pt-5">
      <h2 className="microcaps text-stone-400 mb-6">{title}</h2>
      {children}
    </div>
  );
}

function ChartTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none absolute z-10 bg-ink px-3 py-2 text-xs text-paper"
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
    return (
      <p className="font-display italic text-lg text-stone-400">
        No posts yet.
      </p>
    );
  }

  const max = Math.max(...counts.map((c) => c.count));

  return (
    <div className="relative space-y-3">
      {counts.map((c) => (
        <div
          key={c.key}
          className="flex items-center gap-4"
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
          <div className="w-24 shrink-0 microcaps text-[9px] text-stone-500 text-right">
            {c.label}
          </div>
          <div className="flex-1 h-5 flex items-center">
            <div
              className="h-3"
              style={{
                width: `${(c.count / max) * 100}%`,
                backgroundColor: c.color,
                minWidth: 3,
              }}
            />
            <span className="ml-3 text-xs text-ink tabular-nums">
              {c.count}
            </span>
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
    return (
      <p className="font-display italic text-lg text-stone-400">
        No data recorded yet.
      </p>
    );
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
              stroke="#eae7e0"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 3}
              textAnchor="end"
              fontSize={9}
              fill="#a8a29e"
            >
              {valueFormat(Math.round(v))}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 6} fontSize={9} fill="#a8a29e">
          {allPoints.find((p) => p.t === minT)?.label}
        </text>
        <text
          x={W - PAD.right}
          y={H - 6}
          fontSize={9}
          fill="#a8a29e"
          textAnchor="end"
        >
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
                  fill="#57534e"
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
                      lines: [`${s.name} — ${p.label}`, valueFormat(p.value)],
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
                  stroke="#faf9f6"
                  strokeWidth={1}
                  pointerEvents="none"
                />
              ))}
            </g>
          );
        })}
      </svg>
      {visible.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
          {visible.map((s) => (
            <span
              key={s.name}
              className="flex items-center gap-2 microcaps text-[10px] text-stone-500"
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
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
    return <p className="text-sm text-stone-400">Loading analytics…</p>;
  }

  return (
    <div>
      <p className="microcaps text-stone-400 mb-2">Social Media</p>
      <h1 className="font-display font-light text-5xl text-ink leading-none mb-10">
        Analytics
      </h1>

      {loadError && (
        <div className="mb-6 text-sm border-l-2 border-ink pl-4 py-1 text-stone-600">
          Could not load data: {loadError}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 border-t-2 border-ink mb-14 [&>*]:border-b [&>*]:border-hairline [&>*]:py-6 lg:[&>*:not(:first-child)]:border-l lg:[&>*:not(:first-child)]:border-l-hairline lg:[&>*:not(:first-child)]:pl-8">
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

      <div className="grid lg:grid-cols-2 gap-x-16 gap-y-12 mb-12">
        <ChartSection title="Published posts by platform">
          <PlatformBars posts={published} />
        </ChartSection>

        <ChartSection title="Engagement per month">
          <LineChart
            series={[
              {
                name: "Engagement",
                color: "#1c1b1a",
                points: engagementSeries,
              },
            ]}
          />
        </ChartSection>

        <ChartSection title="Follower growth">
          <LineChart series={followerSeries} />
          <div className="mt-8 flex flex-wrap items-end gap-8">
            <div>
              <label className="microcaps text-[10px] text-stone-500 block mb-1">
                Platform
              </label>
              <select
                className="bg-transparent border-0 border-b border-stone-300 px-0 py-2 text-sm text-ink focus:outline-none focus:border-ink transition-colors cursor-pointer"
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
              <label className="microcaps text-[10px] text-stone-500 block mb-1">
                Followers today
              </label>
              <input
                type="number"
                min={0}
                className="w-32 bg-transparent border-0 border-b border-stone-300 px-0 py-2 text-sm text-ink tabular-nums placeholder:text-stone-300 focus:outline-none focus:border-ink transition-colors"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                placeholder="1250"
              />
            </div>
            <button
              onClick={handleRecordFollowers}
              disabled={savingFollowers || followerCount === ""}
              className="microcaps bg-ink text-paper px-5 py-2.5 hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              Record
            </button>
          </div>
        </ChartSection>

        <ChartSection title="Top posts by engagement">
          {topPosts.length === 0 ? (
            <p className="font-display italic text-lg text-stone-400">
              Record stats on published posts to see your best performers here.
            </p>
          ) : (
            <ol className="space-y-0">
              {topPosts.map(({ post, metric }, i) => (
                <li
                  key={post.id}
                  className="flex items-baseline gap-4 border-b border-hairline py-3.5 last:border-b-0"
                >
                  <span className="font-display italic text-stone-300 text-lg w-5 shrink-0">
                    {i + 1}
                  </span>
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0 self-center"
                    style={{
                      backgroundColor: PLATFORM_META[post.platform].color,
                    }}
                  />
                  <span className="font-display text-lg text-ink leading-snug flex-1 min-w-0 truncate">
                    {post.title}
                  </span>
                  <span className="text-sm text-ink tabular-nums shrink-0">
                    {engagementOf(metric).toLocaleString()}
                  </span>
                  <span className="text-xs text-stone-400 tabular-nums w-12 text-right shrink-0">
                    {engagementRate(metric) !== null
                      ? `${engagementRate(metric)!.toFixed(1)}%`
                      : "—"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </ChartSection>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
