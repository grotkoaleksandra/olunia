"use client";

import { useAuth } from "@/contexts/auth-context";
import { useParams, useRouter } from "next/navigation";

export function IntranetHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const params = useParams();
  const lang = (params.lang as string) || "en";

  const handleSignOut = async () => {
    await signOut();
    router.replace(`/${lang}`);
  };

  return (
    <header className="bg-paper border-b border-hairline">
      <div className="max-w-7xl mx-auto px-6 flex items-baseline justify-between h-16">
        <div className="flex items-baseline gap-4 self-center">
          <span className="font-display italic text-2xl text-ink leading-none">
            Olunia
          </span>
          <span className="microcaps text-stone-400">Intranet</span>
        </div>

        <div className="flex items-baseline gap-6 self-center">
          <span className="text-xs text-stone-400 hidden sm:block">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="microcaps text-stone-500 hover:text-ink transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
