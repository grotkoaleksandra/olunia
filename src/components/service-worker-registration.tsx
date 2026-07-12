"use client";

import { useEffect } from "react";

const BP = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BP}/sw.js`).catch(() => {
      // Registration is a progressive enhancement; ignore failures.
    });
  }, []);

  return null;
}
