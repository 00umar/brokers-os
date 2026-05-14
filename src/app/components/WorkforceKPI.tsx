import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Image as ImageIcon,
  Video,
  Smartphone,
  X,
} from 'lucide-react';

interface Report {
  id: string;
  employee: string;
  category: string;
  week: string;
  kpis: Record<string, string | number>;
  evidence: string[];
  status: 'approved' | 'pending-review' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
}

export function WorkforceKPI() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showReportForm, setShowReportForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    tasksCompleted: '',
    hoursWorked: '',
    keyDeliverables: '',
    issuesResolved: '',
    summary: '',
  });

  const [reports, setReports] = useState<Report[]>([
    {
      id: 'WR-2045',
      employee: 'Sarah Chen',
      category: 'Brokers',
      week: 'Week 18, 2026',
      kpis: {
        dealsProcessed: 5,
        clientMeetings: 8,
        hoursWorked: 42,
        revenue: '₦125K',
      },
      evidence: ['meeting-notes.pdf', 'client-proposal.pdf'],
      status: 'approved',
      submittedAt: '2 days ago',
      reviewedBy: 'Operations Manager',
    },
    {
      id: 'WR-2044',
      employee: 'David Martinez',
      category: 'Supervisors',
      week: 'Week 18, 2026',
      kpis: {
        sitesInspected: 12,
        issuesResolved: 8,
        hoursWorked: 48,
        safetyChecks: 15,
      },
      evidence: ['site-photos.zip', 'inspection-report.pdf'],
      status: 'pending-review',
      submittedAt: '12 hours ago',
    },
    {
      id: 'WR-2043',
      employee: 'Robert Lee',
      category: 'Field Workers',
      week: 'Week 18, 2026',
      kpis: {
        tasksCompleted: 24,
        evidenceUploaded: 18,
        hoursWorked: 40,
        materialsUsed: 'Listed',
      },
      evidence: ['task-1-photo.jpg', 'task-2-video.mp4', 'task-3-photo.jpg'],
      status: 'pending-review',
      submittedAt: '1 day ago',
    },
  ]);

  const approveReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'approved', reviewedBy: 'You' } : r
      )
    );
  };

  const rejectReport = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
  };

  const handleSubmitReport = () => {
    const newReport: Report = {
      id: `WR-${Date.now()}`,
      employee: 'You',
      category: 'Office Staff',
      week: 'Week 18, 2026',
      kpis: {
        tasksCompleted: Number(formData.tasksCompleted) || 0,
        hoursWorked: Number(formData.hoursWorked) || 0,
        keyDeliverables: Number(formData.keyDeliverables) || 0,
        issuesResolved: Number(formData.issuesResolved) || 0,
      },
      evidence: [],
      status: 'pending-review',
      submittedAt: 'Just now',
    };
    setReports((prev) => [newReport, ...prev]);
    setFormSubmitted(true);
    setTimeout(() => {
      setShowReportForm(false);
      setFormSubmitted(false);
      setFormData({ tasksCompleted: '', hoursWorked: '', keyDeliverables: '', issuesResolved: '', summary: '' });
    }, 1800);
  };

  const kpiMetrics = [
    { label: 'Total Workforce', value: '42', change: '+3', icon: Users, color: 'blue' },
    { label: 'Avg Performance', value: '87%', change: '+5%', icon: TrendingUp, color: 'green' },
    { label: 'Pending Reports', value: String(reports.filter((r) => r.status === 'pending-review').length), change: '', icon: Clock, color: 'orange' },
    { label: 'Tasks Completed', value: '234', change: '+18', icon: CheckCircle2, color: 'purple' },
  ];

  const workforceCategories = [
    { name: 'Office Staff', count: 12, avgScore: 91, color: 'bg-blue-100 text-blue-700', icon: Users, fieldApp: false },
    { name: 'Field Workers', count: 15, avgScore: 85, color: 'bg-green-100 text-green-700', icon: Smartphone, fieldApp: true },
    { name: 'Supervisors', count: 5, avgScore: 93, color: 'bg-purple-100 text-purple-700', icon: Users, fieldApp: false },
    { name: 'Brokers', count: 6, avgScore: 89, color: 'bg-orange-100 text-orange-700', icon: Users, fieldApp: false },
    { name: 'Project Managers', count: 4, avgScore: 94, color: 'bg-indigo-100 text-indigo-700', icon: Users, fieldApp: false },
  ];

  const employees = [
    {
      id: 'EMP-1045', name: 'Sarah Chen', role: 'Senior Broker', category: 'Brokers',
      performance: 94, tasksCompleted: 28, tasksTotal: 30, lastReport: '2 days ago', status: 'excellent',
    },
    {
      id: 'EMP-1044', name: 'Mike Johnson', role: 'Project Manager', category: 'Project Managers',
      performance: 88, tasksCompleted: 22, tasksTotal: 26, lastReport: '1 day ago', status: 'good',
    },
    {
      id: 'EMP-1043', name: 'David Martinez', role: 'Site Supervisor', category: 'Supervisors',
      performance: 91, tasksCompleted: 25, tasksTotal: 28, lastReport: '12 hours ago', status: 'excellent',
    },
    {
      id: 'EMP-1042', name: 'Robert Lee', role: 'Field Technician', category: 'Field Workers',
      performance: 85, tasksCompleted: 19, tasksTotal: 24, lastReport: '1 day ago', status: 'good',
    },
  ];

  const statusColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    'needs-improvement': 'bg-orange-100 text-orange-700',
  };

  const reportStatusColors: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    'pending-review': 'bg-orange-100 text-orange-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Workforce KPI & Performance</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track employee performance and weekly accountability
          </p>
        </div>
        <button
          onClick={() => setShowReportForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Submit Weekly Report
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{metric.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-2">{metric.value}</p>
                  {metric.change && (
                    <p className="text-sm text-green-600 mt-2">{metric.change}</p>
                  )}
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
      <div className="border-b border-neutral-200">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Employee Overview' },
            { id: 'reports', label: 'Weekly Reports' },
            { id: 'categories', label: 'By Category' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
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

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search employees, reports..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Employee Overview */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  {['Employee', 'Role', 'Category', 'Performance', 'Tasks Progress', 'Last Report', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                          {employee.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{employee.name}</p>
                          <p className="text-xs text-neutral-500">{employee.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-900">{employee.role}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        employee.category === 'Field Workers'
                          ? 'bg-green-100 text-green-700'
                          : employee.category === 'Supervisors'
                          ? 'bg-purple-100 text-purple-700'
                          : employee.category === 'Brokers'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {employee.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-neutral-100 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${employee.performance}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-neutral-900">{employee.performance}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-neutral-900">
                          {employee.tasksCompleted}/{employee.tasksTotal}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-500">{employee.lastReport}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[employee.status]}`}>
                        {employee.status.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weekly Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">{report.week}</h3>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${reportStatusColors[report.status]}`}>
                      {report.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {report.employee} •{' '}
                    <span className="text-neutral-500">{report.category}</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{report.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-neutral-500">Submitted</p>
                  <p className="text-sm font-medium text-neutral-900">{report.submittedAt}</p>
                  {report.status === 'approved' && report.reviewedBy && (
                    <p className="text-xs text-green-600 mt-1">Approved by {report.reviewedBy}</p>
                  )}
                  {report.status === 'rejected' && (
                    <p className="text-xs text-red-500 mt-1">Changes requested</p>
                  )}
                </div>
              </div>

              {/* KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {Object.entries(report.kpis).map(([key, value]) => (
                  <div key={key} className="bg-neutral-50 rounded-lg p-3">
                    <p className="text-xs text-neutral-500 capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-lg font-semibold text-neutral-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Evidence */}
              {report.evidence.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-neutral-700 mb-2">
                    Evidence ({report.evidence.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {report.evidence.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg text-sm text-neutral-700"
                      >
                        {file.endsWith('.jpg') || file.endsWith('.png') ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : file.endsWith('.mp4') ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review actions */}
              {report.status === 'pending-review' && (
                <div className="flex gap-2 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => approveReport(report.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectReport(report.id)}
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-700"
                  >
                    Request Changes
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Categories View */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {workforceCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <div key={index} className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color.replace('text-', 'bg-').split(' ')[0]} bg-opacity-20`}
                      style={{ backgroundColor: undefined }}
                    >
                      <div className={`p-3 rounded-lg bg-blue-50`}>
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-neutral-900">{category.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${category.color}`}>
                          {category.count} employees
                        </span>
                      </div>
                      {category.fieldApp && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Submit weekly KPIs via the Field Operations app
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-neutral-900">{category.avgScore}%</p>
                      <p className="text-xs text-neutral-500">Avg Performance</p>
                    </div>
                    {category.fieldApp && (
                      <button
                        onClick={() => navigate('/field')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <Smartphone className="w-4 h-4" />
                        Open Field App
                      </button>
                    )}
                  </div>
                </div>

                <div className="w-full bg-neutral-100 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${category.avgScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly Report Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 sticky top-0 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Submit Weekly KPI Report</h2>
                <p className="text-sm text-neutral-500 mt-1">Week 18, 2026 • May 4–10</p>
              </div>
              <button
                onClick={() => setShowReportForm(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSubmitted ? (
              <div className="p-12 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-semibold text-neutral-900">Report Submitted!</p>
                <p className="text-sm text-neutral-500">Your weekly KPI report is pending review.</p>
              </div>
            ) : (
              <>
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium text-neutral-900">Weekly KPIs</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'tasksCompleted', label: 'Tasks Completed' },
                        { key: 'hoursWorked', label: 'Hours Worked' },
                        { key: 'keyDeliverables', label: 'Key Deliverables' },
                        { key: 'issuesResolved', label: 'Issues Resolved' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            {label}
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={formData[key as keyof typeof formData]}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, [key]: e.target.value }))
                            }
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Weekly Summary
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your key achievements, challenges, and progress this week..."
                      value={formData.summary}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, summary: e.target.value }))
                      }
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Upload Evidence
                    </label>
                    <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center">
                      <FileText className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm text-neutral-600 mb-1">Drop files here or click to upload</p>
                      <p className="text-xs text-neutral-500">Images, videos, PDFs up to 50MB</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-neutral-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                  <button
                    onClick={() => setShowReportForm(false)}
                    className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
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
