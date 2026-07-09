import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const META_APP_ID = Deno.env.get('META_APP_ID') ?? '';
const META_APP_SECRET = Deno.env.get('META_APP_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  let stateData: { company_id: string; origin: string } | null = null;
  try {
    stateData = JSON.parse(atob(stateRaw ?? ''));
  } catch {
    return new Response('Invalid state parameter', { status: 400 });
  }

  const redirectBase = `${stateData.origin}/app/company-settings`;

  if (oauthError || !code) {
    return Response.redirect(
      `${redirectBase}?meta=error&reason=${encodeURIComponent(oauthError ?? 'no_code')}`
    );
  }

  try {
    // 1. Exchange code for short-lived user access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&code=${code}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    // 2. Exchange for 60-day long-lived token
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );
    const longData = await longRes.json();
    if (longData.error) throw new Error(longData.error.message);
    const longToken: string = longData.access_token;
    const expiresIn: number = longData.expires_in ?? 5183944;

    // 3. Get the user's managed Pages (each page has its own never-expiring token)
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts` +
      `?fields=id,name,access_token` +
      `&access_token=${longToken}`
    );
    const pagesData = await pagesRes.json();
    if (pagesData.error) throw new Error(pagesData.error.message);

    const pages: { id: string; name: string; access_token: string }[] = pagesData.data ?? [];
    if (pages.length === 0) throw new Error('No Facebook Pages found. You must manage at least one Page.');

    const page = pages[0];

    // 4. Get the Instagram Business Account linked to this Page
    let igAccountId: string | null = null;
    let igUsername: string | null = null;
    try {
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}` +
        `?fields=instagram_business_account{id,username}` +
        `&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      igAccountId = igData.instagram_business_account?.id ?? null;
      igUsername = igData.instagram_business_account?.username ?? null;
    } catch {
      // Page has no connected Instagram — that's fine
    }

    // 5. Persist the connection
    const supabase = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: dbErr } = await supabase
      .from('social_connections')
      .upsert({
        company_id: stateData.company_id,
        page_id: page.id,
        page_name: page.name,
        page_access_token: page.access_token,
        instagram_account_id: igAccountId,
        instagram_username: igUsername,
        user_access_token: longToken,
        token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        connected_at: new Date().toISOString(),
      }, { onConflict: 'company_id' });

    if (dbErr) throw new Error(dbErr.message);

    return Response.redirect(`${redirectBase}?meta=connected`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return Response.redirect(`${redirectBase}?meta=error&reason=${encodeURIComponent(msg)}`);
  }
});
