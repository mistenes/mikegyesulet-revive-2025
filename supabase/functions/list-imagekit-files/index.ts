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

    // Verify user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roles) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get ImageKit credentials from settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['imagekit_private_key', 'imagekit_url_endpoint']);

    if (settingsError || !settings) {
      console.error('Error fetching settings:', settingsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch ImageKit settings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const privateKey = settings.find(s => s.setting_key === 'imagekit_private_key')?.setting_value;
    const urlEndpoint = settings.find(s => s.setting_key === 'imagekit_url_endpoint')?.setting_value;

    if (!privateKey || !urlEndpoint) {
      return new Response(JSON.stringify({ error: 'ImageKit credentials not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get parameters from request body
    const { folder = '', limit = 100 } = await req.json();

    // Create auth header
    const authString = btoa(`${privateKey}:`);

    // List files from ImageKit API (not the URL endpoint)
    const listUrl = new URL('https://api.imagekit.io/v1/files');
    if (folder) listUrl.searchParams.set('path', folder);
    listUrl.searchParams.set('limit', limit.toString());

    const listResponse = await fetch(listUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
      },
    });

    const listData = await listResponse.json();

    if (!listResponse.ok) {
      console.error('ImageKit list error:', listData);
      return new Response(JSON.stringify({ error: 'Failed to list ImageKit files', details: listData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ files: listData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in list-imagekit-files function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
