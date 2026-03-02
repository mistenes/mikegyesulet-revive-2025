
-- Create SEO meta tags table
CREATE TABLE public.seo_meta_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  og_type TEXT DEFAULT 'website',
  canonical_url TEXT,
  no_index BOOLEAN DEFAULT false,
  no_follow BOOLEAN DEFAULT false,
  structured_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_meta_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO meta tags are publicly readable"
ON public.seo_meta_tags FOR SELECT USING (true);

CREATE POLICY "Admins can manage SEO meta tags"
ON public.seo_meta_tags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create robots.txt settings table
CREATE TABLE public.seo_robots_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  robots_content TEXT NOT NULL DEFAULT 'User-agent: *
Allow: /',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seo_robots_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Robots settings are publicly readable"
ON public.seo_robots_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage robots settings"
ON public.seo_robots_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default robots settings
INSERT INTO public.seo_robots_settings (robots_content) VALUES (
'User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /'
);

-- Insert default SEO meta tags for all pages
INSERT INTO public.seo_meta_tags (page_path, page_name, meta_title, meta_description) VALUES
('/', 'Főoldal', 'MIK Egyesület - Magyar Ifjúsági Konferencia', 'A Magyar Ifjúsági Konferencia egyesület hivatalos weboldala.'),
('/rolunk', 'Rólunk', 'Rólunk - MIK Egyesület', 'Ismerd meg a Magyar Ifjúsági Konferencia egyesületet.'),
('/regiok', 'Régiók', 'Régiók - MIK Egyesület', 'A MIK régiói és tagszervezetei.'),
('/kapcsolat', 'Kapcsolat', 'Kapcsolat - MIK Egyesület', 'Lépj kapcsolatba a MIK Egyesülettel.'),
('/dokumentumok', 'Dokumentumok', 'Dokumentumok - MIK Egyesület', 'Letölthető dokumentumok és anyagok.'),
('/projektek', 'Projektek', 'Projektek - MIK Egyesület', 'A MIK Egyesület projektjei.'),
('/galeria', 'Galéria', 'Galéria - MIK Egyesület', 'Képgaléria a MIK eseményeiről.');

-- Triggers for updated_at
CREATE TRIGGER update_seo_meta_tags_updated_at
BEFORE UPDATE ON public.seo_meta_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seo_robots_updated_at
BEFORE UPDATE ON public.seo_robots_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
