"use client";

import { useEffect, useState } from "react";
import { useWeeklyPlan } from "@/hooks/use-weekly-plan";
import {
  PLATFORMS,
  PLATFORM_META,
  WEEKDAY_NAMES,
  type SocialPlatform,
  type WeeklySlot,
} from "@/types/social";
import { Toast, useToast } from "./toast";

interface SlotDraft {
  weekday: number;
  title: string;
  platform: SocialPlatform;
  time: string; // "HH:MM" or ""
  notes: string;
}

function SlotModal({
  slot,
  weekday,
  onSave,
  onDelete,
  onClose,
}: {
  slot: WeeklySlot | null;
  weekday: number;
  onSave: (draft: SlotDraft, id?: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(slot?.title || "");
  const [platform, setPlatform] = useState<SocialPlatform>(
    slot?.platform || "instagram"
  );
  const [time, setTime] = useState(slot?.time_of_day?.slice(0, 5) || "");
  const [notes, setNotes] = useState(slot?.notes || "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inputClass =
    "w-full bg-transparent border-0 border-b border-stone-300 px-0 py-2 text-sm text-ink placeholder:text-stone-300 focus:outline-none focus:border-ink transition-colors";
  const labelClass = "microcaps text-[10px] text-stone-500 block mb-1";

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    await onSave({ weekday, title: title.trim(), platform, time, notes: notes.trim() }, slot?.id);
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/25 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-paper border border-ink p-8 shadow-[8px_8px_0_rgba(28,27,26,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="microcaps text-[10px] text-stone-400 mb-1">
          Every {WEEKDAY_NAMES[weekday]}
        </p>
        <h2 className="font-display italic text-3xl font-light text-ink mb-8">
          {slot ? "Edit slot" : "New slot"}
        </h2>

        <div className="space-y-6">
          <div>
            <label className={labelClass}>What *</label>
            <input
              className={`${inputClass} font-display text-lg`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reel — behind the scenes"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className={labelClass}>Platform</label>
              <select
                className={inputClass}
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input
                type="time"
                className={inputClass}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <input
              className={inputClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Format, ideas…"
            />
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div>
            {slot && onDelete && (
              <button
                onClick={() =>
                  confirmingDelete ? onDelete(slot.id) : setConfirmingDelete(true)
                }
                className={`microcaps transition-colors ${
                  confirmingDelete
                    ? "bg-red-900 text-paper px-4 py-2.5"
                    : "text-red-900/70 hover:text-red-900"
                }`}
              >
                {confirmingDelete ? "Confirm delete" : "Delete"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="microcaps text-stone-500 hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || saving}
              className="microcaps bg-ink text-paper px-6 py-3 hover:bg-stone-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeeklyPlan() {
  const { slots, monthly, loading, error, saveSlot, deleteSlot, setMonthly } =
    useWeeklyPlan();
  const { toast, showToast } = useToast();

  const [modalWeekday, setModalWeekday] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<WeeklySlot | null>(null);

  const handleSave = async (draft: SlotDraft, id?: string) => {
    const { error: saveError } = await saveSlot(
      {
        weekday: draft.weekday,
        title: draft.title,
        platform: draft.platform,
        time_of_day: draft.time ? `${draft.time}:00` : null,
        notes: draft.notes || null,
      },
      id
    );
    if (saveError) {
      showToast("error", saveError);
    } else {
      showToast("success", id ? "Slot updated." : "Slot added.");
      setModalWeekday(null);
      setEditingSlot(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await deleteSlot(id);
    if (deleteError) {
      showToast("error", deleteError);
    } else {
      showToast("success", "Slot deleted.");
      setModalWeekday(null);
      setEditingSlot(null);
    }
  };

  const handleMonthly = async (enabled: boolean) => {
    const { error: settingError } = await setMonthly(enabled);
    if (settingError) {
      showToast("error", settingError);
    } else {
      showToast(
        "success",
        enabled
          ? "Weekly plan will repeat on the calendar every week."
          : "Weekly plan removed from the calendar."
      );
    }
  };

  if (loading) {
    return <p className="text-sm text-stone-400">Loading weekly plan…</p>;
  }

  return (
    <div>
      <p className="microcaps text-stone-400 mb-2">Social Media</p>
      <div className="flex flex-wrap items-end justify-between gap-6 mb-6">
        <h1 className="font-display font-light text-4xl sm:text-5xl text-ink leading-none">
          Weekly Plan
        </h1>
      </div>

      <p className="text-stone-500 max-w-lg mb-6">
        Your recurring rhythm — what goes out on which day. Enter it once;
        tick the box to repeat it across every week of the calendar.
      </p>

      <label className="flex items-start gap-3 mb-12 cursor-pointer select-none max-w-lg">
        <input
          type="checkbox"
          checked={monthly}
          onChange={(e) => handleMonthly(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border border-ink text-paper transition-colors peer-checked:bg-ink"
        >
          {monthly && "✓"}
        </span>
        <span>
          <span className="microcaps text-ink block">Repeat monthly</span>
          <span className="text-xs text-stone-400">
            Show these slots on the calendar for every matching weekday — tap
            one there to turn it into a real post.
          </span>
        </span>
      </label>

      {error && (
        <div className="mb-6 text-sm border-l-2 border-ink pl-4 py-1 text-stone-600">
          Could not load the plan: {error}
        </div>
      )}

      <div className="border-t border-hairline">
        {WEEKDAY_NAMES.map((name, weekday) => {
          const daySlots = slots.filter((s) => s.weekday === weekday);
          return (
            <div
              key={name}
              className="grid sm:grid-cols-[10rem_1fr] gap-x-8 border-b border-hairline py-5"
            >
              <div className="font-display text-2xl text-ink mb-3 sm:mb-0">
                {name}
              </div>
              <div>
                {daySlots.length === 0 ? (
                  <p className="font-display italic text-stone-300 text-lg leading-9">
                    Rest day
                  </p>
                ) : (
                  <div className="space-y-2.5 mb-3">
                    {daySlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setEditingSlot(slot);
                          setModalWeekday(weekday);
                        }}
                        className="group flex w-full items-baseline gap-3 text-left"
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full shrink-0 self-center"
                          style={{
                            backgroundColor: PLATFORM_META[slot.platform].color,
                          }}
                        />
                        <span className="font-display text-lg text-ink group-hover:italic">
                          {slot.title}
                        </span>
                        <span className="microcaps text-[9px] text-stone-400">
                          {PLATFORM_META[slot.platform].label}
                        </span>
                        {slot.time_of_day && (
                          <span className="text-xs text-stone-400 tabular-nums ml-auto shrink-0">
                            {slot.time_of_day.slice(0, 5)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setEditingSlot(null);
                    setModalWeekday(weekday);
                  }}
                  className="microcaps text-[10px] text-stone-400 hover:text-ink transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalWeekday !== null && (
        <SlotModal
          slot={editingSlot}
          weekday={modalWeekday}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => {
            setModalWeekday(null);
            setEditingSlot(null);
          }}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
