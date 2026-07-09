import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Set this in Supabase secrets: supabase secrets set META_WEBHOOK_VERIFY_TOKEN=your_token
const VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') ?? 'crm765_webhook_verify';

// Keywords that indicate someone is interested in a property
const INTEREST_KEYWORDS = [
  'interested', 'price', 'contact', 'dm', 'inbox',
  'whatsapp', 'call me', 'how much', 'available',
  'details', 'buy', 'rent', 'info', 'enquiry', 'enquire',
  'more info', 'send me', 'reach me', 'i want',
];

function detectsInterest(text: string): boolean {
  const lower = text.toLowerCase();
  return INTEREST_KEYWORDS.some(kw => lower.includes(kw));
}

Deno.serve(async (req) => {
  // GET — Facebook webhook verification challenge
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const challenge = url.searchParams.get('hub.challenge');
    const token = url.searchParams.get('hub.verify_token');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge ?? '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // POST — Real-time event payload from Meta
  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: conn } = await supabase
      .from('social_connections')
      .select('company_id')
      .limit(1)
      .maybeSingle();

    if (!conn) return new Response('ok', { status: 200 });

    const entries = (body.entry as Record<string, unknown>[]) ?? [];
    const leadsToInsert: Record<string, unknown>[] = [];

    for (const entry of entries) {
      const changes = (entry.changes as Record<string, unknown>[]) ?? [];

      for (const change of changes) {
        const val = (change.value as Record<string, unknown>) ?? {};
        const field = change.field as string;

        // ── Facebook: comment on page post ───────────────────────────────
        if (body.object === 'page' && field === 'feed' && val.item === 'comment') {
          const text = (val.message as string) ?? '';
          const from = (val.from as Record<string, string>) ?? {};
          if (detectsInterest(text)) {
            leadsToInsert.push({
              company_id: conn.company_id,
              platform: 'facebook',
              commenter_name: from.name ?? 'Facebook User',
              commenter_id: from.id ?? null,
              comment_text: text,
              post_permalink: val.post_id ? `https://www.facebook.com/${val.post_id}` : null,
              status: 'new',
            });
          }
        }

        // ── Instagram: comment on media ───────────────────────────────────
        if (body.object === 'instagram' && field === 'comments') {
          const text = (val.text as string) ?? '';
          const from = (val.from as Record<string, string>) ?? {};
          if (detectsInterest(text)) {
            leadsToInsert.push({
              company_id: conn.company_id,
              platform: 'instagram',
              commenter_name: from.username ? `@${from.username}` : 'Instagram User',
              commenter_id: from.id ?? null,
              comment_text: text,
              status: 'new',
            });
          }
        }

        // ── Facebook: Lead Ad form submission ─────────────────────────────
        if (body.object === 'page' && field === 'leadgen') {
          leadsToInsert.push({
            company_id: conn.company_id,
            platform: 'facebook',
            commenter_name: 'Lead Ad Submission',
            commenter_id: (val.leadgen_id as string) ?? null,
            comment_text: `Lead form filled (ID: ${val.leadgen_id ?? 'unknown'})`,
            status: 'new',
          });
        }
      }
    }

    if (leadsToInsert.length > 0) {
      await supabase.from('social_leads').insert(leadsToInsert);
    }

    return new Response('ok', { status: 200 });
  }

  return new Response('Method Not Allowed', { status: 405 });
});
