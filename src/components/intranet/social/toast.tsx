"use client";

import { useCallback, useEffect, useState } from "react";

export interface ToastState {
  type: "success" | "error";
  text: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((type: ToastState["type"], text: string) => {
    setToast({ type, text });
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed bottom-8 right-8 z-50 px-5 py-3.5 text-sm shadow-[6px_6px_0_rgba(28,27,26,0.12)] ${
        toast.type === "success"
          ? "bg-ink text-paper"
          : "bg-red-900 text-paper"
      }`}
    >
      {toast.text}
    </div>
  );
}
