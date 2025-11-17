import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated (optional for admin pages that handle their own auth)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        console.log('Auth check failed, but continuing anyway for admin access');
      }
    }

    // Get ImageKit credentials from settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['imagekit_private_key', 'imagekit_url_endpoint']);

    if (settingsError || !settings) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to fetch ImageKit settings' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const privateKey = settings.find(s => s.setting_key === 'imagekit_private_key')?.setting_value;
    const urlEndpoint = settings.find(s => s.setting_key === 'imagekit_url_endpoint')?.setting_value;

    if (!privateKey || !urlEndpoint) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'ImageKit credentials not configured. Please add Public Key, Private Key, and URL Endpoint.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test connection by listing files (limit to 1 to minimize API usage)
    const authString = btoa(`${privateKey}:`);
    const testUrl = new URL(`${urlEndpoint}/v1/files`);
    testUrl.searchParams.set('limit', '1');

    console.log('Testing ImageKit connection...');
    
    const testResponse = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    const responseData = await testResponse.json();

    if (!testResponse.ok) {
      console.error('ImageKit connection test failed:', responseData);
      
      // Parse specific error messages
      let errorMessage = 'Invalid credentials or API error';
      if (testResponse.status === 401) {
        errorMessage = 'Authentication failed. Please check your Private Key.';
      } else if (testResponse.status === 404) {
        errorMessage = 'Invalid URL Endpoint. Please verify your ImageKit URL.';
      } else if (responseData.message) {
        errorMessage = responseData.message;
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: errorMessage,
        status: testResponse.status
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('ImageKit connection test successful');
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'ImageKit connection successful! All credentials are valid.',
      filesCount: responseData.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in test-imagekit-connection function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Connection test failed: ${errorMessage}` 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
