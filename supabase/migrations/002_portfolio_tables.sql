-- Portfolio tables for Olunia

-- Projects / portfolio pieces
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'design',
    client_name TEXT,
    cover_image_url TEXT,
    gallery_urls TEXT[],
    tags TEXT[],
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Public read for projects
CREATE POLICY "Public can view published projects" ON projects
    FOR SELECT USING (NOT is_archived);

-- Anyone can submit contact messages
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- Only authenticated users can read contact messages
CREATE POLICY "Authenticated users can read contact messages" ON contact_messages
    FOR SELECT TO authenticated USING (true);

-- Only authenticated users can update contact messages
CREATE POLICY "Authenticated users can update contact messages" ON contact_messages
    FOR UPDATE TO authenticated USING (true);

-- Authenticated users can manage projects
CREATE POLICY "Authenticated users can insert projects" ON projects
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects" ON projects
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete projects" ON projects
    FOR DELETE TO authenticated USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
