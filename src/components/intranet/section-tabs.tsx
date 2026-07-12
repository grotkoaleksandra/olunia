"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { SECTIONS } from "@/types/intranet";

export function SectionTabs() {
  const pathname = usePathname();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  const getActiveSection = () => {
    for (const section of SECTIONS) {
      if (pathname.includes(`/intranet/${section.key}`)) {
        return section.key;
      }
    }
    return null;
  };

  const activeSection = getActiveSection();

  return (
    <div className="bg-paper border-b border-hairline">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-8 overflow-x-auto">
          {SECTIONS.map((section) => (
            <Link
              key={section.key}
              href={`/${lang}/intranet/${section.key}`}
              className={`microcaps py-4 whitespace-nowrap transition-colors border-b -mb-px ${
                activeSection === section.key
                  ? "text-ink border-ink"
                  : "text-stone-400 border-transparent hover:text-ink"
              }`}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
