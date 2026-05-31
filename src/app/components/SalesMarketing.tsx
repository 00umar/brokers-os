import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Lead, SalesTask } from '../../lib/database.types';
import {
  Plus, Search, Filter, Phone, Mail, Building2, Calendar,
  MoreVertical, Users, Clock, CheckCircle2, X, Handshake,
  FileText, Bell, Loader2, ArrowUpRight, Activity,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const LEAD_STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  converted: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

const LEAD_TYPES = ['Developer', 'Investor', 'Contractor', 'Agency', 'Corporate', 'Individual'];
const LEAD_SOURCES = ['Instagram', 'TikTok', 'Referral', 'Cold Outreach', 'LinkedIn', 'Trade Show', 'Website', 'Walk-in'];
const LEAD_STATUSES: Lead['status'][] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const PARTNER_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Negotiating: 'bg-orange-100 text-orange-700',
  Inactive: 'bg-gray-100 text-gray-700',
};

const ACTIVITY_CONFIG: Record<string, { icon: any; color: string }> = {
  call: { icon: Phone, color: 'bg-blue-50 text-blue-600' },
  email: { icon: Mail, color: 'bg-green-50 text-green-600' },
  meeting: { icon: Calendar, color: 'bg-purple-50 text-purple-600' },
  proposal: { icon: FileText, color: 'bg-orange-50 text-orange-600' },
  'site-visit': { icon: Building2, color: 'bg-yellow-50 text-yellow-700' },
};

const TABS = [
  { id: 'leads', label: 'Business Leads' },
  { id: 'followups', label: 'Follow-ups' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'activity', label: 'Activity Log' },
];


// Static until DB tables are added
const PARTNERSHIPS = [
  { id: 'PAR-012', name: 'BuildTech Solutions', contact: 'Femi Oladele', email: 'femi@buildtech.ng', type: 'Technology Partner', status: 'Active', since: 'Jan 2025', value: 'Software referrals', notes: 'Mutual referral agreement for CRM clients' },
  { id: 'PAR-011', name: 'LegalEdge Solicitors', contact: 'Aisha Suleiman', email: 'aisha@legaledge.com', type: 'Legal Partner', status: 'Active', since: 'Mar 2025', value: 'Property legal services', notes: 'Handles all client property documentation' },
  { id: 'PAR-010', name: 'First Trust Bank', contact: 'Chidi Eze', email: 'chidi@firsttrust.ng', type: 'Finance Partner', status: 'Negotiating', since: 'Prospect', value: 'Mortgage referrals', notes: 'Discussing mortgage referral commission structure' },
];

const ACTIVITIES = [
  { id: 'ACT-220', type: 'call', user: 'Sarah Chen', userCategory: 'Office Staff', lead: 'Jamil Builders Ltd', description: 'Discovery call — confirmed budget and timeline', timestamp: '2 hours ago' },
  { id: 'ACT-219', type: 'email', user: 'Mike Johnson', userCategory: 'Office Staff', lead: 'Verdant Construction', description: 'Sent introduction email with company profile', timestamp: '5 hours ago' },
  { id: 'ACT-218', type: 'meeting', user: 'Emily Davis', userCategory: 'Office Staff', lead: 'Prime Investors Group', description: 'In-person meeting at client office', timestamp: '1 day ago' },
  { id: 'ACT-217', type: 'proposal', user: 'Sarah Chen', userCategory: 'Office Staff', lead: 'Apex Estate Agency', description: 'Submitted service proposal document', timestamp: '1 day ago' },
];

const emptyLeadForm = {
  name: '', contact_name: '', email: '', phone: '',
  source: 'Referral', notes: '', follow_up_date: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function SalesMarketing() {
  const [activeTab, setActiveTab] = useState('leads');
  const [searchQuery, setSearchQuery] = useState('');

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesTasks, setSalesTasks] = useState<SalesTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Add lead
  const [showAddLead, setShowAddLead] = useState(false);
  const [addLeadForm, setAddLeadForm] = useState({ ...emptyLeadForm });
  const [addLeadType, setAddLeadType] = useState('');
  const [savingLead, setSavingLead] = useState(false);

  // Status dropdown
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  // Lead detail modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Convert to deal
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [convertClientType, setConvertClientType] = useState<'buyer' | 'seller' | 'investor'>('buyer');
  const [convertDealTitle, setConvertDealTitle] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState(false);

  // Follow-ups
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
    fetchSalesTasks();
  }, []);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    setLeads((data as Lead[]) ?? []);
    setLoading(false);
  }

  async function fetchSalesTasks() {
    const { data } = await supabase.from('sales_tasks').select('*').order('created_at', { ascending: false });
    setSalesTasks((data as SalesTask[]) ?? []);
  }

  // ── Lead handlers ─────────────────────────────────────────────────────────

  async function saveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!addLeadForm.name.trim()) return;
    setSavingLead(true);
    const { data } = await supabase.from('leads').insert({
      name: addLeadForm.name.trim(),
      company: addLeadForm.name.trim(),
      contact_name: addLeadForm.contact_name || undefined,
      email: addLeadForm.email || undefined,
      phone: addLeadForm.phone || undefined,
      source: addLeadForm.source || undefined,
      lead_type: addLeadType || undefined,
      notes: addLeadForm.notes || undefined,
      follow_up_date: addLeadForm.follow_up_date || undefined,
      status: 'new',
    }).select().single();
    if (data) setLeads(p => [data as Lead, ...p]);
    setShowAddLead(false);
    setAddLeadForm({ ...emptyLeadForm });
    setAddLeadType('');
    setSavingLead(false);
  }

  async function updateLeadStatus(id: string, status: Lead['status']) {
    await supabase.from('leads').update({ status }).eq('id', id);
    setLeads(p => p.map(l => l.id === id ? { ...l, status } : l));
    setStatusMenuId(null);
  }

  // ── Convert to deal ───────────────────────────────────────────────────────

  function openConvert(lead: Lead) {
    setConvertingLead(lead);
    setConvertClientType('buyer');
    setConvertDealTitle(`${lead.name} — Deal`);
    setConvertSuccess(false);
    setConverting(false);
  }

  async function convertToDeal() {
    if (!convertingLead) return;
    setConverting(true);

    const { data: client } = await supabase.from('clients').insert({
      name: convertingLead.name,
      email: convertingLead.email ?? undefined,
      phone: convertingLead.phone ?? undefined,
      company: convertingLead.company ?? undefined,
      type: convertClientType,
    }).select().single();

    if (client) {
      await supabase.from('deals').insert({
        client_id: client.id,
        title: convertDealTitle,
        stage: 'new',
        payment_status: 'pending',
      });
    }

    await supabase.from('leads').update({ status: 'converted' }).eq('id', convertingLead.id);
    setLeads(p => p.map(l => l.id === convertingLead!.id ? { ...l, status: 'converted' as const } : l));
    setConverting(false);
    setConvertSuccess(true);
  }

  // ── Task handlers ─────────────────────────────────────────────────────────

  async function completeTask(id: string) {
    setCompletingTaskId(id);
    await supabase.from('sales_tasks').update({ status: 'completed' }).eq('id', id);
    setSalesTasks(p => p.map(t => t.id === id ? { ...t, status: 'completed' as const } : t));
    setCompletingTaskId(null);
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const filteredLeads = leads.filter(l =>
    !searchQuery ||
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = salesTasks.filter(t =>
    followUpFilter === 'all' || t.status === followUpFilter
  );

  const activeLeadsCount = leads.filter(l => !['converted', 'lost'].includes(l.status)).length;
  const pendingTasksCount = salesTasks.filter(t => t.status === 'pending').length;
  const overdueCount = salesTasks.filter(t =>
    t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date()
  ).length;
  const convertedCount = leads.filter(l => l.status === 'converted').length;

  const metrics = [
    { label: 'Active Leads', value: String(activeLeadsCount), change: `${convertedCount} converted`, icon: Users, color: 'blue' },
    { label: 'Follow-ups Due', value: String(pendingTasksCount), change: overdueCount > 0 ? `${overdueCount} overdue` : 'All on track', icon: Bell, color: overdueCount > 0 ? 'orange' : 'green' },
    { label: 'Partnerships', value: '3', change: '2 active', icon: Handshake, color: 'purple' },
    { label: 'Activities This Week', value: String(ACTIVITIES.length), change: 'Last 7 days', icon: Activity, color: 'green' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Sales & Marketing</h1>
          <p className="text-sm text-neutral-500 mt-1">Business leads, follow-ups, partnerships, and team activity</p>
        </div>
        <button
          onClick={() => setShowAddLead(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{metric.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-2">{metric.value}</p>
                  <p className="text-sm text-neutral-500 mt-1">{metric.change}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${colorClasses[metric.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BUSINESS LEADS ── */}
      {activeTab === 'leads' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search leads, companies..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200">
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 font-medium">No leads yet</p>
                <p className="text-sm text-neutral-400 mt-1">Add your first lead to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Lead / Contact</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type / Source</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Follow-up</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredLeads.map((lead) => {
                      const isConverted = lead.status === 'converted' || lead.status === 'lost';
                      const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date() && !isConverted;
                      return (
                        <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-neutral-50 transition-colors cursor-pointer">
                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
                            {lead.contact_name && <p className="text-xs text-neutral-500 mt-0.5">{lead.contact_name}</p>}
                            {lead.email && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-neutral-400">
                                <Mail className="w-3 h-3" />{lead.email}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-neutral-400">
                                <Phone className="w-3 h-3" />{lead.phone}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {lead.lead_type && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                                {lead.lead_type}
                              </span>
                            )}
                            {lead.source && <p className="text-xs text-neutral-500 mt-1">via {lead.source}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${LEAD_STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-700'}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {lead.follow_up_date ? (
                              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600' : 'text-neutral-600'}`}>
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(lead.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                {isOverdue && <span className="text-red-500 font-medium ml-1">Overdue</span>}
                              </div>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {!isConverted ? (
                              <button
                                onClick={e => { e.stopPropagation(); openConvert(lead); }}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                Convert to Deal
                              </button>
                            ) : (
                              <span className="text-xs text-neutral-400 italic">
                                {lead.status === 'converted' ? '✓ Converted' : 'Lost'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── FOLLOW-UPS ── */}
      {activeTab === 'followups' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'pending', 'completed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFollowUpFilter(f)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize ${
                    followUpFilter === f
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">No follow-ups</p>
              <p className="text-sm text-neutral-400 mt-1">
                Sales tasks assigned from deals will appear here.
              </p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const isOverdue = task.status === 'pending' && task.due_date && new Date(task.due_date) < new Date();
              return (
                <div key={task.id} className="bg-white rounded-xl border border-neutral-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        task.status === 'completed' ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{task.action}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Re: {task.subject}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {task.due_date && (
                            <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-neutral-600'}`}>
                              <Clock className="w-3 h-3" />
                              Due: {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              {isOverdue && ' — Overdue'}
                            </span>
                          )}
                          {task.assigned_to_name && (
                            <span className="text-xs text-neutral-500">→ {task.assigned_to_name}</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    {task.status === 'pending' && (
                      <button
                        onClick={() => completeTask(task.id)}
                        disabled={completingTaskId === task.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex-shrink-0 disabled:opacity-50"
                      >
                        {completingTaskId === task.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle2 className="w-3.5 h-3.5" />
                        }
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── PARTNERSHIPS ── */}
      {activeTab === 'partnerships' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Add Partner
            </button>
          </div>
          {PARTNERSHIPS.map(partner => (
            <div key={partner.id} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-neutral-900">{partner.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PARTNER_STATUS_COLORS[partner.status] ?? 'bg-gray-100 text-gray-700'}`}>
                        {partner.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">{partner.type} · Since {partner.since}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-neutral-600">
                        <Users className="w-3 h-3" />{partner.contact}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-600">
                        <Mail className="w-3 h-3" />{partner.email}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 mt-2">{partner.notes}</p>
                  </div>
                </div>
                <div className="sm:text-right flex-shrink-0">
                  <p className="text-xs text-neutral-500">Partnership Value</p>
                  <p className="text-sm font-medium text-neutral-900 mt-1">{partner.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVITY LOG ── */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">All sales team activities — office staff and supervisors</p>
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {ACTIVITIES.map(activity => {
              const config = ACTIVITY_CONFIG[activity.type] ?? ACTIVITY_CONFIG.call;
              const Icon = config.icon;
              return (
                <div key={activity.id} className="p-5 hover:bg-neutral-50 transition-colors">
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-neutral-900">
                            <span className="font-medium">{activity.user}</span>
                            <span className="text-xs text-neutral-500 ml-2">({activity.userCategory})</span>
                          </p>
                          <p className="text-sm text-neutral-700 mt-0.5">{activity.description}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Lead: {activity.lead} · <span className="capitalize">{activity.type.replace('-', ' ')}</span>
                          </p>
                        </div>
                        <span className="text-xs text-neutral-400 whitespace-nowrap">{activity.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">Add Business Lead</h2>
              <button onClick={() => setShowAddLead(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveLead} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Lead Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEAD_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddLeadType(t)}
                      className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                        addLeadType === t
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Company / Name *</label>
                  <input
                    required
                    value={addLeadForm.name}
                    onChange={e => setAddLeadForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Company or individual name"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Person</label>
                  <input
                    value={addLeadForm.contact_name}
                    onChange={e => setAddLeadForm(f => ({ ...f, contact_name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={addLeadForm.phone}
                    onChange={e => setAddLeadForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+234 800 000 0000"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={addLeadForm.email}
                    onChange={e => setAddLeadForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Source</label>
                  <select
                    value={addLeadForm.source}
                    onChange={e => setAddLeadForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Next Follow-up</label>
                  <input
                    type="date"
                    value={addLeadForm.follow_up_date}
                    onChange={e => setAddLeadForm(f => ({ ...f, follow_up_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={addLeadForm.notes}
                    onChange={e => setAddLeadForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Initial notes about this lead..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddLead(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLead || !addLeadForm.name.trim()}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingLead && <Loader2 className="w-4 h-4 animate-spin" />}
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Deal Modal */}
      {convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Convert to Brokerage Deal</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{convertingLead.name}</p>
              </div>
              <button onClick={() => setConvertingLead(null)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {convertSuccess ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Deal Created</h3>
                <p className="text-sm text-neutral-500 mb-5">
                  {convertingLead.name} is now a client with an active deal in the pipeline.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConvertingLead(null)}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
                  >
                    Close
                  </button>
                  <a
                    href="/app/brokerage"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    View in Brokerage
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Client Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['buyer', 'seller', 'investor'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setConvertClientType(t)}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                          convertClientType === t
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Deal Title</label>
                  <input
                    value={convertDealTitle}
                    onChange={e => setConvertDealTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
                  This will create a <strong>Client</strong> record and open a new <strong>Deal</strong> at stage <em>New</em> in Brokerage Operations. The lead will be marked as Converted.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConvertingLead(null)}
                    className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={convertToDeal}
                    disabled={converting || !convertDealTitle.trim()}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {converting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Convert to Deal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{selectedLead.name}</h2>
                {selectedLead.contact_name && (
                  <p className="text-sm text-neutral-500 mt-0.5">Contact: {selectedLead.contact_name}</p>
                )}
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                {selectedLead.email && (
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Mail className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span className="truncate">{selectedLead.email}</span>
                  </div>
                )}
                {selectedLead.phone && (
                  <div className="flex items-center gap-2 text-sm text-neutral-700">
                    <Phone className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                    <span>{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.lead_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 font-medium">{selectedLead.lead_type}</span>
                  </div>
                )}
                {selectedLead.source && (
                  <div className="text-sm text-neutral-500">via {selectedLead.source}</div>
                )}
              </div>

              {selectedLead.follow_up_date && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  Follow-up: {new Date(selectedLead.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}

              {selectedLead.notes && (
                <div className="bg-neutral-50 rounded-lg px-4 py-3">
                  <p className="text-xs font-medium text-neutral-500 mb-1">Notes</p>
                  <p className="text-sm text-neutral-700">{selectedLead.notes}</p>
                </div>
              )}

              {/* Status change */}
              <div>
                <p className="text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wide">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {LEAD_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => { updateLeadStatus(selectedLead.id, s); setSelectedLead(l => l ? { ...l, status: s } : null); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border-2 transition-colors ${
                        selectedLead.status === s
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-neutral-100">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
                {!['converted', 'lost'].includes(selectedLead.status) && (
                  <button
                    onClick={() => { setSelectedLead(null); openConvert(selectedLead); }}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Convert to Deal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
