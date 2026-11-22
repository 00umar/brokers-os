import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Lead, SalesTask, ActivityEntry, TaskType } from '../../lib/database.types';
import {
  fetchCompanyStaff, logActivity, insertSalesTask, whatsappLink,
  TASK_TYPES, taskTypeInfo, SALES_DEPARTMENT, type StaffMember,
} from '../../lib/activity';
import {
  Plus, Search, Phone, Mail, Building2, Calendar, Users, Clock, CheckCircle2, X,
  FileText, Bell, Loader2, ArrowUpRight, Activity, MessageCircle, MessageSquare,
  UserCheck, ArrowRight, Edit3, Check, ListTodo, AlertCircle, ExternalLink,
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
const LEAD_SOURCES = ['Instagram', 'Facebook', 'TikTok', 'Referral', 'Cold Outreach', 'LinkedIn', 'Trade Show', 'Website', 'Walk-in'];
const LEAD_STATUSES: Lead['status'][] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

const ACTIVITY_CONFIG: Record<string, { icon: typeof Phone; color: string; label: string }> = {
  call: { icon: Phone, color: 'bg-blue-50 text-blue-600', label: 'Call' },
  inspection: { icon: Building2, color: 'bg-amber-50 text-amber-700', label: 'Inspection' },
  meeting: { icon: Calendar, color: 'bg-purple-50 text-purple-600', label: 'Meeting' },
  send_details: { icon: FileText, color: 'bg-purple-50 text-purple-600', label: 'Details sent' },
  note: { icon: MessageSquare, color: 'bg-neutral-100 text-neutral-600', label: 'Note' },
  task_done: { icon: CheckCircle2, color: 'bg-green-50 text-green-600', label: 'Task done' },
  task_created: { icon: ListTodo, color: 'bg-blue-50 text-blue-600', label: 'Task' },
  handover: { icon: UserCheck, color: 'bg-indigo-50 text-indigo-600', label: 'Hand-over' },
  stage: { icon: ArrowRight, color: 'bg-cyan-50 text-cyan-700', label: 'Stage' },
  lead_created: { icon: Plus, color: 'bg-emerald-50 text-emerald-600', label: 'New lead' },
  lead_status: { icon: Activity, color: 'bg-neutral-100 text-neutral-600', label: 'Status' },
  converted: { icon: ArrowUpRight, color: 'bg-emerald-50 text-emerald-600', label: 'Converted' },
  other: { icon: Activity, color: 'bg-neutral-100 text-neutral-600', label: 'Activity' },
};

const TABS = [
  { id: 'tasks', label: 'Team Tasks' },
  { id: 'leads', label: 'Company Leads' },
  { id: 'activity', label: 'Activity Log' },
] as const;
type TabId = typeof TABS[number]['id'];

const emptyLeadForm = {
  name: '', contact_name: '', email: '', phone: '',
  source: 'Referral', notes: '', follow_up_date: '', assigned_to: '',
};

const emptyTaskForm = { action: '', task_type: 'call' as TaskType, assigned_to: '', due_date: '' };

interface DealInfo { id: string; title: string; stage: string; client_name?: string; client_phone?: string }

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const inputCls = 'w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500';

// ── Component ─────────────────────────────────────────────────────────────────

export function SalesMarketing() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | Lead['status']>('all');

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<SalesTask[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [activityReady, setActivityReady] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [deals, setDeals] = useState<Record<string, DealInfo>>({});
  const [loading, setLoading] = useState(true);

  // Add lead
  const [showAddLead, setShowAddLead] = useState(false);
  const [addLeadForm, setAddLeadForm] = useState({ ...emptyLeadForm });
  const [addLeadType, setAddLeadType] = useState('');
  const [savingLead, setSavingLead] = useState(false);

  // Lead panel
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState(false);
  const [leadEdit, setLeadEdit] = useState<Partial<Lead>>({});
  const [savingLeadEdit, setSavingLeadEdit] = useState(false);
  const [leadNote, setLeadNote] = useState('');
  const [savingLeadNote, setSavingLeadNote] = useState(false);
  const [showLeadTask, setShowLeadTask] = useState(false);
  const [leadTaskForm, setLeadTaskForm] = useState({ ...emptyTaskForm });
  const [savingLeadTask, setSavingLeadTask] = useState(false);

  // Convert to deal
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [convertClientType, setConvertClientType] = useState<'buyer' | 'seller' | 'investor'>('buyer');
  const [convertDealTitle, setConvertDealTitle] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  // Team tasks
  const [taskOwnerFilter, setTaskOwnerFilter] = useState<'mine' | 'all'>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchLeads(), fetchTasks(), fetchActivities(), fetchDeals()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCompanyStaff(profile?.company_id).then(setStaff);
  }, [profile?.company_id]);

  // ── Fetchers ──────────────────────────────────────────────────────────────

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    setLeads((data as Lead[]) ?? []);
  }

  async function fetchTasks() {
    const { data } = await supabase.from('sales_tasks').select('*').order('created_at', { ascending: false });
    setTasks((data as SalesTask[]) ?? []);
  }

  async function fetchActivities() {
    const { data, error } = await supabase
      .from('activity_log').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) { setActivityReady(false); return; }
    setActivityReady(true);
    setActivities((data as ActivityEntry[]) ?? []);
  }

  async function fetchDeals() {
    const { data } = await supabase.from('deals').select('id, title, stage, clients(name, phone)');
    const map: Record<string, DealInfo> = {};
    for (const d of (data ?? []) as unknown as { id: string; title: string; stage: string; clients?: { name?: string; phone?: string } | null }[]) {
      map[d.id] = { id: d.id, title: d.title, stage: d.stage, client_name: d.clients?.name, client_phone: d.clients?.phone };
    }
    setDeals(map);
  }

  async function record(entry: { type: string; description: string; deal_id?: string | null; lead_id?: string | null }) {
    await logActivity(profile, entry);
    fetchActivities();
  }

  const staffName = (id?: string | null) => (id ? staff.find(s => s.id === id)?.full_name ?? null : null);

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
      assigned_to: addLeadForm.assigned_to || undefined,
      status: 'new',
      company_id: profile?.company_id ?? undefined,
    }).select().single();
    if (data) {
      setLeads(p => [data as Lead, ...p]);
      record({ type: 'lead_created', description: `Added company lead "${(data as Lead).name}"${addLeadForm.source ? ` (via ${addLeadForm.source})` : ''}`, lead_id: (data as Lead).id });
    }
    setShowAddLead(false);
    setAddLeadForm({ ...emptyLeadForm });
    setAddLeadType('');
    setSavingLead(false);
  }

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setEditingLead(false);
    setLeadEdit({});
    setLeadNote('');
    setShowLeadTask(false);
    setLeadTaskForm({ ...emptyTaskForm, assigned_to: lead.assigned_to ?? '' });
  }

  function patchLead(id: string, updates: Partial<Lead>) {
    setLeads(p => p.map(l => l.id === id ? { ...l, ...updates } : l));
    setSelectedLead(l => l && l.id === id ? { ...l, ...updates } : l);
  }

  async function updateLeadStatus(lead: Lead, status: Lead['status']) {
    if (lead.status === status) return;
    await supabase.from('leads').update({ status }).eq('id', lead.id);
    patchLead(lead.id, { status });
    record({ type: 'lead_status', description: `Marked "${lead.name}" as ${status}`, lead_id: lead.id });
  }

  async function assignLead(lead: Lead, staffId: string) {
    await supabase.from('leads').update({ assigned_to: staffId || null }).eq('id', lead.id);
    patchLead(lead.id, { assigned_to: staffId || undefined });
    const who = staffName(staffId);
    record({ type: 'handover', description: who ? `Handed company lead "${lead.name}" to ${who}` : `Unassigned company lead "${lead.name}"`, lead_id: lead.id });
  }

  async function saveLeadEdit() {
    if (!selectedLead) return;
    setSavingLeadEdit(true);
    const updates = {
      name: leadEdit.name ?? selectedLead.name,
      contact_name: leadEdit.contact_name ?? selectedLead.contact_name ?? null,
      phone: leadEdit.phone ?? selectedLead.phone ?? null,
      email: leadEdit.email ?? selectedLead.email ?? null,
      lead_type: leadEdit.lead_type ?? selectedLead.lead_type ?? null,
      source: leadEdit.source ?? selectedLead.source ?? null,
      follow_up_date: (leadEdit.follow_up_date ?? selectedLead.follow_up_date) || null,
    };
    const { error } = await supabase.from('leads').update(updates).eq('id', selectedLead.id);
    if (!error) patchLead(selectedLead.id, updates as Partial<Lead>);
    setSavingLeadEdit(false);
    setEditingLead(false);
  }

  async function addLeadNote() {
    if (!selectedLead || !leadNote.trim()) return;
    setSavingLeadNote(true);
    if (activityReady) {
      await record({ type: 'note', description: leadNote.trim(), lead_id: selectedLead.id });
    } else {
      // Fallback before the activity log table exists: append to the lead's notes field
      const stamp = new Date().toLocaleDateString('en-GB');
      const notes = `${selectedLead.notes ? selectedLead.notes + '\n' : ''}[${stamp} · ${profile?.full_name ?? 'Team'}] ${leadNote.trim()}`;
      await supabase.from('leads').update({ notes }).eq('id', selectedLead.id);
      patchLead(selectedLead.id, { notes });
    }
    setLeadNote('');
    setSavingLeadNote(false);
  }

  async function addLeadTask() {
    if (!selectedLead || !leadTaskForm.action.trim()) return;
    setSavingLeadTask(true);
    const who = staffName(leadTaskForm.assigned_to);
    const { data } = await insertSalesTask({
      lead_id: selectedLead.id,
      subject: selectedLead.name,
      action: leadTaskForm.action.trim(),
      task_type: leadTaskForm.task_type,
      assigned_to: leadTaskForm.assigned_to || null,
      assigned_to_name: who ?? undefined,
      due_date: leadTaskForm.due_date || undefined,
      status: 'pending',
      company_id: profile?.company_id ?? undefined,
    });
    if (data) {
      setTasks(p => [data as SalesTask, ...p]);
      record({ type: 'task_created', description: `New ${taskTypeInfo(leadTaskForm.task_type).label.toLowerCase()} task for "${selectedLead.name}"${who ? ` — ${who}` : ''}: ${leadTaskForm.action.trim()}`, lead_id: selectedLead.id });
      setLeadTaskForm({ ...emptyTaskForm, assigned_to: selectedLead.assigned_to ?? '' });
      setShowLeadTask(false);
    }
    setSavingLeadTask(false);
  }

  // ── Convert to deal ───────────────────────────────────────────────────────

  function openConvert(lead: Lead) {
    setConvertingLead(lead);
    setConvertClientType('buyer');
    setConvertDealTitle(`${lead.name} — Deal`);
    setConvertSuccess(null);
    setConvertError(null);
    setConverting(false);
  }

  async function convertToDeal() {
    if (!convertingLead) return;
    setConverting(true);
    setConvertError(null);
    const { data: client, error: clientErr } = await supabase.from('clients').insert({
      name: convertingLead.contact_name || convertingLead.name,
      email: convertingLead.email ?? undefined,
      phone: convertingLead.phone ?? undefined,
      company: convertingLead.company ?? convertingLead.name,
      type: convertClientType,
      company_id: profile?.company_id ?? undefined,
    }).select().single();
    if (clientErr || !client) {
      setConvertError(clientErr?.message ?? 'Could not create the client.');
      setConverting(false);
      return;
    }
    const { data: deal, error: dealErr } = await supabase.from('deals').insert({
      client_id: client.id,
      title: convertDealTitle,
      stage: 'new',
      payment_status: 'pending',
      assigned_broker: convertingLead.assigned_to || undefined,
      company_id: profile?.company_id ?? undefined,
    }).select().single();
    if (dealErr || !deal) {
      setConvertError(dealErr?.message ?? 'Could not create the deal.');
      setConverting(false);
      return;
    }
    await supabase.from('leads').update({ status: 'converted' }).eq('id', convertingLead.id);
    patchLead(convertingLead.id, { status: 'converted' });
    record({ type: 'converted', description: `Converted "${convertingLead.name}" into deal "${convertDealTitle}"`, lead_id: convertingLead.id, deal_id: deal.id });
    fetchDeals();
    setConverting(false);
    setConvertSuccess(deal.id);
  }

  // ── Task handlers ─────────────────────────────────────────────────────────

  async function completeTask(task: SalesTask) {
    setCompletingTaskId(task.id);
    const completed_at = new Date().toISOString();
    let { error } = await supabase.from('sales_tasks').update({ status: 'completed', completed_at }).eq('id', task.id);
    if (error) ({ error } = await supabase.from('sales_tasks').update({ status: 'completed' }).eq('id', task.id));
    if (!error) {
      setTasks(p => p.map(t => t.id === task.id ? { ...t, status: 'completed' as const, completed_at } : t));
      const kind = task.task_type && task.task_type !== 'other' ? task.task_type : 'task_done';
      record({ type: kind, description: `Done: ${task.action} (re: ${task.subject})`, deal_id: task.deal_id ?? null, lead_id: task.lead_id ?? null });
    }
    setCompletingTaskId(null);
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const isMine = (t: SalesTask) =>
    t.assigned_to ? t.assigned_to === profile?.id : !!profile?.full_name && t.assigned_to_name === profile.full_name;

  const filteredLeads = leads.filter(l =>
    (leadStatusFilter === 'all' || l.status === leadStatusFilter) &&
    (!searchQuery ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTasks = tasks.filter(t =>
    (taskStatusFilter === 'all' || t.status === taskStatusFilter) &&
    (taskOwnerFilter === 'all' || isMine(t))
  );

  const weekAgo = Date.now() - 7 * 86_400_000;
  const activeLeadsCount = leads.filter(l => !['converted', 'lost'].includes(l.status)).length;
  const convertedCount = leads.filter(l => l.status === 'converted').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueCount = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < new Date(new Date().toDateString())).length;
  const doneThisWeek = tasks.filter(t => t.status === 'completed' && t.completed_at && new Date(t.completed_at).getTime() > weekAgo).length;
  const activitiesThisWeek = activities.filter(a => new Date(a.created_at).getTime() > weekAgo).length;
  const myPending = pendingTasks.filter(isMine).length;

  const metrics = [
    { label: 'Open Tasks', value: String(pendingTasks.length), change: overdueCount > 0 ? `${overdueCount} overdue` : `${myPending} assigned to me`, icon: Bell, color: overdueCount > 0 ? 'orange' : 'blue' },
    { label: 'Done This Week', value: String(doneThisWeek), change: 'Tasks completed', icon: CheckCircle2, color: 'green' },
    { label: 'Company Leads', value: String(activeLeadsCount), change: `${convertedCount} converted`, icon: Users, color: 'purple' },
    { label: 'Activities This Week', value: activityReady ? String(activitiesThisWeek) : '—', change: 'Calls, inspections, notes…', icon: Activity, color: 'green' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const leadActivities = useMemo(
    () => (selectedLead ? activities.filter(a => a.lead_id === selectedLead.id) : []),
    [activities, selectedLead],
  );
  const leadTasks = selectedLead ? tasks.filter(t => t.lead_id === selectedLead.id) : [];

  // ── Small render helpers ──────────────────────────────────────────────────

  function StaffSelect({ value, onChange, placeholder = 'Select team member', className = inputCls }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
    const sales = staff.filter(s => s.department === SALES_DEPARTMENT);
    const others = staff.filter(s => s.department !== SALES_DEPARTMENT);
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className={className}>
        <option value="">{placeholder}</option>
        {sales.length > 0 && (
          <optgroup label="Sales & Marketing team">
            {sales.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.id === profile?.id ? ' (me)' : ''}</option>)}
          </optgroup>
        )}
        <optgroup label={sales.length > 0 ? 'Others' : 'Team'}>
          {others.map(s => <option key={s.id} value={s.id}>{s.full_name}{s.id === profile?.id ? ' (me)' : ''}</option>)}
        </optgroup>
      </select>
    );
  }

  function ContactButtons({ phone, email, name, small }: { phone?: string | null; email?: string | null; name?: string; small?: boolean }) {
    const wa = whatsappLink(phone, `Hello${name ? ` ${name.split(' ')[0]}` : ''}, this is ${profile?.full_name ?? 'your agent'}.`);
    const cls = small
      ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors'
      : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors';
    return (
      <div className="flex flex-wrap gap-2">
        {phone && <a href={`tel:${phone}`} onClick={e => e.stopPropagation()} className={`${cls} bg-blue-50 text-blue-700 hover:bg-blue-100`}><Phone className="w-3.5 h-3.5" /> Call</a>}
        {wa && <a href={wa} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className={`${cls} bg-green-50 text-green-700 hover:bg-green-100`}><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>}
        {email && !small && <a href={`mailto:${email}`} className={`${cls} bg-neutral-100 text-neutral-700 hover:bg-neutral-200`}><Mail className="w-3.5 h-3.5" /> Email</a>}
      </div>
    );
  }

  function TaskForm({ form, setForm, onSave, onCancel, saving }: {
    form: typeof emptyTaskForm; setForm: (f: typeof emptyTaskForm) => void; onSave: () => void; onCancel: () => void; saving: boolean;
  }) {
    return (
      <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-200">
        <div className="flex flex-wrap gap-1.5">
          {TASK_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => setForm({ ...form, task_type: t.value })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${form.task_type === t.value ? `${t.color} border-current` : 'border-neutral-200 text-neutral-600 bg-white hover:bg-neutral-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <input value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} placeholder="What needs to be done? e.g. Call to confirm budget" className={inputCls} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Who is doing it?</label>
            {StaffSelect({ value: form.assigned_to, onChange: v => setForm({ ...form, assigned_to: v }) })}
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Due date</label>
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-100 bg-white">Cancel</button>
          <button onClick={onSave} disabled={saving || !form.action.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add task
          </button>
        </div>
      </div>
    );
  }

  function ActivityRow({ a }: { a: ActivityEntry }) {
    const cfg = ACTIVITY_CONFIG[a.type] ?? ACTIVITY_CONFIG.other;
    const Icon = cfg.icon;
    const deal = a.deal_id ? deals[a.deal_id] : undefined;
    return (
      <div className="p-4 flex gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.color}`}><Icon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-neutral-900">
              <span className="font-medium">{a.actor_name ?? 'Someone'}</span>
              <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 uppercase tracking-wide">{cfg.label}</span>
            </p>
            <span className="text-xs text-neutral-400 whitespace-nowrap">{timeAgo(a.created_at)}</span>
          </div>
          <p className="text-sm text-neutral-700 mt-0.5 break-words">{a.description}</p>
          {deal && (
            <button onClick={() => navigate(`/app/brokerage?deal=${deal.id}`)} className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
              Open deal <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  const activityMissingNote = (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">
        The activity log isn't switched on yet. Run <strong>section 14</strong> of <code>migrations_pending.sql</code> in Supabase → SQL Editor, then refresh.
      </p>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Sales & Marketing</h1>
          <p className="text-sm text-neutral-500 mt-1">The team's calls, inspections and follow-ups — plus company leads and a record of everything done</p>
        </div>
        <button onClick={() => setShowAddLead(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Add Company Lead
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-neutral-200 p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{metric.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-2">{metric.value}</p>
                  <p className="text-xs md:text-sm text-neutral-500 mt-1">{metric.change}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${colorClasses[metric.color]}`}><Icon className="w-5 h-5" /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
              {tab.label}
              {tab.id === 'tasks' && pendingTasks.length > 0 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">{pendingTasks.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>
      ) : (
        <>
          {/* ── TEAM TASKS ── */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
                  {(['all', 'mine'] as const).map(f => (
                    <button key={f} onClick={() => setTaskOwnerFilter(f)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${taskOwnerFilter === f ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                      {f === 'mine' ? 'My tasks' : 'Whole team'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
                  {(['pending', 'completed', 'all'] as const).map(f => (
                    <button key={f} onClick={() => setTaskStatusFilter(f)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${taskStatusFilter === f ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                      {f === 'pending' ? 'To do' : f === 'completed' ? 'Done' : 'All'}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">{taskOwnerFilter === 'mine' ? 'No tasks assigned to you' : 'No tasks here'}</p>
                  <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
                    Tasks are created from a deal in Brokerage Operations (To-do) or from a company lead. They show up here for the person doing them.
                  </p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = task.status === 'pending' && task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());
                  const deal = task.deal_id ? deals[task.deal_id] : undefined;
                  const lead = task.lead_id ? leads.find(l => l.id === task.lead_id) : undefined;
                  const contactName = deal?.client_name ?? lead?.contact_name ?? lead?.name;
                  const contactPhone = deal?.client_phone ?? lead?.phone;
                  const type = taskTypeInfo(task.task_type);
                  const who = task.assigned_to ? staffName(task.assigned_to) ?? task.assigned_to_name : task.assigned_to_name;
                  return (
                    <div key={task.id} className={`bg-white rounded-xl border p-4 md:p-5 ${isOverdue ? 'border-red-200' : 'border-neutral-200'}`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-blue-500'}`} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[11px] px-2 py-0.5 rounded font-semibold uppercase tracking-wide ${type.color}`}>{type.label}</span>
                              <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>{task.action}</p>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                              {deal ? 'Deal' : lead ? 'Company lead' : 'Re'}: <span className="text-neutral-700">{task.subject}</span>
                              {contactName && <> · Client: <span className="text-neutral-700">{contactName}</span></>}
                              {contactPhone && <> · {contactPhone}</>}
                            </p>
                            <div className="flex items-center gap-3 mt-2 flex-wrap text-xs">
                              {task.due_date && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-neutral-600'}`}>
                                  <Clock className="w-3 h-3" /> Due {fmtDate(task.due_date)}{isOverdue && ' — overdue'}
                                </span>
                              )}
                              <span className="text-neutral-500 flex items-center gap-1"><UserCheck className="w-3 h-3" />{who ?? 'Unassigned'}</span>
                              {task.status === 'completed' && task.completed_at && <span className="text-green-600">Done {timeAgo(task.completed_at)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 md:justify-end flex-shrink-0">
                          {task.status === 'pending' && <ContactButtons phone={contactPhone} name={contactName} small />}
                          {deal && (
                            <button onClick={() => navigate(`/app/brokerage?deal=${deal.id}`)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                              <ExternalLink className="w-3.5 h-3.5" /> Open deal
                            </button>
                          )}
                          {lead && (
                            <button onClick={() => openLead(lead)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                              <ExternalLink className="w-3.5 h-3.5" /> Open lead
                            </button>
                          )}
                          {task.status === 'pending' && (
                            <button onClick={() => completeTask(task)} disabled={completingTaskId === task.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                              {completingTaskId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Mark done
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── COMPANY LEADS ── */}
          {activeTab === 'leads' && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-500">
                Companies you do business with — developers, investors, corporates. Individual buyers from Instagram & Facebook are in <button onClick={() => navigate('/app/brokerage')} className="text-blue-600 hover:underline">Brokerage → Social Leads</button>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search leads, contacts…"
                    className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={leadStatusFilter} onChange={e => setLeadStatusFilter(e.target.value as typeof leadStatusFilter)} className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All statuses</option>
                  {LEAD_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>

              <div className="bg-white rounded-xl border border-neutral-200">
                {filteredLeads.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 font-medium">{leads.length === 0 ? 'No company leads yet' : 'No leads match'}</p>
                    <p className="text-sm text-neutral-400 mt-1">{leads.length === 0 ? 'Add your first company lead to get started.' : 'Try another search or status.'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px]">
                      <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                          {['Lead / Contact', 'Type / Source', 'Status', 'Handled By', 'Follow-up', ''].map(h => (
                            <th key={h} className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {filteredLeads.map(lead => {
                          const closed = lead.status === 'converted' || lead.status === 'lost';
                          const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date(new Date().toDateString()) && !closed;
                          return (
                            <tr key={lead.id} onClick={() => openLead(lead)} className="hover:bg-neutral-50 transition-colors cursor-pointer">
                              <td className="px-5 py-4">
                                <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
                                {lead.contact_name && <p className="text-xs text-neutral-500 mt-0.5">{lead.contact_name}</p>}
                                {lead.phone && <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                              </td>
                              <td className="px-5 py-4">
                                {lead.lead_type && <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">{lead.lead_type}</span>}
                                {lead.source && <p className="text-xs text-neutral-500 mt-1">via {lead.source}</p>}
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${LEAD_STATUS_COLORS[lead.status] ?? 'bg-gray-100 text-gray-700'}`}>{lead.status}</span>
                              </td>
                              <td className="px-5 py-4 text-sm text-neutral-700">{staffName(lead.assigned_to) ?? <span className="text-neutral-400">Unassigned</span>}</td>
                              <td className="px-5 py-4">
                                {lead.follow_up_date ? (
                                  <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-neutral-600'}`}>
                                    <Calendar className="w-3.5 h-3.5" />{new Date(lead.follow_up_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{isOverdue && ' · overdue'}
                                  </span>
                                ) : <span className="text-xs text-neutral-400">—</span>}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {!closed ? (
                                  <button onClick={e => { e.stopPropagation(); openConvert(lead); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Convert to Deal
                                  </button>
                                ) : <span className="text-xs text-neutral-400 italic">{lead.status === 'converted' ? '✓ Converted' : 'Lost'}</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── ACTIVITY LOG ── */}
          {activeTab === 'activity' && (
            <div className="space-y-3">
              {!activityReady ? activityMissingNote : activities.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                  <Activity className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">Nothing recorded yet</p>
                  <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">Every task done, note, hand-over and stage change by the team is recorded here automatically.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                  {activities.map(a => <ActivityRow key={a.id} a={a} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════ MODALS ══════════════════════════ */}

      {/* Add Lead Modal */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">Add Company Lead</h2>
              <button onClick={() => setShowAddLead(false)} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveLead} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Lead Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {LEAD_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setAddLeadType(t)}
                      className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${addLeadType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Company / Name *</label>
                  <input required value={addLeadForm.name} onChange={e => setAddLeadForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Grandview Developers" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Contact Person</label>
                  <input value={addLeadForm.contact_name} onChange={e => setAddLeadForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Full name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone / WhatsApp</label>
                  <input type="tel" value={addLeadForm.phone} onChange={e => setAddLeadForm(f => ({ ...f, phone: e.target.value }))} placeholder="0803 000 0000" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" value={addLeadForm.email} onChange={e => setAddLeadForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Source</label>
                  <select value={addLeadForm.source} onChange={e => setAddLeadForm(f => ({ ...f, source: e.target.value }))} className={inputCls}>
                    {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Next Follow-up</label>
                  <input type="date" value={addLeadForm.follow_up_date} onChange={e => setAddLeadForm(f => ({ ...f, follow_up_date: e.target.value }))} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Handled by</label>
                  {StaffSelect({ value: addLeadForm.assigned_to, onChange: v => setAddLeadForm(f => ({ ...f, assigned_to: v })), placeholder: '— Unassigned —' })}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                  <textarea rows={3} value={addLeadForm.notes} onChange={e => setAddLeadForm(f => ({ ...f, notes: e.target.value }))} placeholder="What do they want? Budget, timeline…" className={`${inputCls} resize-none`} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAddLead(false)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-sm">Cancel</button>
                <button type="submit" disabled={savingLead || !addLeadForm.name.trim()} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  {savingLead && <Loader2 className="w-4 h-4 animate-spin" />} Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Deal Modal */}
      {convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Convert to Brokerage Deal</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{convertingLead.name}</p>
              </div>
              <button onClick={() => setConvertingLead(null)} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {convertSuccess ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Deal Created</h3>
                <p className="text-sm text-neutral-500 mb-5">{convertingLead.name} is now a client with an active deal in the pipeline.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setConvertingLead(null); setSelectedLead(null); }} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50">Close</button>
                  <button onClick={() => navigate(`/app/brokerage?deal=${convertSuccess}`)} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                    <ArrowUpRight className="w-4 h-4" /> Open deal
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Client Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['buyer', 'seller', 'investor'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setConvertClientType(t)}
                        className={`py-3 rounded-xl border-2 text-sm font-medium capitalize transition-all ${convertClientType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Deal Title</label>
                  <input value={convertDealTitle} onChange={e => setConvertDealTitle(e.target.value)} className={inputCls} />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-800">
                  Creates a <strong>Client</strong> and a new <strong>Deal</strong> at stage <em>New</em> in Brokerage Operations{convertingLead.assigned_to ? <>, handled by <strong>{staffName(convertingLead.assigned_to)}</strong></> : ''}. The lead is marked Converted.
                </div>
                {convertError && <p className="text-sm text-red-600">{convertError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setConvertingLead(null)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50">Cancel</button>
                  <button onClick={convertToDeal} disabled={converting || !convertDealTitle.trim()} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {converting && <Loader2 className="w-4 h-4 animate-spin" />} Convert to Deal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lead Panel */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-neutral-900 truncate">{selectedLead.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${LEAD_STATUS_COLORS[selectedLead.status]}`}>{selectedLead.status}</span>
                  {selectedLead.lead_type && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">{selectedLead.lead_type}</span>}
                  {selectedLead.source && <span className="text-xs text-neutral-500">via {selectedLead.source}</span>}
                  <span className="text-xs text-neutral-400">· added {timeAgo(selectedLead.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {editingLead ? (
                  <>
                    <button onClick={saveLeadEdit} disabled={savingLeadEdit} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
                      {savingLeadEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Save
                    </button>
                    <button onClick={() => { setEditingLead(false); setLeadEdit({}); }} className="p-1.5 hover:bg-neutral-100 rounded-lg"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <button onClick={() => setEditingLead(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                )}
                <button onClick={() => setSelectedLead(null)} className="p-1.5 hover:bg-neutral-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick contact */}
              {!editingLead && (selectedLead.phone || selectedLead.email) && (
                <ContactButtons phone={selectedLead.phone} email={selectedLead.email} name={selectedLead.contact_name ?? selectedLead.name} />
              )}

              {/* Details */}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Details</p>
                {editingLead ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([
                      ['name', 'Company / Name', 'text'], ['contact_name', 'Contact person', 'text'],
                      ['phone', 'Phone / WhatsApp', 'tel'], ['email', 'Email', 'email'],
                      ['follow_up_date', 'Next follow-up', 'date'],
                    ] as const).map(([key, label, type]) => (
                      <div key={key}>
                        <label className="block text-xs text-neutral-500 mb-1">{label}</label>
                        <input type={type} defaultValue={(selectedLead[key] as string | undefined) ?? ''} onChange={e => setLeadEdit(d => ({ ...d, [key]: e.target.value }))} className={inputCls} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Lead type</label>
                      <select defaultValue={selectedLead.lead_type ?? ''} onChange={e => setLeadEdit(d => ({ ...d, lead_type: e.target.value }))} className={inputCls}>
                        <option value="">—</option>{LEAD_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Source</label>
                      <select defaultValue={selectedLead.source ?? ''} onChange={e => setLeadEdit(d => ({ ...d, source: e.target.value }))} className={inputCls}>
                        <option value="">—</option>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div><p className="text-xs text-neutral-400">Contact person</p><p className="text-neutral-900">{selectedLead.contact_name || '—'}</p></div>
                    <div><p className="text-xs text-neutral-400">Phone / WhatsApp</p><p className="text-neutral-900">{selectedLead.phone || '—'}</p></div>
                    <div><p className="text-xs text-neutral-400">Email</p><p className="text-neutral-900 truncate">{selectedLead.email || '—'}</p></div>
                    <div><p className="text-xs text-neutral-400">Next follow-up</p><p className="text-neutral-900">{selectedLead.follow_up_date ? fmtDate(selectedLead.follow_up_date) : '—'}</p></div>
                  </div>
                )}
              </div>

              {/* Handled by + status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Handled By</p>
                  {StaffSelect({ value: selectedLead.assigned_to ?? '', onChange: v => assignLead(selectedLead, v), placeholder: '— Unassigned —' })}
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LEAD_STATUSES.map(s => (
                      <button key={s} onClick={() => updateLeadStatus(selectedLead, s)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize border transition-colors ${selectedLead.status === s ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Tasks</p>
                  {!showLeadTask && <button onClick={() => setShowLeadTask(true)} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add task</button>}
                </div>
                {showLeadTask && (
                  <div className="mb-3">
                    {TaskForm({ form: leadTaskForm, setForm: setLeadTaskForm, onSave: addLeadTask, onCancel: () => setShowLeadTask(false), saving: savingLeadTask })}
                  </div>
                )}
                {leadTasks.length === 0 && !showLeadTask ? (
                  <p className="text-sm text-neutral-400 italic">No tasks yet.</p>
                ) : (
                  <div className="space-y-2">
                    {leadTasks.map(t => {
                      const type = taskTypeInfo(t.task_type);
                      return (
                        <div key={t.id} className="flex items-center justify-between gap-3 border border-neutral-200 rounded-lg px-3 py-2">
                          <div className="min-w-0">
                            <p className={`text-sm ${t.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                              <span className={`mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${type.color}`}>{type.label}</span>{t.action}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">{(t.assigned_to ? staffName(t.assigned_to) : null) ?? t.assigned_to_name ?? 'Unassigned'}{t.due_date ? ` · due ${fmtDate(t.due_date)}` : ''}</p>
                          </div>
                          {t.status === 'pending' ? (
                            <button onClick={() => completeTask(t)} disabled={completingTaskId === t.id} className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 flex-shrink-0">
                              {completingTaskId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Mark done'}
                            </button>
                          ) : <span className="text-xs text-green-600 flex-shrink-0">✓ Done</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notes & history */}
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Notes & History</p>
                <div className="flex gap-2 mb-3">
                  <input value={leadNote} onChange={e => setLeadNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addLeadNote(); }} placeholder="Add a note — e.g. Called, wants 20 units in Ajah" className={inputCls} />
                  <button onClick={addLeadNote} disabled={savingLeadNote || !leadNote.trim()} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-1.5">
                    {savingLeadNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add
                  </button>
                </div>
                {selectedLead.notes && (
                  <div className="bg-neutral-50 rounded-lg px-4 py-3 mb-3">
                    <p className="text-xs font-medium text-neutral-500 mb-1">Notes</p>
                    <p className="text-sm text-neutral-700 whitespace-pre-line">{selectedLead.notes}</p>
                  </div>
                )}
                {activityReady ? (
                  leadActivities.length > 0 ? (
                    <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
                      {leadActivities.map(a => <ActivityRow key={a.id} a={a} />)}
                    </div>
                  ) : <p className="text-sm text-neutral-400 italic">No history yet — notes, calls and status changes will appear here.</p>
                ) : <p className="text-xs text-neutral-400">Full history appears once the activity log is switched on (section 14 of migrations_pending.sql).</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 flex gap-3">
              <button onClick={() => setSelectedLead(null)} className="flex-1 px-4 py-2.5 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50">Close</button>
              {!['converted', 'lost'].includes(selectedLead.status) && (
                <button onClick={() => openConvert(selectedLead)} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <ArrowUpRight className="w-4 h-4" /> Convert to Deal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
