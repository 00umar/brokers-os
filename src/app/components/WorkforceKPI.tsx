import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Smartphone,
  X,
  Loader2,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import type { Profile, WeeklyReport, ReportTaskItem, Task } from '../../lib/database.types';

type ReportWithItems = WeeklyReport & { items?: ReportTaskItem[] };

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  office_staff: 'Office Staff',
  field_worker: 'Field Worker',
  client: 'Client',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-purple-100 text-purple-700',
  office_staff: 'bg-blue-100 text-blue-700',
  field_worker: 'bg-green-100 text-green-700',
  client: 'bg-neutral-100 text-neutral-600',
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  'pending-review': 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-700',
};

export function WorkforceKPI() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { settings: companySettings } = useCompanySettings();
  const teamLabel = companySettings?.name?.trim() ? `the ${companySettings.name.trim()} management team` : 'the management team';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager';

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'staff'>('overview');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [reports, setReports] = useState<ReportWithItems[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const [showReportForm, setShowReportForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ hoursWorked: '', incidentNotes: '' });
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const [workerResponses, setWorkerResponses] = useState<Record<string, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    setProfiles(data ?? []);
    setLoadingProfiles(false);
  }, []);

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    const { data } = await supabase
      .from('weekly_reports')
      .select('*, items:report_task_items(*)')
      .order('created_at', { ascending: false });
    setReports((data as ReportWithItems[]) ?? []);
    setLoadingReports(false);
  }, []);

  const fetchAllTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at');
    setAllTasks(data ?? []);
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchReports();
    fetchAllTasks();
  }, [fetchProfiles, fetchReports, fetchAllTasks]);

  const getWorkerStats = (workerId: string) => {
    const wt = allTasks.filter(t => t.assigned_to === workerId);
    const done = wt.filter(t => t.status === 'done').length;
    const total = wt.length;
    return {
      total,
      done,
      inProgress: wt.filter(t => t.status === 'in-progress').length,
      blocked: wt.filter(t => t.status === 'blocked').length,
      performance: total > 0 ? Math.round((done / total) * 100) : null,
      tasks: wt,
    };
  };

  // Current user's tasks — used to pre-populate the report form
  const myTasks = allTasks.filter(t => t.assigned_to === profile?.id);
  const myDone = myTasks.filter(t => t.status === 'done');
  const myInProgress = myTasks.filter(t => t.status === 'in-progress');
  const myPending = myTasks.filter(t => t.status === 'pending');
  const myBlocked = myTasks.filter(t => t.status === 'blocked');

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    return monday.toISOString().split('T')[0];
  };

  const handleSubmitReport = async () => {
    if (!profile) return;
    setSavingReport(true);

    const { data: report, error } = await supabase
      .from('weekly_reports')
      .insert({
        worker_id: profile.id,
        worker_name: profile.full_name,
        week_start: getWeekStart(),
        hours_worked: formData.hoursWorked ? Number(formData.hoursWorked) : null,
        incident_notes: formData.incidentNotes || null,
        status: 'pending-review',
        company_id: profile.company_id ?? undefined,
      })
      .select()
      .single();

    if (report && myTasks.length > 0) {
      await supabase.from('report_task_items').insert(
        myTasks.map(task => ({
          report_id: report.id,
          task_name: task.name,
          done: task.status === 'done',
          evidence_urls: [],
        }))
      );
    }

    setSavingReport(false);
    if (!error) {
      setFormSubmitted(true);
      setTimeout(() => {
        setShowReportForm(false);
        setFormSubmitted(false);
        setFormData({ hoursWorked: '', incidentNotes: '' });
        fetchReports();
      }, 1800);
    }
  };

  const approveReport = async (id: string) => {
    setApprovingId(id);
    await supabase.from('weekly_reports').update({
      status: 'approved',
      reviewed_by: profile?.full_name ?? 'Manager',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    setReports(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'approved' as const, reviewed_by: profile?.full_name } : r
    ));
    setApprovingId(null);
  };

  const rejectReport = async (id: string) => {
    setApprovingId(id);
    await supabase.from('weekly_reports').update({
      status: 'rejected',
      reviewed_by: profile?.full_name ?? 'Manager',
      reviewed_at: new Date().toISOString(),
    }).eq('id', id);
    setReports(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'rejected' as const } : r
    ));
    setApprovingId(null);
  };

  const submitWorkerResponse = async (reportId: string) => {
    const text = workerResponses[reportId]?.trim();
    if (!text) return;
    setSubmittingResponse(reportId);
    await supabase.from('weekly_reports').update({ worker_response: text }).eq('id', reportId);
    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, worker_response: text } : r
    ));
    setSubmittingResponse(null);
  };

  const updateRole = async (profileId: string, newRole: string) => {
    setUpdatingRole(profileId);
    await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, role: newRole as Profile['role'] } : p
    ));
    setUpdatingRole(null);
  };

  const updateStatus = async (profileId: string, newStatus: 'active' | 'suspended') => {
    setUpdatingStatus(profileId);
    await supabase.from('profiles').update({ status: newStatus }).eq('id', profileId);
    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, status: newStatus } : p
    ));
    setUpdatingStatus(null);
  };

  const pendingReports = reports.filter(r => r.status === 'pending-review').length;
  const pendingStaff = profiles.filter(p => p.status === 'pending').length;
  const workforceCount = profiles.filter(p => p.role !== 'client' && p.status === 'active').length;
  const totalDone = allTasks.filter(t => t.status === 'done').length;
  const visibleReports = isAdmin ? reports : reports.filter(r => r.worker_id === profile?.id);

  const metrics = [
    { label: 'Total Workforce', value: workforceCount, icon: Users, color: 'blue' },
    { label: 'Pending Reports', value: pendingReports, icon: Clock, color: 'orange' },
    { label: 'Tasks Completed', value: totalDone, icon: CheckCircle2, color: 'green' },
    { label: 'Total Reports', value: reports.length, icon: FileText, color: 'purple' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const workerProfiles = profiles.filter(p =>
    p.role !== 'client' &&
    (!p.status || p.status === 'active') &&
    (p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Workforce KPI & Performance</h1>
          <p className="text-sm text-neutral-500 mt-1">Track team performance and weekly accountability</p>
        </div>
        <button
          onClick={() => setShowReportForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Submit Report
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-neutral-500">{metric.label}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-neutral-900 mt-1">{metric.value}</p>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-lg ${colorClasses[metric.color]}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200 overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {[
            { id: 'overview', label: 'Employee Overview' },
            { id: 'reports', label: 'Weekly Reports' },
            { id: 'staff', label: 'Staff Management' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
              {tab.id === 'reports' && pendingReports > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                  {pendingReports}
                </span>
              )}
              {tab.id === 'staff' && pendingStaff > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                  {pendingStaff}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search employees, reports..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* ── Employee Overview ── */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-neutral-200">
          {loadingProfiles ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : workerProfiles.length === 0 ? (
            <div className="text-center py-16 text-neutral-400 text-sm">No staff found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[580px]">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    {['Employee', 'Role', 'Tasks', 'Performance', 'Reports Submitted'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {workerProfiles.map(p => {
                    const stats = getWorkerStats(p.id);
                    const reportCount = reports.filter(r => r.worker_id === p.id).length;
                    const initials = p.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <tr key={p.id} className="hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => setSelectedEmployee(p)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{p.full_name}</p>
                              <p className="text-xs text-neutral-400">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[p.role]}`}>
                            {ROLE_LABELS[p.role]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-neutral-900">{stats.done}/{stats.total}</span>
                            {stats.blocked > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-red-500">
                                <AlertCircle className="w-3 h-3" />
                                {stats.blocked}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {stats.performance === null ? (
                            <span className="text-sm text-neutral-400">No tasks</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-neutral-100 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    stats.performance >= 75 ? 'bg-green-500' :
                                    stats.performance >= 40 ? 'bg-blue-500' : 'bg-orange-400'
                                  }`}
                                  style={{ width: `${stats.performance}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-neutral-900">{stats.performance}%</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-neutral-500">{reportCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Weekly Reports ── */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Tab header with context-aware label */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              {isAdmin
                ? `All reports — ${visibleReports.length} total, ${pendingReports} pending review`
                : `Your reports — ${visibleReports.length} submitted`}
            </p>
            {!isAdmin && (
              <button
                onClick={() => setShowReportForm(true)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Report
              </button>
            )}
          </div>

          {loadingReports ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : visibleReports.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-medium text-neutral-900 mb-1">No reports yet</h3>
              <p className="text-sm text-neutral-500 mb-4">
                {isAdmin ? 'Weekly reports submitted by staff will appear here.' : 'Submit your first weekly report to get started.'}
              </p>
              <button
                onClick={() => setShowReportForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Submit First Report
              </button>
            </div>
          ) : (
            visibleReports.map(report => {
              const items = report.items ?? [];
              const doneItems = items.filter(i => i.done);
              return (
                <div key={report.id} className="bg-white rounded-xl border border-neutral-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="text-base font-semibold text-neutral-900">
                          {report.worker_name ?? 'Unknown'}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${REPORT_STATUS_COLORS[report.status]}`}>
                          {report.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500">
                        Week of {new Date(report.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {report.hours_worked != null && ` · ${report.hours_worked}h worked`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-neutral-400 flex-shrink-0">
                      <p>{new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                      {report.status === 'approved' && report.reviewed_by && (
                        <p className="text-green-600 mt-1">Approved by {report.reviewed_by}</p>
                      )}
                      {report.status === 'rejected' && (
                        <p className="text-red-500 mt-1">Changes requested</p>
                      )}
                    </div>
                  </div>

                  {/* Incident / notes */}
                  {report.incident_notes && (
                    <div className="mb-4 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-700">
                      <p className="font-medium text-neutral-900 mb-1 text-xs uppercase tracking-wide text-neutral-500">Notes</p>
                      <p>{report.incident_notes}</p>
                    </div>
                  )}

                  {/* Task breakdown from real CRM work */}
                  {items.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                        CRM Tasks this period — {doneItems.length}/{items.length} completed
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            {item.done
                              ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                              : <Clock className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                            }
                            <span className={item.done ? 'text-neutral-400 line-through' : 'text-neutral-800'}>
                              {item.task_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin: show worker's response if any */}
                  {isAdmin && report.worker_response && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-medium text-blue-700 mb-1">Worker's Response</p>
                      <p className="text-sm text-blue-800">{report.worker_response}</p>
                    </div>
                  )}

                  {/* Review actions — admin/manager only */}
                  {isAdmin && report.status === 'pending-review' && (
                    <div className="flex gap-2 pt-4 border-t border-neutral-100">
                      <button
                        onClick={() => approveReport(report.id)}
                        disabled={approvingId === report.id}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {approvingId === report.id && <Loader2 className="w-4 h-4 animate-spin" />}
                        Approve
                      </button>
                      <button
                        onClick={() => rejectReport(report.id)}
                        disabled={approvingId === report.id}
                        className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700 disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                    </div>
                  )}

                  {/* Worker: respond to rejected report */}
                  {!isAdmin && report.status === 'rejected' && (
                    <div className="pt-4 border-t border-neutral-100">
                      {report.worker_response ? (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-medium text-blue-700 mb-1">Your Response (submitted)</p>
                          <p className="text-sm text-blue-800">{report.worker_response}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-neutral-500 mb-2">Respond to Changes Request</p>
                          <textarea
                            rows={3}
                            placeholder="Explain your position, add context, or clarify any points for the reviewer..."
                            value={workerResponses[report.id] ?? ''}
                            onChange={e => setWorkerResponses(prev => ({ ...prev, [report.id]: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => submitWorkerResponse(report.id)}
                              disabled={!workerResponses[report.id]?.trim() || submittingResponse === report.id}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {submittingResponse === report.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              Submit Response
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Staff Management ── */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-0.5">Staff account approval</p>
              <p className="text-blue-700">
                New staff register on the login page. Their account starts as <strong>Pending</strong> and cannot access the CRM until an admin approves it here. Set their role at the same time.
              </p>
            </div>
          </div>

          {loadingProfiles ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              {profiles
                .filter(p =>
                  p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .sort((a, b) => {
                  const order = { pending: 0, active: 1, suspended: 2 };
                  const sa = order[a.status ?? 'active'] ?? 1;
                  const sb = order[b.status ?? 'active'] ?? 1;
                  return sa - sb;
                })
              .map((p, idx, arr) => {
                const stats = getWorkerStats(p.id);
                const workerReports = reports.filter(r => r.worker_id === p.id);
                const initials = p.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const isExpanded = expandedProfile === p.id;
                return (
                  <div key={p.id} className={idx < arr.length - 1 ? 'border-b border-neutral-100' : ''}>
                    {/* Profile row */}
                    <div className={`p-5 flex items-center gap-4 ${
                      p.status === 'pending' ? 'bg-yellow-50 border-l-4 border-l-yellow-400' :
                      p.status === 'suspended' ? 'bg-red-50 border-l-4 border-l-red-400' : ''
                    }`}>
                      <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                        p.status === 'suspended' ? 'bg-neutral-400' : 'bg-blue-600'
                      }`}>
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-medium text-neutral-900 truncate">{p.full_name}</p>
                          {p.id === profile?.id && (
                            <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full flex-shrink-0">You</span>
                          )}
                          {p.status === 'pending' && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">Pending</span>
                          )}
                          {p.status === 'suspended' && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex-shrink-0 font-medium">Suspended</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate">{p.email}</p>
                      </div>

                      <div className="hidden md:flex items-center gap-6 text-xs text-neutral-500 flex-shrink-0">
                        <span>{stats.done}/{stats.total} tasks</span>
                        <span>{workerReports.length} reports</span>
                      </div>

                      {/* Role selector — admin only, not on own profile */}
                      {isAdmin && p.id !== profile?.id ? (
                        <div className="relative flex-shrink-0">
                          <select
                            value={p.role}
                            onChange={e => updateRole(p.id, e.target.value)}
                            disabled={updatingRole === p.id || p.status === 'pending'}
                            className={`pl-3 pr-7 py-1.5 text-xs rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none ${ROLE_COLORS[p.role]}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="office_staff">Office Staff</option>
                            <option value="field_worker">Field Worker</option>
                            <option value="client">Client</option>
                          </select>
                          {updatingRole === p.id ? (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-current pointer-events-none" />
                          ) : (
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-current pointer-events-none opacity-60" />
                          )}
                        </div>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${ROLE_COLORS[p.role]}`}>
                          {ROLE_LABELS[p.role]}
                        </span>
                      )}

                      {/* Approve / Suspend / Reactivate — admin only, not own profile */}
                      {isAdmin && p.id !== profile?.id && (
                        <>
                          {p.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(p.id, 'active')}
                              disabled={updatingStatus === p.id}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                            >
                              {updatingStatus === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Approve
                            </button>
                          )}
                          {p.status === 'active' && (
                            <button
                              onClick={() => updateStatus(p.id, 'suspended')}
                              disabled={updatingStatus === p.id}
                              className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                            >
                              {updatingStatus === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Suspend
                            </button>
                          )}
                          {p.status === 'suspended' && (
                            <button
                              onClick={() => updateStatus(p.id, 'active')}
                              disabled={updatingStatus === p.id}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                            >
                              {updatingStatus === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                              Reactivate
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => setExpandedProfile(isExpanded ? null : p.id)}
                        className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
                        title={isExpanded ? 'Collapse' : 'View activity'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                      </button>
                    </div>

                    {/* Expanded worker activity panel */}
                    {isExpanded && (
                      <div className="px-5 pb-5 bg-neutral-50 border-t border-neutral-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

                          {/* Contact info */}
                          <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Contact</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-neutral-700">
                                <Mail className="w-4 h-4 text-neutral-400" />
                                {p.email}
                              </div>
                              {p.phone && (
                                <div className="flex items-center gap-2 text-sm text-neutral-700">
                                  <Phone className="w-4 h-4 text-neutral-400" />
                                  {p.phone}
                                </div>
                              )}
                              {p.phone && (
                                <a
                                  href={`https://wa.me/${p.phone.replace(/\D/g, '')}?text=Hi ${encodeURIComponent(p.full_name)}, this is ${teamLabel}.`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors w-fit"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Message on WhatsApp
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Task summary */}
                          <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Task Summary</p>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { label: 'Done', value: stats.done, color: 'text-green-600' },
                                { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600' },
                                { label: 'Blocked', value: stats.blocked, color: 'text-red-500' },
                                { label: 'Total', value: stats.total, color: 'text-neutral-900' },
                              ].map(s => (
                                <div key={s.label} className="bg-white rounded-lg p-3 border border-neutral-200">
                                  <p className="text-xs text-neutral-500">{s.label}</p>
                                  <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Assigned tasks */}
                          {stats.tasks.length > 0 && (
                            <div className="md:col-span-2">
                              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Assigned Tasks</p>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {stats.tasks.map(task => (
                                  <div key={task.id} className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-neutral-200">
                                    {task.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                                    {task.status === 'in-progress' && <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                    {task.status === 'blocked' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                    {task.status === 'pending' && <Clock className="w-4 h-4 text-neutral-300 flex-shrink-0" />}
                                    <span className={`flex-1 ${task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                                      {task.name}
                                    </span>
                                    <span className="text-xs text-neutral-400 capitalize flex-shrink-0">
                                      {task.status.replace('-', ' ')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recent reports */}
                          {workerReports.length > 0 && (
                            <div className="md:col-span-2">
                              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
                                Recent Reports ({workerReports.length})
                              </p>
                              <div className="space-y-2">
                                {workerReports.slice(0, 3).map(r => (
                                  <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-neutral-200 text-sm">
                                    <span className="text-neutral-700">
                                      Week of {new Date(r.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${REPORT_STATUS_COLORS[r.status]}`}>
                                      {r.status.replace('-', ' ')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Field worker note */}
                          {p.role === 'field_worker' && (
                            <div className="md:col-span-2">
                              <button
                                onClick={() => navigate('/app/field')}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                <Smartphone className="w-4 h-4" />
                                View in Field Operations
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Employee Detail Modal ── */}
      {selectedEmployee && (() => {
        const emp = selectedEmployee;
        const stats = getWorkerStats(emp.id);
        const empReports = reports.filter(r => r.worker_id === emp.id);
        const initials = emp.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="p-6 border-b border-neutral-200 flex items-start justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full text-white flex items-center justify-center text-lg font-semibold flex-shrink-0 ${emp.status === 'suspended' ? 'bg-neutral-400' : 'bg-blue-600'}`}>
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-neutral-900">{emp.full_name}</h2>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[emp.role]}`}>
                        {ROLE_LABELS[emp.role]}
                      </span>
                      {emp.status === 'pending' && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
                      )}
                      {emp.status === 'suspended' && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Suspended</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-400 mt-0.5">{emp.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0 ml-2">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">

                {/* Contact */}
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Contact</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-700">
                      <Mail className="w-4 h-4 text-neutral-400" />
                      {emp.email}
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-2 text-sm text-neutral-700">
                        <Phone className="w-4 h-4 text-neutral-400" />
                        {emp.phone}
                      </div>
                    )}
                    {emp.phone && (
                      <a
                        href={`https://wa.me/${emp.phone.replace(/\D/g, '')}?text=Hi ${encodeURIComponent(emp.full_name)}, this is ${teamLabel}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors w-fit"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message on WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Performance</p>
                  {stats.performance !== null && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-neutral-600">Task Completion Rate</span>
                        <span className="text-sm font-semibold text-neutral-900">{stats.performance}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            stats.performance >= 75 ? 'bg-green-500' :
                            stats.performance >= 40 ? 'bg-blue-500' : 'bg-orange-400'
                          }`}
                          style={{ width: `${stats.performance}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Done', value: stats.done, color: 'text-green-600' },
                      { label: 'Active', value: stats.inProgress, color: 'text-blue-600' },
                      { label: 'Blocked', value: stats.blocked, color: 'text-red-500' },
                      { label: 'Total', value: stats.total, color: 'text-neutral-900' },
                    ].map(s => (
                      <div key={s.label} className="bg-neutral-50 rounded-lg p-3 text-center border border-neutral-200">
                        <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {stats.performance === null && (
                    <p className="text-sm text-neutral-400">No tasks assigned yet.</p>
                  )}
                </div>

                {/* Assigned Tasks */}
                {stats.tasks.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Assigned Tasks ({stats.tasks.length})</p>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {stats.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
                          {task.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
                          {task.status === 'in-progress' && <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                          {task.status === 'blocked' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                          {task.status === 'pending' && <Clock className="w-4 h-4 text-neutral-300 flex-shrink-0" />}
                          <span className={`flex-1 text-sm ${task.status === 'done' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>{task.name}</span>
                          <span className="text-xs text-neutral-400 capitalize flex-shrink-0">{task.status.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Reports */}
                {empReports.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Recent Reports</p>
                    <div className="space-y-2">
                      {empReports.slice(0, 3).map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200 text-sm">
                          <span className="text-neutral-700">
                            Week of {new Date(r.week_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${REPORT_STATUS_COLORS[r.status]}`}>
                            {r.status.replace('-', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Management Actions — admin only, not own profile */}
                {isAdmin && emp.id !== profile?.id && (
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">Management Actions</p>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="relative">
                        <select
                          value={emp.role}
                          onChange={e => {
                            updateRole(emp.id, e.target.value);
                            setSelectedEmployee(prev => prev ? { ...prev, role: e.target.value as Profile['role'] } : prev);
                          }}
                          disabled={updatingRole === emp.id || emp.status === 'pending'}
                          className={`pl-3 pr-7 py-2 text-sm rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none ${ROLE_COLORS[emp.role]}`}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="office_staff">Office Staff</option>
                          <option value="field_worker">Field Worker</option>
                          <option value="client">Client</option>
                        </select>
                        {updatingRole === emp.id ? (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-current pointer-events-none" />
                        ) : (
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-current pointer-events-none opacity-60" />
                        )}
                      </div>
                      {emp.status === 'pending' && (
                        <button
                          onClick={() => { updateStatus(emp.id, 'active'); setSelectedEmployee(prev => prev ? { ...prev, status: 'active' } : prev); }}
                          disabled={updatingStatus === emp.id}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {updatingStatus === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Approve Account
                        </button>
                      )}
                      {emp.status === 'active' && (
                        <button
                          onClick={() => { updateStatus(emp.id, 'suspended'); setSelectedEmployee(prev => prev ? { ...prev, status: 'suspended' } : prev); }}
                          disabled={updatingStatus === emp.id}
                          className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {updatingStatus === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Suspend
                        </button>
                      )}
                      {emp.status === 'suspended' && (
                        <button
                          onClick={() => { updateStatus(emp.id, 'active'); setSelectedEmployee(prev => prev ? { ...prev, status: 'active' } : prev); }}
                          disabled={updatingStatus === emp.id}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {updatingStatus === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Reactivate
                        </button>
                      )}
                      {emp.role === 'field_worker' && (
                        <button
                          onClick={() => { setSelectedEmployee(null); navigate('/app/field'); }}
                          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Smartphone className="w-4 h-4" />
                          Field Operations
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Submit Weekly Report Modal ── */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Submit Weekly Report</h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Week of {new Date(getWeekStart()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setShowReportForm(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSubmitted ? (
              <div className="p-12 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-neutral-900">Report Submitted!</p>
                <p className="text-sm text-neutral-500">Your weekly report is pending review.</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-6 overflow-y-auto flex-1">

                  {/* Auto-loaded task list */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-neutral-900">Your CRM Tasks (auto-loaded)</p>
                      <span className="text-xs text-neutral-500">{myTasks.length} tasks assigned to you</span>
                    </div>

                    {myTasks.length === 0 ? (
                      <div className="p-4 bg-neutral-50 rounded-lg text-sm text-neutral-500 text-center">
                        No tasks assigned to you yet in the CRM.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myDone.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-2">Completed ({myDone.length})</p>
                            <div className="space-y-1">
                              {myDone.map(t => (
                                <div key={t.id} className="flex items-center gap-2 text-sm px-3 py-2 bg-green-50 rounded-lg">
                                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <span className="text-neutral-600 line-through">{t.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {myInProgress.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-blue-700 mb-2">In Progress ({myInProgress.length})</p>
                            <div className="space-y-1">
                              {myInProgress.map(t => (
                                <div key={t.id} className="flex items-center gap-2 text-sm px-3 py-2 bg-blue-50 rounded-lg">
                                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-neutral-800">{t.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {myBlocked.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-red-700 mb-2">Blocked ({myBlocked.length})</p>
                            <div className="space-y-1">
                              {myBlocked.map(t => (
                                <div key={t.id} className="flex items-center gap-2 text-sm px-3 py-2 bg-red-50 rounded-lg">
                                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                  <span className="text-neutral-800">{t.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {myPending.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-neutral-500 mb-2">Pending ({myPending.length})</p>
                            <div className="space-y-1">
                              {myPending.map(t => (
                                <div key={t.id} className="flex items-center gap-2 text-sm px-3 py-2 bg-neutral-50 rounded-lg">
                                  <Clock className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                                  <span className="text-neutral-600">{t.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hours worked */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Hours Worked This Week</label>
                    <input
                      type="number"
                      placeholder="e.g. 40"
                      value={formData.hoursWorked}
                      onChange={e => setFormData(prev => ({ ...prev, hoursWorked: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes / incidents */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Notes / Incidents <span className="text-neutral-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any incidents, blockers, or additional context for this week..."
                      value={formData.incidentNotes}
                      onChange={e => setFormData(prev => ({ ...prev, incidentNotes: e.target.value }))}
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-neutral-200 flex justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={savingReport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingReport && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
