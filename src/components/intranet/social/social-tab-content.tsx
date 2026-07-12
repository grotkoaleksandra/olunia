"use client";

import { useParams } from "next/navigation";
import { SocialCalendar } from "./calendar";
import { SocialPosts } from "./posts";
import { SocialAnalytics } from "./analytics";

export function SocialTabContent() {
  const params = useParams();
  const tab = params.tab as string;

  switch (tab) {
    case "calendar":
      return <SocialCalendar />;
    case "posts":
      return <SocialPosts />;
    case "analytics":
      return <SocialAnalytics />;
    default:
      return (
        <p className="text-slate-500">Unknown tab.</p>
      );
  }
}
