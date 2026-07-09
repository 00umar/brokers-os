import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify caller is an authenticated user
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Load the stored connection (tokens never leave the server)
  const { data: conn } = await supabaseAdmin
    .from('social_connections')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (!conn) {
    return new Response(JSON.stringify({ error: 'No social account connected' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const posts: Record<string, unknown>[] = [];

  // Pull Facebook Page posts
  if (conn.page_id && conn.page_access_token) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${conn.page_id}/posts` +
        `?fields=id,message,full_picture,permalink_url,created_time` +
        `&limit=20&access_token=${conn.page_access_token}`
      );
      const data = await res.json();
      for (const post of (data.data ?? [])) {
        posts.push({
          company_id: conn.company_id,
          platform: 'facebook',
          external_id: post.id,
          caption: post.message ?? null,
          media_url: post.full_picture ?? null,
          media_type: post.full_picture ? 'IMAGE' : 'TEXT',
          permalink: post.permalink_url ?? null,
          like_count: 0,
          comment_count: 0,
          posted_at: post.created_time,
          synced_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Facebook posts error:', e);
    }
  }

  // Pull Instagram posts
  if (conn.instagram_account_id && conn.page_access_token) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${conn.instagram_account_id}/media` +
        `?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count` +
        `&limit=20&access_token=${conn.page_access_token}`
      );
      const data = await res.json();
      for (const post of (data.data ?? [])) {
        posts.push({
          company_id: conn.company_id,
          platform: 'instagram',
          external_id: post.id,
          caption: post.caption ?? null,
          media_url: post.media_url ?? post.thumbnail_url ?? null,
          media_type: post.media_type ?? 'IMAGE',
          permalink: post.permalink ?? null,
          like_count: post.like_count ?? 0,
          comment_count: post.comments_count ?? 0,
          posted_at: post.timestamp,
          synced_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Instagram posts error:', e);
    }
  }

  if (posts.length > 0) {
    await supabaseAdmin
      .from('social_posts')
      .upsert(posts as Record<string, unknown>[], { onConflict: 'platform,external_id' });
  }

  return new Response(JSON.stringify({ synced: posts.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
