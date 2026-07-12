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
      <p className="microcaps text-stone-400 mb-2">Social Media</p>
      <h1 className="font-display font-light text-5xl text-ink leading-none mb-6">
        Plan, publish,{" "}
        <span className="italic">measure.</span>
      </h1>
      <p className="text-stone-500 max-w-md mb-12">
        Your content calendar, post archive, and performance — in one place.
      </p>
      <div className="border-t border-hairline max-w-2xl">
        {visibleTabs.map((tab, i) => (
          <Link
            key={tab.tab_key}
            href={`/${lang}/intranet/social/${tab.tab_key}`}
            className="group flex items-baseline justify-between border-b border-hairline py-5 transition-colors hover:bg-white px-2 -mx-2"
          >
            <span className="flex items-baseline gap-5">
              <span className="font-display italic text-stone-300 text-lg">
                0{i + 1}
              </span>
              <span className="font-display text-2xl text-ink group-hover:italic">
                {tab.tab_label}
              </span>
            </span>
            <span className="text-stone-300 group-hover:text-ink transition-colors">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
