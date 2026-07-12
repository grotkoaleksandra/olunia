-- Weekly recurring content plan + simple key-value settings

CREATE TABLE IF NOT EXISTS social_weekly_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0 = Monday
    title TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'instagram'
        CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'x', 'pinterest', 'behance')),
    time_of_day TIME,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE social_weekly_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage weekly slots" ON social_weekly_slots
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage social settings" ON social_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
