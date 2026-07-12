"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { WeeklySlot } from "@/types/social";

const MONTHLY_KEY = "weekly_plan_monthly";

interface UseWeeklyPlanReturn {
  slots: WeeklySlot[];
  monthly: boolean;
  loading: boolean;
  error: string | null;
  saveSlot: (
    slot: Partial<WeeklySlot> & { weekday: number; title: string },
    id?: string
  ) => Promise<{ error: string | null }>;
  deleteSlot: (id: string) => Promise<{ error: string | null }>;
  setMonthly: (enabled: boolean) => Promise<{ error: string | null }>;
}

export function useWeeklyPlan(): UseWeeklyPlanReturn {
  const [slots, setSlots] = useState<WeeklySlot[]>([]);
  const [monthly, setMonthlyState] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [slotsRes, settingRes] = await Promise.all([
      supabase
        .from("social_weekly_slots")
        .select("*")
        .order("weekday", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("time_of_day", { ascending: true, nullsFirst: false }),
      supabase.from("social_settings").select("value").eq("key", MONTHLY_KEY),
    ]);
    if (slotsRes.error) {
      setError(slotsRes.error.message);
    } else {
      setError(null);
      setSlots((slotsRes.data as WeeklySlot[]) || []);
    }
    const settingRow = settingRes.data?.[0] as
      | { value: { enabled?: boolean } }
      | undefined;
    setMonthlyState(!!settingRow?.value?.enabled);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveSlot = useCallback(
    async (
      slot: Partial<WeeklySlot> & { weekday: number; title: string },
      id?: string
    ) => {
      const query = id
        ? supabase.from("social_weekly_slots").update(slot).eq("id", id)
        : supabase.from("social_weekly_slots").insert(slot);
      const { error: saveError } = await query;
      if (saveError) return { error: saveError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const deleteSlot = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("social_weekly_slots")
        .delete()
        .eq("id", id);
      if (deleteError) return { error: deleteError.message };
      await refresh();
      return { error: null };
    },
    [refresh]
  );

  const setMonthly = useCallback(async (enabled: boolean) => {
    setMonthlyState(enabled); // optimistic
    const { error: upsertError } = await supabase
      .from("social_settings")
      .upsert(
        { key: MONTHLY_KEY, value: { enabled }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (upsertError) return { error: upsertError.message };
    return { error: null };
  }, []);

  return { slots, monthly, loading, error, saveSlot, deleteSlot, setMonthly };
}
