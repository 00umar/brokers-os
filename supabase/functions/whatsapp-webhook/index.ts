import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') ?? '765crm-webhook-v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Webhook verification — Meta sends GET with hub.challenge to confirm endpoint
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // Always return 200 quickly — Meta will retry if we're slow
  const bodyText = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return new Response('OK', { status: 200 });
  }

  if (body.object !== 'whatsapp_business_account') {
    return new Response('OK', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const entries = (body.entry as unknown[]) ?? [];

  for (const entry of entries) {
    const e = entry as { id: string; changes: unknown[] };
    const changes = e.changes ?? [];

    for (const change of changes) {
      const c = change as { field: string; value: unknown };
      if (c.field !== 'messages') continue;

      const value = c.value as {
        metadata?: { display_phone_number: string; phone_number_id: string };
        contacts?: { profile: { name: string }; wa_id: string }[];
        messages?: {
          from: string;
          id: string;
          timestamp: string;
          text?: { body: string };
          type: string;
        }[];
      };

      const messages = value.messages;
      if (!messages?.length) continue;

      const phoneNumberId = value.metadata?.phone_number_id;
      if (!phoneNumberId) continue;

      // Find company by phone_number_id
      const { data: waConn } = await supabase
        .from('whatsapp_connections')
        .select('company_id')
        .eq('phone_number_id', phoneNumberId)
        .maybeSingle();

      if (!waConn?.company_id) continue;

      // Update heartbeat
      await supabase
        .from('whatsapp_connections')
        .update({ last_message_at: new Date().toISOString() })
        .eq('phone_number_id', phoneNumberId);

      for (const msg of messages) {
        if (msg.type !== 'text') continue;

        const senderPhone = msg.from;
        const senderName =
          value.contacts?.find((c) => c.wa_id === senderPhone)?.profile.name ?? senderPhone;
        const messageText = msg.text?.body ?? '';
        const messageId = msg.id;

        // Deduplicate by Meta's message ID
        const { data: dup } = await supabase
          .from('whatsapp_leads')
          .select('id')
          .eq('whatsapp_message_id', messageId)
          .maybeSingle();
        if (dup) continue;

        // Check if this sender already has an open pipeline entry
        const { data: existingLead } = await supabase
          .from('whatsapp_leads')
          .select('client_id, deal_id')
          .eq('company_id', waConn.company_id)
          .eq('sender_phone', senderPhone)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        let clientId: string | null = existingLead?.client_id ?? null;
        let dealId: string | null = existingLead?.deal_id ?? null;

        if (!existingLead) {
          const { data: client } = await supabase
            .from('clients')
            .insert({
              name: senderName,
              phone: senderPhone,
              type: 'buyer',
              company_id: waConn.company_id,
            })
            .select('id')
            .single();

          clientId = client?.id ?? null;

          if (clientId) {
            const { data: deal } = await supabase
              .from('deals')
              .insert({
                client_id: clientId,
                title: `${senderName} — WhatsApp Lead`,
                stage: 'new',
                payment_status: 'pending',
                company_id: waConn.company_id,
              })
              .select('id')
              .single();

            dealId = deal?.id ?? null;
          }
        }

        // Log the message
        await supabase.from('whatsapp_leads').insert({
          company_id: waConn.company_id,
          sender_phone: senderPhone,
          sender_name: senderName,
          message_text: messageText,
          whatsapp_message_id: messageId,
          client_id: clientId,
          deal_id: dealId,
          received_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
        });
      }
    }
  }

  return new Response('OK', { status: 200 });
});
