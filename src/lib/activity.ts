import { supabase } from './supabase';
import type { Profile, TaskType } from './database.types';

// ── Departments ────────────────────────────────────────────────────────────
export const SALES_DEPARTMENT = 'Sales & Marketing';
export const DEPARTMENTS = [SALES_DEPARTMENT, 'Operations', 'Field', 'Management', 'Admin'];

// ── Task types (Team Tasks / To-do) ─────────────────────────────────────────
export const TASK_TYPES: { value: TaskType; label: string; color: string }[] = [
  { value: 'call', label: 'Call client', color: 'bg-blue-100 text-blue-700' },
  { value: 'inspection', label: 'Inspection', color: 'bg-amber-100 text-amber-700' },
  { value: 'send_details', label: 'Send details', color: 'bg-purple-100 text-purple-700' },
  { value: 'meeting', label: 'Meeting', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'other', label: 'Other', color: 'bg-neutral-100 text-neutral-700' },
];
export function taskTypeInfo(t?: string | null) {
  return TASK_TYPES.find(x => x.value === t) ?? TASK_TYPES[TASK_TYPES.length - 1];
}

// ── Staff list (sales team first) ───────────────────────────────────────────
export interface StaffMember { id: string; full_name: string; role: string; department?: string | null; phone?: string | null }

export async function fetchCompanyStaff(companyId?: string | null): Promise<StaffMember[]> {
  let q = supabase
    .from('profiles')
    .select('id, full_name, role, status, department, phone, company_id')
    .neq('role', 'client')
    .order('full_name');
  if (companyId) q = q.eq('company_id', companyId);
  const { data } = await q;
  const list = ((data ?? []) as (StaffMember & { status?: string })[])
    .filter(s => s.status !== 'suspended' && s.status !== 'pending' && s.full_name);
  // Sales & Marketing team first
  return list.sort((a, b) =>
    Number(b.department === SALES_DEPARTMENT) - Number(a.department === SALES_DEPARTMENT)
    || a.full_name.localeCompare(b.full_name));
}

// ── Activity log ────────────────────────────────────────────────────────────
// Never throws: if the activity_log table isn't set up yet, the action itself still succeeds.
export async function logActivity(
  profile: Pick<Profile, 'id' | 'full_name' | 'company_id'> | null | undefined,
  entry: { type: string; description: string; deal_id?: string | null; lead_id?: string | null },
) {
  try {
    await supabase.from('activity_log').insert({
      company_id: profile?.company_id ?? null,
      actor_id: profile?.id ?? null,
      actor_name: profile?.full_name ?? 'Someone',
      type: entry.type,
      description: entry.description,
      deal_id: entry.deal_id ?? null,
      lead_id: entry.lead_id ?? null,
    });
  } catch {
    /* activity log is best-effort */
  }
}

// ── Insert a team task, falling back if new columns aren't migrated yet ─────
export async function insertSalesTask(row: Record<string, unknown>) {
  let res = await supabase.from('sales_tasks').insert(row).select().single();
  if (res.error && /task_type|assigned_to|completed_at|column/i.test(res.error.message)) {
    const { task_type: _t, assigned_to: _a, completed_at: _c, ...basic } = row;
    res = await supabase.from('sales_tasks').insert(basic).select().single();
  }
  return res;
}

export function whatsappLink(phone?: string | null, text?: string) {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '234' + digits.slice(1); // Nigerian local format
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
