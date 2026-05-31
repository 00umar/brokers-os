import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile, UserRole } from '../../lib/database.types';
import {
  Plus, Mail, Shield, User, Clock, CheckCircle2,
  Ban, Loader2, X, Send, Users,
} from 'lucide-react';

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Full access — can manage team and all modules' },
  { value: 'manager', label: 'Manager', desc: 'Access to all modules, cannot manage team' },
  { value: 'office_staff', label: 'Office Staff', desc: 'Brokerage, sales, and project modules' },
  { value: 'field_worker', label: 'Field Worker', desc: 'Field operations and weekly reports only' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  office_staff: 'bg-neutral-100 text-neutral-700',
  field_worker: 'bg-orange-100 text-orange-700',
  client: 'bg-green-100 text-green-700',
};

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function TeamManagement() {
  const { profile: currentUser } = useAuth();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', role: 'office_staff' as UserRole });
  const [sending, setSending] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Status change
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { fetchStaff(); }, []);

  async function fetchStaff() {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'client')
      .order('created_at', { ascending: false });
    setStaff(data ?? []);
    setLoading(false);
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.full_name) return;
    setSending(true);
    setInviteResult(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const functionUrl = `${supabaseUrl}/functions/v1/invite-user`;

    try {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: inviteForm.email,
          full_name: inviteForm.full_name,
          role: inviteForm.role,
        }),
      });

      if (res.ok) {
        setInviteResult({ ok: true, message: `Invite sent to ${inviteForm.email}. They'll receive an email to set their password.` });
        setInviteForm({ full_name: '', email: '', role: 'office_staff' });
        fetchStaff();
      } else {
        const err = await res.json().catch(() => ({}));
        setInviteResult({ ok: false, message: err.error ?? 'Failed to send invite. Make sure the Edge Function is deployed.' });
      }
    } catch {
      setInviteResult({ ok: false, message: 'Could not reach the invite function. See setup instructions below.' });
    }
    setSending(false);
  }

  async function updateStatus(id: string, status: 'active' | 'suspended') {
    setUpdatingId(id);
    await supabase.from('profiles').update({ status }).eq('id', id);
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    setUpdatingId(null);
  }

  const activeCount = staff.filter(s => s.status === 'active').length;
  const pendingCount = staff.filter(s => s.status === 'pending').length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Team Management</h1>
          <p className="text-sm text-neutral-500 mt-1">Invite staff and manage account access</p>
        </div>
        <button
          onClick={() => { setShowInvite(true); setInviteResult(null); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Invite Staff
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Staff', value: staff.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'bg-amber-50 text-amber-600' },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-5 flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-neutral-500">{m.label}</p>
                <p className="text-xl sm:text-2xl font-semibold text-neutral-900 mt-1">{m.value}</p>
              </div>
              <div className={`p-2 sm:p-2.5 rounded-lg ${m.color}`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : staff.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-500 font-medium">No staff yet</p>
            <p className="text-sm text-neutral-400 mt-1">Invite your first team member above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[620px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {staff.map(member => (
                <tr key={member.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold flex-shrink-0">
                        {initials(member.full_name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {member.full_name}
                          {member.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-neutral-400">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-700'}`}>
                      {member.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[member.status ?? 'pending'] ?? 'bg-gray-100 text-gray-700'}`}>
                      {member.status ?? 'pending'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-neutral-500">
                    {new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    {member.id !== currentUser?.id && (
                      <div className="flex items-center gap-2">
                        {member.status !== 'active' && (
                          <button
                            onClick={() => updateStatus(member.id, 'active')}
                            disabled={updatingId === member.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                          >
                            {updatingId === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Activate
                          </button>
                        )}
                        {member.status === 'active' && (
                          <button
                            onClick={() => updateStatus(member.id, 'suspended')}
                            disabled={updatingId === member.id}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                          >
                            {updatingId === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                            Suspend
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">Invite Staff Member</h2>
              <button onClick={() => { setShowInvite(false); setInviteResult(null); }} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={sendInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    required
                    value={inviteForm.full_name}
                    onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Staff member's full name"
                    className="w-full pl-9 pr-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    required
                    type="email"
                    value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="staff@765realty.com"
                    className="w-full pl-9 pr-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLE_OPTIONS.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setInviteForm(f => ({ ...f, role: r.value }))}
                      className={`px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                        inviteForm.role === r.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <p className={`text-xs font-semibold ${inviteForm.role === r.value ? 'text-blue-700' : 'text-neutral-900'}`}>{r.label}</p>
                      <p className={`text-xs mt-0.5 leading-tight ${inviteForm.role === r.value ? 'text-blue-600' : 'text-neutral-500'}`}>{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {inviteResult && (
                <div className={`rounded-lg px-4 py-3 text-sm ${inviteResult.ok ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                  {inviteResult.message}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowInvite(false); setInviteResult(null); }}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
