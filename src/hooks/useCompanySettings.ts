import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface CompanySettings {
  id: string;
  name: string;
  whatsapp_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_sort_code: string | null;
  facebook_page_id: string | null;
  plan: string;
  status: string;
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('companies')
        .select('id, name, whatsapp_number, bank_name, bank_account_number, bank_sort_code, facebook_page_id, plan, status')
        .limit(1)
        .maybeSingle();
      setSettings(data as CompanySettings | null);
    } catch {
      // companies table may not exist until migrations are run
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(updates: Partial<Omit<CompanySettings, 'id'>>) {
    if (!settings?.id) return { error: 'No company record found. Run migrations first.' };
    setSaving(true);
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', settings.id);
    if (!error) setSettings(prev => prev ? { ...prev, ...updates } : null);
    setSaving(false);
    return { error };
  }

  async function createCompany(name: string) {
    const { data, error } = await supabase
      .from('companies')
      .insert({ name })
      .select('id, name, whatsapp_number, bank_name, bank_account_number, bank_sort_code, facebook_page_id, plan, status')
      .single();
    if (data) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ company_id: data.id }).eq('id', user.id);
      }
      setSettings(data as CompanySettings);
    }
    return { data, error };
  }

  return { settings, loading, saving, save, createCompany, reload: load };
}
