-- Create page_content table for managing website sections
CREATE TABLE IF NOT EXISTS page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL,
  section_name TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous access (admin auth is handled at app level)
CREATE POLICY "Allow anonymous read access to page_content"
ON page_content
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous update access to page_content"
ON page_content
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous insert access to page_content"
ON page_content
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to page_content"
ON page_content
FOR DELETE
TO anon
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_page_content_updated_at
BEFORE UPDATE ON page_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default content for main sections
INSERT INTO page_content (section_key, section_name, content) VALUES
('hero_stats', 'Hero Statistics', '{
  "stats": [
    {"value": "10+", "label": "Régió"},
    {"value": "2000+", "label": "Tagok"},
    {"value": "100+", "label": "Események"}
  ]
}'::jsonb),
('hero_content', 'Hero Section', '{
  "title": "Üdvözlünk a Magyar Ifjúsági Konferencia honlapján!",
  "description": "Akár a Kárpát-medencében, és azon kívül élő magyarság, akár szervezetünk érdekelnek, itt mindent megtalálsz.",
  "primaryButtonText": "TAGSZERVEZETI PORTÁL",
  "primaryButtonUrl": "https://dashboard.mikegyesulet.hu",
  "secondaryButtonText": "TUDJ MEG TÖBBET"
}'::jsonb),
('about_section', 'About Section', '{
  "title": "KIK VAGYUNK MI?",
  "description": "Kattints, hogy megtudd, kik is alkotjuk a MIK-et, hogyan is oszlik meg a munka, vagy ha többet szeretnél megtudni szervezeti struktúránkról.",
  "buttonText": "MAGUNKRÓL"
}'::jsonb),
('regions_section', 'Regions Section', '{
  "title": "Ismerd meg partnereinket!",
  "description": "A MIK tagszervezetei a Kárpát-medence minden régiójában képviselik a magyar ifjúság érdekeit. Erdélytől Felvidékig, Kárpátaljától a diaszpóráig – minden sarokban ott vagyunk, ahol magyarok élnek.",
  "buttonText": "RÉSZLETEK"
}'::jsonb),
('news_section', 'News Section', '{
  "subtitle": "FRISS HÍREINK, ÍRÁSAINK",
  "title": "TÁJÉKOZÓDJ SZÜLŐFÖLDÜNKRŐL!",
  "description": "Vagy olvass el minden írást a HYCA blogon",
  "buttonText": "HYCA BLOG"
}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;