-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop existing overly permissive policies on news_articles
DROP POLICY IF EXISTS "Authenticated users can insert news" ON public.news_articles;
DROP POLICY IF EXISTS "Authenticated users can update news" ON public.news_articles;
DROP POLICY IF EXISTS "Authenticated users can delete news" ON public.news_articles;

-- Create admin-only policies for news_articles
CREATE POLICY "Admins can insert news"
ON public.news_articles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update news"
ON public.news_articles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news"
ON public.news_articles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop anonymous access policies on page_content
DROP POLICY IF EXISTS "Allow anonymous insert access to page_content" ON public.page_content;
DROP POLICY IF EXISTS "Allow anonymous update access to page_content" ON public.page_content;
DROP POLICY IF EXISTS "Allow anonymous delete access to page_content" ON public.page_content;

-- Create admin-only policies for page_content
CREATE POLICY "Admins can insert page content"
ON public.page_content
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update page content"
ON public.page_content
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete page content"
ON public.page_content
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Drop anonymous access policies on site_settings (contains API keys!)
DROP POLICY IF EXISTS "Allow anonymous insert access to settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow anonymous update access to settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow anonymous delete access to settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow anonymous read access to settings" ON public.site_settings;

-- Create admin-only policies for site_settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can only read non-sensitive settings (exclude API keys)
CREATE POLICY "Public can read non-sensitive settings"
ON public.site_settings
FOR SELECT
USING (
  setting_key NOT IN ('imagekit_private_key', 'imagekit_public_key', 'imagekit_url_endpoint', 'mapbox_token')
);