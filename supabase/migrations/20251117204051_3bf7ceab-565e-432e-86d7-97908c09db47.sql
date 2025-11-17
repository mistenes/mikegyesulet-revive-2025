-- Add Cloudinary settings to site_settings table
INSERT INTO site_settings (setting_key, setting_label, setting_type, setting_value)
VALUES 
  ('cloudinary_cloud_name', 'Cloudinary Cloud Name', 'text', NULL),
  ('cloudinary_api_key', 'Cloudinary API Key', 'text', NULL),
  ('cloudinary_api_secret', 'Cloudinary API Secret', 'password', NULL)
ON CONFLICT (setting_key) DO NOTHING;