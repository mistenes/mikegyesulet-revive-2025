-- Create news_articles table
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create site_settings table for API keys and configuration
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_label TEXT NOT NULL,
  setting_type TEXT NOT NULL DEFAULT 'text', -- text, password, textarea
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on news_articles
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published news
CREATE POLICY "Anyone can read published news"
ON public.news_articles
FOR SELECT
USING (published = true);

-- Policy: Anyone can read all news (for admin preview)
CREATE POLICY "Authenticated users can read all news"
ON public.news_articles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert news
CREATE POLICY "Authenticated users can insert news"
ON public.news_articles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update news
CREATE POLICY "Authenticated users can update news"
ON public.news_articles
FOR UPDATE
TO authenticated
USING (true);

-- Policy: Authenticated users can delete news
CREATE POLICY "Authenticated users can delete news"
ON public.news_articles
FOR DELETE
TO authenticated
USING (true);

-- Policy: Authenticated users can read settings
CREATE POLICY "Authenticated users can read settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Authenticated users can insert settings
CREATE POLICY "Authenticated users can insert settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update settings
CREATE POLICY "Authenticated users can update settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (true);

-- Policy: Authenticated users can delete settings
CREATE POLICY "Authenticated users can delete settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for news_articles
CREATE TRIGGER update_news_articles_updated_at
BEFORE UPDATE ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for site_settings
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Mapbox API key setting
INSERT INTO public.site_settings (setting_key, setting_value, setting_label, setting_type)
VALUES ('mapbox_token', '', 'Mapbox API Token', 'password');

-- Insert some sample news articles
INSERT INTO public.news_articles (title, slug, excerpt, content, category, published, published_at)
VALUES 
  (
    'DYLA project: változások a szervezetben',
    'dyla-project-valtozasok',
    'A DYLA projekt keretében jelentős változások történtek szervezetünkben.',
    'A DYLA projekt keretében jelentős változások történtek szervezetünkben. Az új struktúra lehetővé teszi a hatékonyabb együttműködést a régiók között.',
    'Projektek',
    true,
    now() - interval '5 days'
  ),
  (
    'NIS Roadshow 2024',
    'nis-roadshow-2024',
    'Idén is megrendezésre kerül a NIS Roadshow rendezvénysorozat.',
    'Idén is megrendezésre kerül a NIS Roadshow rendezvénysorozat, ahol a fiatal magyar közösségek találkozhatnak és tapasztalatot cserélhetnek.',
    'Események',
    true,
    now() - interval '10 days'
  ),
  (
    '45. MIK Közgyűlés',
    '45-mik-kozgyules',
    'Sikeres közgyűlést tartottunk, ahol meghatároztuk a jövő évi terveinket.',
    'Sikeres közgyűlést tartottunk, ahol meghatároztuk a jövő évi terveinket és stratégiánkat. Köszönjük minden résztvevőnek az aktív részvételt!',
    'MIK Hírek',
    true,
    now() - interval '15 days'
  ),
  (
    '44. MIK Közgyűlés beszámolója',
    '44-mik-kozgyules-beszamoloja',
    'A 44. közgyűlésen áttekintettük az elmúlt év eredményeit.',
    'A 44. közgyűlésen áttekintettük az elmúlt év eredményeit és megünnepeltük közös sikereinket. Az eseményen több mint 100 fiatal vett részt a Kárpát-medence minden régiójából.',
    'Beszámolók',
    true,
    now() - interval '30 days'
  );