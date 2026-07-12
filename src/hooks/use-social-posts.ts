"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SocialPost } from "@/types/social";

interface UseSocialPostsReturn {
  posts: SocialPost[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  savePost: (
    post: Partial<SocialPost> & { title: string },
    id?: string
  ) => Promise<{ error: string | null }>;
  deletePost: (id: string) => Promise<{ error: string | null }>;
}

export function useSocialPosts(): UseSocialPostsReturn {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("social_posts")
      .select("*")
      .order("scheduled_at", { ascending: true, nullsFirst: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setError(null);
      setPosts((data as SocialPost[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const savePost = useCallback(
    async (post: Partial<SocialPost> & { title: string }, id?: string) => {
      const query = id
        ? supabase.from("social_posts").update(post).eq("id", id)
        : supabase.from("social_posts").insert(post);
      const { error: saveError } = await query;
      if (saveError) return { error: saveError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deletePost = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", id);
      if (deleteError) return { error: deleteError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  return { posts, loading, error, refresh, savePost, deletePost };
}
