import { useState, useEffect } from 'react';
import {
  MessageCircle, Banknote, Zap, Check, Loader2,
  AlertCircle, Building2, ExternalLink, Info,
} from 'lucide-react';
import { useCompanySettings } from '../../hooks/useCompanySettings';

export function CompanySettings() {
  const { settings, loading, saving, save, createCompany } = useCompanySettings();

  const [companyName, setCompanyName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankSort, setBankSort] = useState('');
  const [facebookPageId, setFacebookPageId] = useState('');

  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.name ?? '');
      setWhatsapp(settings.whatsapp_number ?? '');
      setBankName(settings.bank_name ?? '');
      setBankAccount(settings.bank_account_number ?? '');
      setBankSort(settings.bank_sort_code ?? '');
      setFacebookPageId(settings.facebook_page_id ?? '');
    }
  }, [settings]);

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

      {/* ── Integrations ── */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Integrations</h2>
            <p className="text-xs text-neutral-500">Connect your social media to pull leads automatically into Sales & Marketing</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 font-medium">How to find your Facebook Page ID</p>
            </div>
            <ol className="text-xs text-blue-700 space-y-1 pl-4 list-decimal">
              <li>Go to your Facebook Business Page</li>
              <li>Click <strong>About</strong> on the left sidebar</li>
              <li>Scroll down to find <strong>Page ID</strong> (a long number like 123456789012345)</li>
              <li>Copy and paste it below</li>
            </ol>
            <a
              href="https://www.facebook.com/help/1503421039731588"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2"
            >
              Facebook help article <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Facebook Page ID</label>
            <div className="flex gap-3">
              <input
                value={facebookPageId}
                onChange={e => setFacebookPageId(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 123456789012345"
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSave('integrations', { facebook_page_id: facebookPageId })}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === 'integrations' ? <Check className="w-4 h-4" /> : null}
                {saved === 'integrations' ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <p className="text-xs text-neutral-500">
              <strong className="text-neutral-700">WhatsApp Business API</strong> — We're working on a guided setup for this.
              When ready, you'll enter your WhatsApp Business number above and connect it here without needing technical knowledge.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
