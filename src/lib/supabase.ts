import { createClient } from "@supabase/supabase-js";

// These values are set during infrastructure setup (/setup-alpacapps-infra)
const SUPABASE_URL = "https://rezhazgfllcyaeuemppw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemhhemdmbGxjeWFldWVtcHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDY2NzIsImV4cCI6MjA4ODcyMjY3Mn0.P8FNp7ZcgSAI4Iq-lKDJVBm4qmdWdsNiRFtsyGxhKoM";

// Test seam: browser-based UI verification can set globalThis.__mockFetch
// to stub REST responses. Resolved per-call, so it's inert in production.
const hookableFetch: typeof fetch = (input, init) => {
  const mock = (globalThis as { __mockFetch?: typeof fetch }).__mockFetch;
  return (mock ?? fetch)(input, init);
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: hookableFetch },
});
