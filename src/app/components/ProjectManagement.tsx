import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  MoreVertical,
  FolderKanban,
  AlertCircle,
  TrendingUp,
  Link as LinkIcon,
  Lock,
  X,
  UserCheck,
  ChevronDown,
} from 'lucide-react';

type TaskStatus = 'completed' | 'in-progress' | 'pending' | 'blocked';

interface Task {
  id: string;
  name: string;
  status: TaskStatus;
  assignee: string;
  blockedBy?: string;
}

interface Phase {
  id: number;
  phase: string;
  status: TaskStatus;
  tasks: Task[];
  startDate: string;
  endDate: string;
  dependencies: number[];
}

export function ProjectManagement() {
  const [activeTab, setActiveTab] = useState('projects');
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});
  const [assignedToWorkers, setAssignedToWorkers] = useState<Record<string, string>>({});
  const [openAssignDropdown, setOpenAssignDropdown] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);

  const fieldWorkers = ['Robert Lee', 'James Okafor', 'Emeka Adeola', 'Kofi Mensah'];

  const projectMetrics = [
    { label: 'Active Projects', value: '18', change: '+3', icon: FolderKanban, color: 'blue' },
    { label: 'On Track', value: '14', change: '+2', icon: CheckCircle2, color: 'green' },
    { label: 'At Risk', value: '4', change: '-1', icon: AlertCircle, color: 'orange' },
    { label: 'Completion Rate', value: '78%', change: '+5%', icon: TrendingUp, color: 'purple' },
  ];

  const projects = [
    {
      id: 'PRJ-2045',
      name: 'Oakwood Tower Construction',
      manager: 'Robert Lee',
      team: ['RL', 'SK', 'JW', 'MA'],
      progress: 68,
      status: 'On Track',
      deadline: 'Jun 15, 2026',
      budget: '$8.2M',
      spent: '$5.6M',
      tasks: { total: 124, completed: 84, pending: 32, blocked: 8 },
      currentPhase: 'Framework Assembly',
      nextMilestone: 'Floor 8 Completion',
    },
    {
      id: 'PRJ-2044',
      name: 'Riverside Plaza Renovation',
      manager: 'Jennifer Kim',
      team: ['JK', 'TP', 'LD'],
      progress: 42,
      status: 'At Risk',
      deadline: 'Aug 22, 2026',
      budget: '$4.5M',
      spent: '$2.1M',
      tasks: { total: 98, completed: 41, pending: 45, blocked: 12 },
      currentPhase: 'MEP Installation',
      nextMilestone: 'HVAC System Complete',
    },
    {
      id: 'PRJ-2043',
      name: 'Downtown Office Fit-out',
      manager: 'David Park',
      team: ['DP', 'EM', 'RC', 'LH', 'BS'],
      progress: 85,
      status: 'On Track',
      deadline: 'May 30, 2026',
      budget: '$2.8M',
      spent: '$2.4M',
      tasks: { total: 76, completed: 65, pending: 8, blocked: 3 },
      currentPhase: 'Final Finishes',
      nextMilestone: 'Final Inspection',
    },
  ];

  const executionRoadmap: Phase[] = [
    {
      id: 1,
      phase: 'Site Preparation',
      status: 'completed',
      tasks: [
        { id: '1-0', name: 'Site survey and marking', status: 'completed', assignee: 'Team A' },
        { id: '1-1', name: 'Temporary facilities setup', status: 'completed', assignee: 'Team B' },
        { id: '1-2', name: 'Safety barrier installation', status: 'completed', assignee: 'Team A' },
      ],
      startDate: 'Jan 15',
      endDate: 'Feb 10',
      dependencies: [],
    },
    {
      id: 2,
      phase: 'Foundation Work',
      status: 'completed',
      tasks: [
        { id: '2-0', name: 'Excavation', status: 'completed', assignee: 'Team C' },
        { id: '2-1', name: 'Reinforcement installation', status: 'completed', assignee: 'Team D' },
        { id: '2-2', name: 'Concrete pouring', status: 'completed', assignee: 'Team C' },
        { id: '2-3', name: 'Curing and inspection', status: 'completed', assignee: 'Supervisor' },
      ],
      startDate: 'Feb 11',
      endDate: 'Mar 25',
      dependencies: [1],
    },
    {
      id: 3,
      phase: 'Framework Assembly',
      status: 'in-progress',
      tasks: [
        { id: '3-0', name: 'Steel column installation', status: 'completed', assignee: 'Team E' },
        { id: '3-1', name: 'Beam placement — Floors 1–5', status: 'completed', assignee: 'Team F' },
        { id: '3-2', name: 'Beam placement — Floors 6–8', status: 'in-progress', assignee: 'Team E' },
        {
          id: '3-3',
          name: 'Welding and bolting',
          status: 'blocked',
          assignee: 'Team G',
          blockedBy: 'Beam placement — Floors 6–8',
        },
        {
          id: '3-4',
          name: 'QA framework inspection',
          status: 'blocked',
          assignee: 'Supervisor',
          blockedBy: 'Welding and bolting',
        },
      ],
      startDate: 'Mar 26',
      endDate: 'May 20',
      dependencies: [2],
    },
    {
      id: 4,
      phase: 'Envelope Installation',
      status: 'pending',
      tasks: [
        {
          id: '4-0',
          name: 'Curtain wall installation',
          status: 'pending',
          assignee: 'Team H',
          blockedBy: 'Phase 3: Framework Assembly',
        },
        { id: '4-1', name: 'Window and door frames', status: 'pending', assignee: 'Team I' },
        { id: '4-2', name: 'Waterproofing membrane', status: 'pending', assignee: 'Team J' },
      ],
      startDate: 'May 21',
      endDate: 'Jun 10',
      dependencies: [3],
    },
    {
      id: 5,
      phase: 'MEP Systems',
      status: 'pending',
      tasks: [
        { id: '5-0', name: 'Electrical rough-in', status: 'pending', assignee: 'Electrical Team' },
        { id: '5-1', name: 'Plumbing installation', status: 'pending', assignee: 'Plumbing Team' },
        { id: '5-2', name: 'HVAC ductwork', status: 'pending', assignee: 'HVAC Team' },
        { id: '5-3', name: 'Fire protection systems', status: 'pending', assignee: 'Safety Team' },
      ],
      startDate: 'Jun 11',
      endDate: 'Jul 20',
      dependencies: [4],
    },
  ];

  const getEffectiveStatus = (task: Task): TaskStatus =>
    taskStatuses[task.id] ?? task.status;

  const markDone = (taskId: string) =>
    setTaskStatuses((prev) => ({ ...prev, [taskId]: 'completed' }));

  const markInProgress = (taskId: string) =>
    setTaskStatuses((prev) => ({ ...prev, [taskId]: 'in-progress' }));

  const assignTask = (
    taskId: string,
    taskName: string,
    phaseName: string,
    workerName: string
  ) => {
    setAssignedToWorkers((prev) => ({ ...prev, [taskId]: workerName }));
    setOpenAssignDropdown(null);
    try {
      const existing = JSON.parse(localStorage.getItem('field_assigned_tasks') || '[]');
      const updated = [
        ...existing.filter((t: any) => t.id !== taskId),
        {
          id: taskId,
          name: taskName,
          phase: phaseName,
          project: 'Oakwood Tower Construction',
          assignedTo: workerName,
          assignedBy: 'Site Manager',
          assignedAt: 'May 4',
        },
      ];
      localStorage.setItem('field_assigned_tasks', JSON.stringify(updated));
    } catch (_) {}
  };

  const statusColors: Record<string, string> = {
    'On Track': 'bg-green-100 text-green-700',
    'At Risk': 'bg-orange-100 text-orange-700',
    Delayed: 'bg-red-100 text-red-700',
  };

  const phaseStatusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    pending: 'bg-neutral-100 text-neutral-600',
    blocked: 'bg-red-100 text-red-700',
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
          <h1 className="text-2xl font-semibold text-neutral-900">Project Management</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track project execution roadmaps and team coordination
          </p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projectMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{metric.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-2">{metric.value}</p>
                  <p className="text-sm text-green-600 mt-2">{metric.change}</p>
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
          {(['projects', 'roadmap', 'timeline'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'roadmap'
                ? 'Execution Roadmap'
                : tab === 'timeline'
                ? 'Timeline View'
                : 'Projects'}
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
            placeholder="Search projects, tasks..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Projects List */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusColors[project.status]
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500">{project.id}</p>
                </div>
                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Current Phase</p>
                  <p className="text-sm font-medium text-neutral-900">{project.currentPhase}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Next Milestone</p>
                  <p className="text-sm font-medium text-neutral-900">{project.nextMilestone}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Project Manager</p>
                  <p className="text-sm font-medium text-neutral-900">{project.manager}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Deadline</p>
                  <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {project.deadline}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold text-green-900">{project.tasks.completed}</p>
                  <p className="text-xs text-green-600">Completed</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold text-blue-900">{project.tasks.pending}</p>
                  <p className="text-xs text-blue-600">Pending</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold text-red-900">{project.tasks.blocked}</p>
                  <p className="text-xs text-red-600">Blocked</p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-semibold text-neutral-900">{project.tasks.total}</p>
                  <p className="text-xs text-neutral-600">Total</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Overall Progress</span>
                  <span className="font-medium text-neutral-900">{project.progress}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      project.status === 'At Risk' ? 'bg-orange-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                <div className="flex -space-x-2">
                  {project.team.map((member, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium border-2 border-white"
                    >
                      {member}
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900">
                    {project.spent} / {project.budget}
                  </p>
                  <p className="text-xs text-neutral-500">Budget</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              Project: Oakwood Tower Construction
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Sequential phases — tasks unlock only when dependencies are resolved. Assign tasks to field workers directly.
            </p>
          </div>

          <div className="space-y-6">
            {executionRoadmap.map((phase, phaseIdx) => {
              const hasBlocked = phase.tasks.some((t) => getEffectiveStatus(t) === 'blocked');
              return (
                <div key={phase.id} className="relative">
                  {phaseIdx < executionRoadmap.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-neutral-200" />
                  )}

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          phase.status === 'completed'
                            ? 'bg-green-100'
                            : phase.status === 'in-progress'
                            ? 'bg-blue-100'
                            : hasBlocked
                            ? 'bg-red-100'
                            : 'bg-neutral-100'
                        }`}
                      >
                        {phase.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : phase.status === 'in-progress' ? (
                          <Clock className="w-6 h-6 text-blue-600" />
                        ) : hasBlocked ? (
                          <Lock className="w-6 h-6 text-red-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 bg-neutral-50 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-neutral-900">{phase.phase}</h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                                phaseStatusColors[phase.status]
                              }`}
                            >
                              {phase.status.replace('-', ' ')}
                            </span>
                            {hasBlocked && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertCircle className="w-3 h-3" />
                                {phase.tasks.filter((t) => getEffectiveStatus(t) === 'blocked').length} blocked
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 mt-1">
                            {phase.startDate} — {phase.endDate}
                          </p>
                        </div>
                        {phase.dependencies.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <LinkIcon className="w-4 h-4" />
                            <span>Depends on Phase {phase.dependencies.join(', ')}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {phase.tasks.map((task) => {
                          const effectiveStatus = getEffectiveStatus(task);
                          const isBlocked = effectiveStatus === 'blocked';
                          const isCompleted = effectiveStatus === 'completed';
                          const isInProgress = effectiveStatus === 'in-progress';

                          return (
                            <div
                              key={task.id}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                isBlocked ? 'bg-red-50 border border-red-100' : 'bg-white'
                              }`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : isBlocked ? (
                                  <Lock className="w-5 h-5 text-red-500" />
                                ) : isInProgress ? (
                                  <Clock className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-neutral-300" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm font-medium ${
                                    isCompleted
                                      ? 'text-neutral-400 line-through'
                                      : isBlocked
                                      ? 'text-red-700'
                                      : 'text-neutral-900'
                                  }`}
                                >
                                  {task.name}
                                </p>
                                <p className="text-xs text-neutral-500 mt-0.5">{task.assignee}</p>
                                {isBlocked && task.blockedBy && (
                                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Blocked by: {task.blockedBy}
                                  </p>
                                )}
                              </div>

                              {/* Action + Assign buttons */}
                              {!isCompleted && !isBlocked && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {isInProgress ? (
                                    <button
                                      onClick={() => markDone(task.id)}
                                      className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                      Mark Done
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => markInProgress(task.id)}
                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Start
                                    </button>
                                  )}

                                  {/* Field worker assignment dropdown */}
                                  <div className="relative">
                                    {assignedToWorkers[task.id] ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg">
                                        <UserCheck className="w-3 h-3" />
                                        {assignedToWorkers[task.id]}
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          setOpenAssignDropdown(
                                            openAssignDropdown === task.id ? null : task.id
                                          )
                                        }
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
                                      >
                                        Assign
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                    )}
                                    {openAssignDropdown === task.id && (
                                      <div className="absolute right-0 top-8 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1 min-w-[160px]">
                                        <p className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                                          Field Workers
                                        </p>
                                        {fieldWorkers.map((worker) => (
                                          <button
                                            key={worker}
                                            onClick={() =>
                                              assignTask(task.id, task.name, phase.phase, worker)
                                            }
                                            className="block w-full px-4 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50 transition-colors"
                                          >
                                            {worker}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline View */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6">Project Timeline</h2>
          <div className="space-y-4">
            {executionRoadmap.map((phase) => (
              <div key={phase.id} className="flex items-center gap-4">
                <div className="w-32 text-right flex-shrink-0">
                  <p className="text-sm font-medium text-neutral-900">{phase.startDate}</p>
                  <p className="text-xs text-neutral-500">{phase.endDate}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        phase.status === 'completed'
                          ? 'bg-green-500'
                          : phase.status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-neutral-300'
                      }`}
                    />
                    <h3 className="font-medium text-neutral-900">{phase.phase}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                        phaseStatusColors[phase.status]
                      }`}
                    >
                      {phase.status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="ml-6 text-sm text-neutral-600">
                    {phase.tasks.length} tasks •{' '}
                    {
                      phase.tasks.filter((t) => getEffectiveStatus(t) === 'completed').length
                    }{' '}
                    completed
                    {phase.tasks.filter((t) => getEffectiveStatus(t) === 'blocked').length > 0 && (
                      <span className="text-red-500 ml-2">
                        •{' '}
                        {phase.tasks.filter((t) => getEffectiveStatus(t) === 'blocked').length}{' '}
                        blocked
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">New Project</h2>
              <button
                onClick={() => setShowNewProject(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lekki Phase 2 Tower"
                  className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Project Manager
                  </label>
                  <input
                    type="text"
                    placeholder="Assign PM"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Total Budget
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ₦500M"
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Project Type
                  </label>
                  <select className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option>New Construction</option>
                    <option>Renovation</option>
                    <option>Fit-out</option>
                    <option>Infrastructure</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
