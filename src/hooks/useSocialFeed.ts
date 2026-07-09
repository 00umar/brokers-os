import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface SocialConnection {
  id: string;
  company_id: string;
  page_id: string | null;
  page_name: string | null;
  instagram_account_id: string | null;
  instagram_username: string | null;
  token_expires_at: string | null;
  connected_at: string;
}

export interface SocialPost {
  id: string;
  company_id: string;
  platform: 'facebook' | 'instagram';
  external_id: string;
  caption: string | null;
  media_url: string | null;
  media_type: string | null;
  permalink: string | null;
  like_count: number;
  comment_count: number;
  posted_at: string | null;
  synced_at: string;
}

export interface SocialLead {
  id: string;
  company_id: string;
  platform: 'facebook' | 'instagram';
  commenter_name: string | null;
  commenter_id: string | null;
  comment_text: string | null;
  post_caption: string | null;
  post_permalink: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'ignored';
  created_at: string;
}

export function useSocialFeed() {
  const [connection, setConnection] = useState<SocialConnection | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [leads, setLeads] = useState<SocialLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, postsRes, leadsRes] = await Promise.all([
        supabase
          .from('social_connections')
          .select('id, company_id, page_id, page_name, instagram_account_id, instagram_username, token_expires_at, connected_at')
          .limit(1)
          .maybeSingle(),
        supabase
          .from('social_posts')
          .select('*')
          .order('posted_at', { ascending: false })
          .limit(30),
        supabase
          .from('social_leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      setConnection((connRes.data as SocialConnection | null) ?? null);
      setPosts((postsRes.data ?? []) as SocialPost[]);
      setLeads((leadsRes.data ?? []) as SocialLead[]);
    } catch {
      // Tables may not exist until migrations are run
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function syncPosts() {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.functions.invoke('meta-sync-posts', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      await loadAll();
    } finally {
      setSyncing(false);
    }
  }

  async function updateLeadStatus(leadId: string, status: SocialLead['status']) {
    await supabase.from('social_leads').update({ status }).eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
  }

  return { connection, posts, leads, loading, syncing, syncPosts, updateLeadStatus, reload: loadAll };
}
