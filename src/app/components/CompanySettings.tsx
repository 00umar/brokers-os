import { useState, useEffect } from 'react';
import {
  MessageCircle, Banknote, Zap, Check, Loader2,
  AlertCircle, Building2, Link2Off, Instagram, Facebook, Key, ExternalLink,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { useSocialFeed } from '../../hooks/useSocialFeed';

export function CompanySettings() {
  const { settings, loading, saving, save, createCompany } = useCompanySettings();
  const { connection, reload: reloadSocial } = useSocialFeed();

  const [companyName, setCompanyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankSort, setBankSort] = useState('');

  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [showTokenForm, setShowTokenForm] = useState(false);
  const [pageToken, setPageToken] = useState('');
  const [tokenConnecting, setTokenConnecting] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.name ?? '');
      setWhatsapp(settings.whatsapp_number ?? '');
      setBankName(settings.bank_name ?? '');
      setBankAccount(settings.bank_account_number ?? '');
      setBankSort(settings.bank_sort_code ?? '');
    }
  }, [settings]);

  async function connectWithToken() {
    const token = pageToken.trim();
    if (!token) { setTokenError('Paste your Page Access Token first.'); return; }
    if (!settings?.id) { setTokenError('No company record found.'); return; }

    setTokenConnecting(true);
    setTokenError(null);

    try {
      const pageRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`
      );
      const pageData = await pageRes.json();
      if (pageData.error) throw new Error(pageData.error.message);

      const pageId: string = pageData.id;
      const pageName: string = pageData.name;

      let igAccountId: string | null = null;
      let igUsername: string | null = null;
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`
        );
        const igData = await igRes.json();
        igAccountId = igData.instagram_business_account?.id ?? null;
        igUsername = igData.instagram_business_account?.username ?? null;
      } catch { /* no Instagram linked — fine */ }

      const { error: dbErr } = await supabase
        .from('social_connections')
        .upsert({
          company_id: settings.id,
          page_id: pageId,
          page_name: pageName,
          page_access_token: token,
          instagram_account_id: igAccountId,
          instagram_username: igUsername,
          user_access_token: null,
          token_expires_at: null,
          connected_at: new Date().toISOString(),
        }, { onConflict: 'company_id' });

      if (dbErr) throw new Error(dbErr.message);

      setPageToken('');
      setShowTokenForm(false);
      reloadSocial();
      setSaved('social');
      setTimeout(() => setSaved(null), 4000);
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : 'Failed to connect. Check the token and try again.');
    } finally {
      setTokenConnecting(false);
    }
  }

  async function disconnectSocial() {
    if (!connection?.id) return;
    const { error: err } = await supabase
      .from('social_connections')
      .delete()
      .eq('id', connection.id);
    if (!err) { reloadSocial(); setSaved('social_disconnect'); setTimeout(() => setSaved(null), 3000); }
  }

  async function handleSave(section: string, updates: Record<string, string>) {
    setError(null);
    setSaved(null);
    const { error: err } = await save(updates);
    if (err) {
      setError(String(err.message ?? err));
    } else {
      setSaved(section);
      setTimeout(() => setSaved(null), 3000);
    }
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const name = companyName.trim() || 'My Company';
    const { error: err } = await createCompany(name);
    setCreating(false);
    if (err) setError(String(err.message ?? err));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Database not ready</p>
              <p className="text-sm text-amber-700 mt-1">
                Run <strong>migrations_pending.sql</strong> in Supabase SQL Editor first,
                then come back to set up your company profile.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-neutral-700">Company name</label>
          <input
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="e.g. 765 Realty Limited"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            Create company record
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Company Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          These settings apply to your whole team. Changes take effect immediately.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── WhatsApp ── */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">WhatsApp Manager Number</h2>
            <p className="text-xs text-neutral-500">Field workers use this to reach the manager from the Field Operations app</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-700">
            Phone number <span className="text-neutral-400">(digits only, include country code, no + or spaces)</span>
          </label>
          <div className="flex gap-3">
            <input
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 2348012345678"
              maxLength={15}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSave('whatsapp', { whatsapp_number: whatsapp })}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === 'whatsapp' ? <Check className="w-4 h-4" /> : null}
              {saved === 'whatsapp' ? 'Saved' : 'Save'}
            </button>
          </div>
          {whatsapp && (
            <p className="text-xs text-neutral-500">
              Preview: <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="text-green-600 hover:underline font-mono">wa.me/{whatsapp}</a>
            </p>
          )}
        </div>
      </section>

      {/* ── Bank Details ── */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Bank Details</h2>
            <p className="text-xs text-neutral-500">Appears in Settlement Instruction letters generated from Brokerage Operations</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Bank name</label>
            <input
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="e.g. First Bank of Nigeria"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Account number</label>
            <input
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              placeholder="e.g. 0123456789"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Sort code / IBAN / Routing</label>
            <input
              value={bankSort}
              onChange={e => setBankSort(e.target.value)}
              placeholder="e.g. 011152303"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => handleSave('bank', { bank_name: bankName, bank_account_number: bankAccount, bank_sort_code: bankSort })}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === 'bank' ? <Check className="w-4 h-4" /> : null}
            {saved === 'bank' ? 'Saved' : 'Save bank details'}
          </button>
        </div>
      </section>

      {/* ── Social Media Integration ── */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Facebook & Instagram</h2>
            <p className="text-xs text-neutral-500">
              Connect once — your posts sync to CRM automatically, and interested commenters become leads
            </p>
          </div>
        </div>

        {connection && !showTokenForm ? (
          /* ── Connected state ── */
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Connected</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {connection.page_name && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Facebook Page</p>
                      <p className="text-sm font-medium text-neutral-900">{connection.page_name}</p>
                    </div>
                  </div>
                )}
                {connection.instagram_username ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Instagram</p>
                      <p className="text-sm font-medium text-neutral-900">@{connection.instagram_username}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 opacity-50">
                    <div className="w-7 h-7 rounded bg-neutral-300 flex items-center justify-center flex-shrink-0">
                      <Instagram className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Instagram</p>
                      <p className="text-xs text-neutral-400">No Instagram Business Account linked to this Page</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowTokenForm(true); setTokenError(null); setPageToken(''); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Key className="w-4 h-4" />
                Update token
              </button>
              <button
                onClick={disconnectSocial}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Link2Off className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          /* ── Token form ── */
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">How to get your Page Access Token</p>
              <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Open <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noreferrer" className="underline font-medium inline-flex items-center gap-0.5">Graph API Explorer <ExternalLink className="w-3 h-3" /></a></li>
                <li>Select your <strong>Business app</strong> from the top-right dropdown</li>
                <li>Click <strong>Generate Access Token</strong> → tick <code className="bg-blue-100 px-1 rounded">pages_show_list</code> → generate</li>
                <li>In the query field type <code className="bg-blue-100 px-1 rounded">/me/accounts</code> and click <strong>Submit</strong></li>
                <li>Copy the <code className="bg-blue-100 px-1 rounded">access_token</code> from your Page in the results</li>
                <li>Paste it below</li>
              </ol>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-700">Page Access Token</label>
              <textarea
                value={pageToken}
                onChange={e => setPageToken(e.target.value)}
                placeholder="EAAxxxxxxx..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {tokenError && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {tokenError}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={connectWithToken}
                disabled={tokenConnecting || !pageToken.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {tokenConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {tokenConnecting ? 'Connecting…' : 'Connect'}
              </button>
              {connection && (
                <button
                  onClick={() => { setShowTokenForm(false); setTokenError(null); setPageToken(''); }}
                  className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {saved === 'social' && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Check className="w-4 h-4" />
            Facebook & Instagram connected successfully
          </div>
        )}
      </section>
    </div>
  );
}
