export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "pinterest"
  | "behance";

export type SocialPostStatus = "idea" | "draft" | "scheduled" | "published";

export interface SocialPost {
  id: string;
  title: string;
  content: string | null;
  platform: SocialPlatform;
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  post_url: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialMetric {
  id: string;
  post_id: string;
  recorded_at: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  clicks: number;
}

export interface SocialAccountStat {
  id: string;
  platform: SocialPlatform;
  followers: number;
  recorded_at: string;
}

// Brand-recognizable hues adjusted to pass the chart palette checks
// (lightness band, chroma floor, adjacent-pair CVD separation) in this order.
export const PLATFORMS: {
  key: SocialPlatform;
  label: string;
  color: string;
}[] = [
  { key: "instagram", label: "Instagram", color: "#C13584" },
  { key: "facebook", label: "Facebook", color: "#1877F2" },
  { key: "tiktok", label: "TikTok", color: "#0092A8" },
  { key: "x", label: "X (Twitter)", color: "#6B4FA0" },
  { key: "youtube", label: "YouTube", color: "#CC0000" },
  { key: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { key: "pinterest", label: "Pinterest", color: "#B7081B" },
  { key: "behance", label: "Behance", color: "#0057FF" },
];

export const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; color: string }
> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, { label: p.label, color: p.color }])
) as Record<SocialPlatform, { label: string; color: string }>;

export const STATUSES: { key: SocialPostStatus; label: string }[] = [
  { key: "idea", label: "Idea" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "published", label: "Published" },
];

export const STATUS_STYLES: Record<SocialPostStatus, string> = {
  idea: "bg-slate-100 text-slate-600",
  draft: "bg-amber-50 text-amber-700",
  scheduled: "bg-blue-50 text-blue-700",
  published: "bg-green-50 text-green-700",
};

/** Sum of interactions used as the engagement numerator. */
export function engagementOf(m: SocialMetric): number {
  return m.likes + m.comments + m.shares + m.saves;
}

/** Engagement rate as a percentage of impressions; null when no impressions. */
export function engagementRate(m: SocialMetric): number | null {
  if (!m.impressions) return null;
  return (engagementOf(m) / m.impressions) * 100;
}
