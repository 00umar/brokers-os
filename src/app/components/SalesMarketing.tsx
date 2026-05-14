import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Building2,
  Calendar,
  MoreVertical,
  Users,
  Activity,
  Clock,
  CheckCircle2,
  X,
  Handshake,
  FileText,
  Bell,
} from 'lucide-react';

export function SalesMarketing() {
  const [activeTab, setActiveTab] = useState('leads');
  const [showAddLead, setShowAddLead] = useState(false);
  const [leadType, setLeadType] = useState('');

  const metrics = [
    { label: 'Active Leads', value: '34', change: '+6 this week', icon: Users, color: 'blue' },
    { label: 'Follow-ups Due', value: '12', change: '4 overdue', icon: Bell, color: 'orange' },
    { label: 'Partnerships', value: '8', change: '+2 active', icon: Handshake, color: 'purple' },
    { label: 'Activities This Week', value: '47', change: '+11 vs last week', icon: Activity, color: 'green' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const leads = [
    {
      id: 'LD-1045',
      name: 'Jamil Builders Ltd',
      contact: 'Jamil Umar',
      email: 'jamil@jbuilders.com',
      phone: '+234 801 234 5678',
      type: 'Developer',
      status: 'Qualified',
      source: 'Referral',
      estimatedValue: '₦45M',
      assignedTo: 'Sarah Chen',
      lastContact: '2 days ago',
      nextFollowUp: 'May 6, 2026',
    },
    {
      id: 'LD-1044',
      name: 'Verdant Construction',
      contact: 'Ada Okonkwo',
      email: 'ada@verdant.ng',
      phone: '+234 802 345 6789',
      type: 'Contractor',
      status: 'New',
      source: 'LinkedIn',
      estimatedValue: '₦20M',
      assignedTo: 'Mike Johnson',
      lastContact: '5 days ago',
      nextFollowUp: 'May 5, 2026',
    },
    {
      id: 'LD-1043',
      name: 'Apex Estate Agency',
      contact: 'Kunle Adeyemi',
      email: 'kunle@apex-estate.com',
      phone: '+234 803 456 7890',
      type: 'Agency',
      status: 'Proposal Sent',
      source: 'Trade Show',
      estimatedValue: '₦8M/yr',
      assignedTo: 'Sarah Chen',
      lastContact: '1 day ago',
      nextFollowUp: 'May 7, 2026',
    },
    {
      id: 'LD-1042',
      name: 'Prime Investors Group',
      contact: 'Bello Mohammed',
      email: 'bello@primeinv.com',
      phone: '+234 804 567 8901',
      type: 'Investor',
      status: 'Contacted',
      source: 'Cold Outreach',
      estimatedValue: '₦120M',
      assignedTo: 'Emily Davis',
      lastContact: '3 days ago',
      nextFollowUp: 'May 8, 2026',
    },
  ];

  const followUps = [
    {
      id: 'FU-305',
      lead: 'Jamil Builders Ltd',
      contact: 'Jamil Umar',
      assignedTo: 'Sarah Chen',
      action: 'Send updated service brochure',
      dueDate: 'May 6, 2026',
      priority: 'high',
      status: 'pending',
    },
    {
      id: 'FU-304',
      lead: 'Verdant Construction',
      contact: 'Ada Okonkwo',
      assignedTo: 'Mike Johnson',
      action: 'Schedule introductory call',
      dueDate: 'May 5, 2026',
      priority: 'high',
      status: 'overdue',
    },
    {
      id: 'FU-303',
      lead: 'Apex Estate Agency',
      contact: 'Kunle Adeyemi',
      assignedTo: 'Sarah Chen',
      action: 'Follow up on proposal decision',
      dueDate: 'May 7, 2026',
      priority: 'medium',
      status: 'pending',
    },
    {
      id: 'FU-302',
      lead: 'Prime Investors Group',
      contact: 'Bello Mohammed',
      assignedTo: 'Emily Davis',
      action: 'Send investment portfolio deck',
      dueDate: 'May 3, 2026',
      priority: 'medium',
      status: 'completed',
    },
  ];

  const partnerships = [
    {
      id: 'PAR-012',
      name: 'BuildTech Solutions',
      contact: 'Femi Oladele',
      email: 'femi@buildtech.ng',
      type: 'Technology Partner',
      status: 'Active',
      since: 'Jan 2025',
      value: 'Software referrals',
      notes: 'Mutual referral agreement for CRM clients',
    },
    {
      id: 'PAR-011',
      name: 'LegalEdge Solicitors',
      contact: 'Aisha Suleiman',
      email: 'aisha@legaledge.com',
      type: 'Legal Partner',
      status: 'Active',
      since: 'Mar 2025',
      value: 'Property legal services',
      notes: 'Handles all client property documentation',
    },
    {
      id: 'PAR-010',
      name: 'First Trust Bank',
      contact: 'Chidi Eze',
      email: 'chidi@firsttrust.ng',
      type: 'Finance Partner',
      status: 'Negotiating',
      since: 'Prospect',
      value: 'Mortgage referrals',
      notes: 'Discussing mortgage referral commission structure',
    },
  ];

  const activities = [
    {
      id: 'ACT-220',
      type: 'call',
      user: 'Sarah Chen',
      userCategory: 'Office Staff',
      lead: 'Jamil Builders Ltd',
      description: 'Discovery call — confirmed budget and timeline',
      timestamp: '2 hours ago',
    },
    {
      id: 'ACT-219',
      type: 'email',
      user: 'Mike Johnson',
      userCategory: 'Office Staff',
      lead: 'Verdant Construction',
      description: 'Sent introduction email with company profile',
      timestamp: '5 hours ago',
    },
    {
      id: 'ACT-218',
      type: 'meeting',
      user: 'Emily Davis',
      userCategory: 'Office Staff',
      lead: 'Prime Investors Group',
      description: 'In-person meeting at client office',
      timestamp: '1 day ago',
    },
    {
      id: 'ACT-217',
      type: 'proposal',
      user: 'Sarah Chen',
      userCategory: 'Office Staff',
      lead: 'Apex Estate Agency',
      description: 'Submitted service proposal document',
      timestamp: '1 day ago',
    },
    {
      id: 'ACT-216',
      type: 'site-visit',
      user: 'David Martinez',
      userCategory: 'Supervisor',
      lead: 'Jamil Builders Ltd',
      description: 'Site assessment visit for proposed project scope',
      timestamp: '2 days ago',
    },
  ];

  const leadStatusColors: Record<string, string> = {
    New: 'bg-gray-100 text-gray-700',
    Contacted: 'bg-blue-100 text-blue-700',
    Qualified: 'bg-green-100 text-green-700',
    'Proposal Sent': 'bg-purple-100 text-purple-700',
    Negotiating: 'bg-orange-100 text-orange-700',
  };

  const followUpStatusColors: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
  };

  const partnerStatusColors: Record<string, string> = {
    Active: 'bg-green-100 text-green-700',
    Negotiating: 'bg-orange-100 text-orange-700',
    Inactive: 'bg-gray-100 text-gray-700',
  };

  const activityConfig: Record<string, { icon: any; color: string }> = {
    call: { icon: Phone, color: 'bg-blue-50 text-blue-600' },
    email: { icon: Mail, color: 'bg-green-50 text-green-600' },
    meeting: { icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    proposal: { icon: FileText, color: 'bg-orange-50 text-orange-600' },
    'site-visit': { icon: Building2, color: 'bg-yellow-50 text-yellow-700' },
  };

  const tabs = [
    { id: 'leads', label: 'Business Leads' },
    { id: 'followups', label: 'Follow-ups' },
    { id: 'partnerships', label: 'Partnerships' },
    { id: 'activity', label: 'Activity Log' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Sales & Marketing</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Business leads, follow-ups, partnerships, and team activity
          </p>
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
                <div className={`p-2.5 rounded-lg ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
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

      {/* Search row for leads + partnerships */}
      {(activeTab === 'leads' || activeTab === 'partnerships') && (
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={activeTab === 'leads' ? 'Search leads, companies...' : 'Search partners...'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      )}

      {/* ── BUSINESS LEADS ── */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Lead / Contact
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Est. Value
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Next Follow-up
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-neutral-900">{lead.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{lead.contact}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        {lead.type}
                      </span>
                      <p className="text-xs text-neutral-500 mt-1">via {lead.source}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          leadStatusColors[lead.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-neutral-900">
                      {lead.estimatedValue}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-xs text-neutral-700">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {lead.nextFollowUp}
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Last: {lead.lastContact}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-900">{lead.assignedTo}</td>
                    <td className="px-5 py-4">
                      <button className="p-1 hover:bg-neutral-100 rounded transition-colors">
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FOLLOW-UPS ── */}
      {activeTab === 'followups' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['All', 'Pending', 'Overdue', 'Completed'].map((f) => (
                <button
                  key={f}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Schedule Follow-up
            </button>
          </div>

          {followUps.map((fu) => (
            <div key={fu.id} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      fu.status === 'overdue'
                        ? 'bg-red-500'
                        : fu.status === 'completed'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{fu.action}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {fu.lead} — {fu.contact}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-neutral-600">
                        <Clock className="w-3 h-3" />
                        Due: {fu.dueDate}
                      </span>
                      <span className="text-xs text-neutral-500">Assigned: {fu.assignedTo}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      followUpStatusColors[fu.status]
                    }`}
                  >
                    {fu.status}
                  </span>
                  {fu.status !== 'completed' && (
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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

          {partnerships.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-semibold text-neutral-900">{partner.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          partnerStatusColors[partner.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {partner.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      {partner.type} • Since {partner.since}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-neutral-600">
                        <Users className="w-3 h-3" />
                        {partner.contact}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-600">
                        <Mail className="w-3 h-3" />
                        {partner.email}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 mt-2">{partner.notes}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-neutral-500">Partnership Value</p>
                  <p className="text-sm font-medium text-neutral-900 mt-1">{partner.value}</p>
                  <button className="mt-2 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVITY LOG ── */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              All sales team activities — office staff and supervisors
            </p>
            <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Log Activity
            </button>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {activities.map((activity) => {
              const config = activityConfig[activity.type] ?? activityConfig.call;
              const Icon = config.icon;
              return (
                <div key={activity.id} className="p-5 hover:bg-neutral-50 transition-colors">
                  <div className="flex gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-neutral-900">
                            <span className="font-medium">{activity.user}</span>
                            <span className="text-xs text-neutral-500 ml-2">
                              ({activity.userCategory})
                            </span>
                          </p>
                          <p className="text-sm text-neutral-700 mt-0.5">{activity.description}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Lead: {activity.lead} •{' '}
                            <span className="capitalize">{activity.type.replace('-', ' ')}</span>
                          </p>
                        </div>
                        <span className="text-xs text-neutral-400 whitespace-nowrap">
                          {activity.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD LEAD MODAL ── */}
      {showAddLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-neutral-900">Add Business Lead</h2>
              <button
                onClick={() => setShowAddLead(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Lead Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Lead Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Developer', 'Investor', 'Contractor', 'Agency', 'Corporate', 'Individual'].map(
                    (t) => (
                      <button
                        key={t}
                        onClick={() => setLeadType(t)}
                        className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          leadType === t
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Company / Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Company or individual name"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Source</label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Referral</option>
                    <option>Cold Outreach</option>
                    <option>LinkedIn</option>
                    <option>Trade Show</option>
                    <option>Website</option>
                    <option>Walk-in</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Estimated Value
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₦20M or ₦5M/yr"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Assign To
                  </label>
                  <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Sarah Chen</option>
                    <option>Mike Johnson</option>
                    <option>Emily Davis</option>
                    <option>Robert Lee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Next Follow-up
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Initial notes about this lead..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowAddLead(false)}
                className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Add Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
