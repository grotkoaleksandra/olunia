// Supabase Configuration
// These values are set during infrastructure setup (/setup-alpacapps-infra)
const SUPABASE_URL = 'https://rezhazgfllcyaeuemppw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlemhhemdmbGxjeWFldWVtcHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDY2NzIsImV4cCI6MjA4ODcyMjY3Mn0.P8FNp7ZcgSAI4Iq-lKDJVBm4qmdWdsNiRFtsyGxhKoM';

// Initialize Supabase client
const supabase = window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Storage helpers
const STORAGE = {
    photos: {
        bucket: 'photos',
        getPublicUrl: (path) => `${SUPABASE_URL}/storage/v1/object/public/photos/${path}`,
    },
    documents: {
        bucket: 'documents',
    },
};
