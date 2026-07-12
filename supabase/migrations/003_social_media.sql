-- Social media harmonogram + tracking tables

-- Planned/published posts (the harmonogram)
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    platform TEXT NOT NULL DEFAULT 'instagram'
        CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'x', 'pinterest', 'behance')),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('idea', 'draft', 'scheduled', 'published')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    post_url TEXT,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Engagement snapshots per post (manually recorded)
CREATE TABLE IF NOT EXISTS social_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    shares INTEGER NOT NULL DEFAULT 0,
    saves INTEGER NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    reach INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0
);

-- Account-level follower snapshots for growth tracking
CREATE TABLE IF NOT EXISTS social_account_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL
        CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'x', 'pinterest', 'behance')),
    followers INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled_at ON social_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_social_metrics_post_id ON social_metrics(post_id);

-- Enable RLS: intranet-only data, no public access
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_account_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage social posts" ON social_posts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage social metrics" ON social_metrics
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage social account stats" ON social_account_stats
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at (function created in 002)
CREATE TRIGGER social_posts_updated_at
    BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
