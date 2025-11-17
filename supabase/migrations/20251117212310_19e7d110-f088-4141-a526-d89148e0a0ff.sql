-- Update Cloudinary settings to ImageKit settings
UPDATE site_settings 
SET 
  setting_key = 'imagekit_public_key',
  setting_label = 'ImageKit Public Key'
WHERE setting_key = 'cloudinary_api_key';

UPDATE site_settings 
SET 
  setting_key = 'imagekit_private_key',
  setting_label = 'ImageKit Private Key'
WHERE setting_key = 'cloudinary_api_secret';

UPDATE site_settings 
SET 
  setting_key = 'imagekit_url_endpoint',
  setting_label = 'ImageKit URL Endpoint'
WHERE setting_key = 'cloudinary_cloud_name';

-- Add comment
COMMENT ON TABLE site_settings IS 'Stores API keys and configuration for third-party services like ImageKit';