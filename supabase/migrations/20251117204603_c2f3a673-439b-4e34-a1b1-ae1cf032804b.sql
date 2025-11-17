-- Drop existing RLS policies on site_settings
DROP POLICY IF EXISTS "Authenticated users can read settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can insert settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can delete settings" ON site_settings;

-- Create new policies that allow anonymous access (admin auth is handled at app level)
CREATE POLICY "Allow anonymous read access to settings"
ON site_settings
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous update access to settings"
ON site_settings
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous insert access to settings"
ON site_settings
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous delete access to settings"
ON site_settings
FOR DELETE
TO anon
USING (true);