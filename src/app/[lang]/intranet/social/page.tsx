"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePageDisplayConfig } from "@/hooks/use-page-display-config";

export default function SocialPage() {
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const { getVisibleTabs, loading } = usePageDisplayConfig();

  if (loading) return null;

  const visibleTabs = getVisibleTabs("social");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Social Media</h1>
      <p className="text-slate-600 mb-6">
        Plan your content calendar, track posts, and analyze how they perform.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
        {visibleTabs.map((tab) => (
          <Link
            key={tab.tab_key}
            href={`/${lang}/intranet/social/${tab.tab_key}`}
            className="rounded-xl border border-slate-200 p-5 hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
          >
            <div className="font-semibold text-slate-900">{tab.tab_label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
