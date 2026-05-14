import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
} from 'lucide-react';

export function Dashboard() {
  const kpiCards = [
    {
      title: 'Active Deals',
      value: '24',
      change: '+12%',
      trend: 'up',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Active Projects',
      value: '18',
      change: '+8%',
      trend: 'up',
      icon: FileText,
      color: 'green',
    },
    {
      title: 'Team Members',
      value: '42',
      change: '+3',
      trend: 'up',
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Pending Tasks',
      value: '127',
      change: '-15%',
      trend: 'down',
      icon: Clock,
      color: 'orange',
    },
  ];

  const activeBrokerageRequests = [
    {
      id: 'BR-1024',
      client: 'Riverstone Capital',
      type: 'Purchase',
      status: 'Inspection',
      broker: 'Sarah Chen',
      value: '$2.4M',
      priority: 'high',
    },
    {
      id: 'BR-1023',
      client: 'Metro Development Group',
      type: 'Sale',
      status: 'Negotiation',
      broker: 'Mike Johnson',
      value: '$1.8M',
      priority: 'medium',
    },
    {
      id: 'BR-1022',
      client: 'Greenfield Investments',
      type: 'Lease',
      status: 'Sourcing',
      broker: 'Emily Davis',
      value: '$450K/yr',
      priority: 'medium',
    },
  ];

  const activeProjects = [
    {
      name: 'Oakwood Tower Construction',
      manager: 'Robert Lee',
      progress: 68,
      deadline: 'Jun 15, 2026',
      status: 'On Track',
    },
    {
      name: 'Riverside Plaza Renovation',
      manager: 'Jennifer Kim',
      progress: 42,
      deadline: 'Aug 22, 2026',
      status: 'At Risk',
    },
    {
      name: 'Downtown Office Fit-out',
      manager: 'David Park',
      progress: 85,
      deadline: 'May 30, 2026',
      status: 'On Track',
    },
  ];

  const upcomingInspections = [
    {
      property: '245 Market Street, Suite 800',
      inspector: 'James Wilson',
      date: 'May 5, 2026',
      time: '10:00 AM',
    },
    {
      property: 'Industrial Park Building 7',
      inspector: 'Lisa Anderson',
      date: 'May 6, 2026',
      time: '2:30 PM',
    },
    {
      property: 'Greenfield Lot 23-A',
      inspector: 'Tom Martinez',
      date: 'May 8, 2026',
      time: '9:00 AM',
    },
  ];

  const recentActivities = [
    {
      user: 'Sarah Chen',
      action: 'closed deal',
      target: 'BR-1019',
      time: '2 hours ago',
    },
    {
      user: 'Mike Johnson',
      action: 'scheduled inspection for',
      target: '245 Market Street',
      time: '4 hours ago',
    },
    {
      user: 'Emily Davis',
      action: 'updated project milestone',
      target: 'Oakwood Tower',
      time: '5 hours ago',
    },
    {
      user: 'Robert Lee',
      action: 'submitted weekly KPI report',
      target: 'Week 18',
      time: '1 day ago',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Welcome back, here's what's happening today</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-600',
          };

          return (
            <div key={card.title} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{card.title}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-2">{card.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm text-green-600">{card.change}</span>
                    <span className="text-xs text-neutral-400 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg ${colorClasses[card.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Brokerage Requests */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200">
          <div className="p-5 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Active Brokerage Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Broker
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {activeBrokerageRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{request.id}</span>
                        {request.priority === 'high' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <span className="text-xs text-neutral-500">{request.type}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-900">{request.client}</td>
                    <td className="px-5 py-4 text-sm text-neutral-600">{request.broker}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {request.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-neutral-900">
                      {request.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-5 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Activities</h2>
          </div>
          <div className="p-5 space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-neutral-600">{activity.action}</span>{' '}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Projects & Upcoming Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-5 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Active Projects</h2>
          </div>
          <div className="p-5 space-y-4">
            {activeProjects.map((project, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{project.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">PM: {project.manager}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      project.status === 'On Track'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-orange-50 text-orange-700'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Progress</span>
                    <span className="font-medium text-neutral-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due: {project.deadline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Inspections */}
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-5 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Upcoming Inspections</h2>
          </div>
          <div className="p-5 space-y-4">
            {upcomingInspections.map((inspection, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900">{inspection.property}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Inspector: {inspection.inspector}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {inspection.date} at {inspection.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
