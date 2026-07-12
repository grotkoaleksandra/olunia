"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { SECTIONS, type TabConfig } from "@/types/intranet";
import { usePageDisplayConfig } from "@/hooks/use-page-display-config";

export function SubTabs() {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params.lang as string) || "en";
  const { getVisibleTabs, loading } = usePageDisplayConfig();

  const getActiveSection = () => {
    for (const section of SECTIONS) {
      if (pathname.includes(`/intranet/${section.key}`)) {
        return section.key;
      }
    }
    return null;
  };

  const activeSection = getActiveSection();
  if (!activeSection) return null;

  const visibleTabs: TabConfig[] = getVisibleTabs(activeSection);

  // For admin section, always append "Page Display" as the last tab
  const isPageDisplayActive = pathname.includes("/admin/page-display");

  const getActiveTab = () => {
    const tabParam = params.tab as string | undefined;
    if (tabParam) return tabParam;
    if (isPageDisplayActive) return "page-display";
    return null;
  };

  const activeTab = getActiveTab();

  const linkClass = (isActive: boolean) =>
    `font-display text-lg py-3 whitespace-nowrap transition-colors ${
      isActive
        ? "text-ink italic underline underline-offset-8 decoration-1"
        : "text-stone-400 hover:text-ink"
    }`;

  if (loading) {
    return (
      <div className="bg-paper">
        <div className="max-w-7xl mx-auto px-6 h-12" />
      </div>
    );
  }

  return (
    <div className="bg-paper">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-8 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <Link
              key={tab.tab_key}
              href={`/${lang}/intranet/${activeSection}/${tab.tab_key}`}
              className={linkClass(activeTab === tab.tab_key)}
            >
              {tab.tab_label}
            </Link>
          ))}
          {activeSection === "admin" && (
            <Link
              href={`/${lang}/intranet/admin/page-display`}
              className={linkClass(isPageDisplayActive)}
            >
              Page Display
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
