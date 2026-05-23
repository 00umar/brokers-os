import { useState, useEffect, useCallback } from 'react';
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
  Lock,
  X,
  UserCheck,
  ChevronDown,
  Loader2,
  PauseCircle,
  Building2,
  Hammer,
  Palette,
  Globe,
  Zap,
  Wrench,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Project, Phase, Task, Profile } from '../../lib/database.types';

interface TaskWithRelations extends Task {
  project?: { name: string } | null;
  phase?: { name: string } | null;
}

const PROJECT_CATEGORIES = [
  {
    id: 'New Construction',
    description: 'Build a new structure from scratch',
    subtypes: [
      'Residential — Detached House',
      'Residential — Duplex / Semi-Detached',
      'Residential — Apartment Block',
      'Commercial — Office Building',
      'Commercial — Retail / Shopping',
      'Warehouse / Industrial',
      'Mixed-Use Development',
    ],
  },
  {
    id: 'Renovation',
    description: 'Repair or upgrade an existing building',
    subtypes: [
      'Full Renovation',
      'Structural / Civil Works',
      'Roofing & Waterproofing',
      'Plumbing & Electrical',
      'Exterior Works (Paint / Facade)',
      'Emergency Repair',
    ],
  },
  {
    id: 'Interior Design & Fit-out',
    description: 'Interior finishing, furnishing, and decor',
    subtypes: [
      'Residential Fit-out',
      'Office / Corporate Fit-out',
      'Retail / Hospitality Fit-out',
      'Show Apartment / Staging',
      'Kitchen & Bathroom Remodel',
    ],
  },
  {
    id: 'Property Development',
    description: 'Land development and estate planning',
    subtypes: [
      'Estate Development',
      'Land Subdivision & Survey',
      'Gated Community',
      'Commercial Complex',
      'Mixed-Use Estate',
    ],
  },
  {
    id: 'Infrastructure & Services',
    description: 'Roads, utilities, and site services',
    subtypes: [
      'Roads & Drainage',
      'Water Supply & Borehole',
      'Electrical & Solar Installation',
      'Perimeter Fence & Gate',
      'Landscaping & External Works',
    ],
  },
  {
    id: 'Facility Management',
    description: 'Ongoing property maintenance and servicing',
    subtypes: [
      'Routine Maintenance Schedule',
      'Annual Inspection & Audit',
      'Mechanical & Electrical Service',
      'Cleaning & Janitorial Contract',
      'Security System Upgrade',
    ],
  },
];

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'New Construction': Building2,
  'Renovation': Hammer,
  'Interior Design & Fit-out': Palette,
  'Property Development': Globe,
  'Infrastructure & Services': Zap,
  'Facility Management': Wrench,
};

const CATEGORY_COLORS: Record<string, string> = {
  'New Construction': 'bg-blue-100 text-blue-600',
  'Renovation': 'bg-orange-100 text-orange-600',
  'Interior Design & Fit-out': 'bg-purple-100 text-purple-600',
  'Property Development': 'bg-green-100 text-green-600',
  'Infrastructure & Services': 'bg-amber-100 text-amber-600',
  'Facility Management': 'bg-neutral-100 text-neutral-600',
};

export function ProjectManagement() {
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'projects' | 'roadmap' | 'timeline'>('projects');

  // Projects tab
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Roadmap / timeline tab
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  // Field workers for assignment
  const [fieldWorkers, setFieldWorkers] = useState<Profile[]>([]);

  // UI state
  const [openAssignDropdown, setOpenAssignDropdown] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [savingPhase, setSavingPhase] = useState(false);
  const [addingTaskForPhase, setAddingTaskForPhase] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState({ name: '', assigned_to: '' });
  const [savingTask, setSavingTask] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardCategory, setWizardCategory] = useState('');
  const [wizardSubType, setWizardSubType] = useState('');
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    type: 'New Construction',
    deadline: '',
    budget: '',
    pm_name: '',
  });

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    setProjects(data ?? []);
    setLoadingProjects(false);
  }, []);

  const fetchFieldWorkers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('full_name');
    setFieldWorkers(data ?? []);
  }, []);

  const fetchRoadmap = useCallback(async (projectId: string) => {
    setLoadingRoadmap(true);
    const [{ data: phasesData }, { data: tasksData }] = await Promise.all([
      supabase.from('phases').select('*').eq('project_id', projectId).order('order_index'),
      supabase.from('tasks').select('*').eq('project_id', projectId).order('created_at'),
    ]);
    setPhases(phasesData ?? []);
    setTasks(tasksData ?? []);
    setLoadingRoadmap(false);
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchFieldWorkers();
  }, [fetchProjects, fetchFieldWorkers]);

  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId) ?? null;
      setSelectedProject(proj);
      fetchRoadmap(selectedProjectId);
    }
  }, [selectedProjectId, projects, fetchRoadmap]);

  // Auto-select first project when switching to roadmap/timeline
  useEffect(() => {
    if ((activeTab === 'roadmap' || activeTab === 'timeline') && !selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activeTab, selectedProjectId, projects]);

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const assignTask = async (taskId: string, worker: Profile) => {
    await supabase.from('tasks').update({
      assigned_to: worker.id,
      assigned_to_name: worker.full_name,
      assigned_by: profile?.id ?? null,
      assigned_at: new Date().toISOString(),
    }).eq('id', taskId);
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, assigned_to: worker.id, assigned_to_name: worker.full_name } : t
    ));
    setOpenAssignDropdown(null);
  };

  const createProject = async () => {
    if (!newProjectForm.name.trim()) return;
    setSavingProject(true);
    const projectType = wizardSubType ? `${wizardCategory}: ${wizardSubType}` : wizardCategory;
    const { error } = await supabase.from('projects').insert({
      name: newProjectForm.name.trim(),
      type: projectType || null,
      deadline: newProjectForm.deadline || null,
      budget: newProjectForm.budget ? parseFloat(newProjectForm.budget.replace(/[^\d.]/g, '')) : null,
      pm_name: newProjectForm.pm_name || null,
      status: 'active',
    });
    setSavingProject(false);
    if (!error) {
      setShowNewProject(false);
      setNewProjectForm({ name: '', type: '', deadline: '', budget: '', pm_name: '' });
      setWizardStep(1);
      setWizardCategory('');
      setWizardSubType('');
      fetchProjects();
    }
  };

  const createPhase = async () => {
    if (!selectedProjectId || !newPhaseName.trim()) return;
    setSavingPhase(true);
    const nextIndex = phases.length > 0 ? Math.max(...phases.map(p => p.order_index)) + 1 : 1;
    const { data } = await supabase.from('phases').insert({
      project_id: selectedProjectId,
      name: newPhaseName.trim(),
      order_index: nextIndex,
      status: 'pending',
    }).select().single();
    if (data) {
      setPhases(prev => [...prev, data as Phase]);
      setNewPhaseName('');
      setAddingPhase(false);
    }
    setSavingPhase(false);
  };

  const createTask = async (phaseId: string) => {
    if (!selectedProjectId || !newTaskForm.name.trim()) return;
    setSavingTask(true);
    const worker = fieldWorkers.find(w => w.id === newTaskForm.assigned_to) ?? null;
    const { data } = await supabase.from('tasks').insert({
      phase_id: phaseId,
      project_id: selectedProjectId,
      name: newTaskForm.name.trim(),
      status: 'pending',
      assigned_to: worker?.id ?? undefined,
      assigned_to_name: worker?.full_name ?? undefined,
      assigned_by: worker ? (profile?.id ?? undefined) : undefined,
      assigned_at: worker ? new Date().toISOString() : undefined,
    }).select().single();
    if (data) {
      setTasks(prev => [...prev, data as Task]);
      setNewTaskForm({ name: '', assigned_to: '' });
      setAddingTaskForPhase(null);
    }
    setSavingTask(false);
  };

  // Lookup map for blocked_by task names
  const taskNameMap = new Map(tasks.map(t => [t.id, t.name]));

  // Metrics computed from real data
  const metrics = [
    { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, icon: FolderKanban, color: 'blue' },
    { label: 'On Hold', value: projects.filter(p => p.status === 'on-hold').length, icon: PauseCircle, color: 'orange' },
    { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle2, color: 'green' },
    { label: 'Total Projects', value: projects.length, icon: TrendingUp, color: 'purple' },
  ];

  const projectStatusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    'on-hold': 'bg-orange-100 text-orange-700',
    completed: 'bg-blue-100 text-blue-700',
  };

  const phaseStatusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    pending: 'bg-neutral-100 text-neutral-600',
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
          <p className="text-sm text-neutral-500 mt-1">Track project execution roadmaps and team coordination</p>
        </div>
        <button
          onClick={() => { setShowNewProject(true); setWizardStep(1); setWizardCategory(''); setWizardSubType(''); setNewProjectForm({ name: '', type: '', deadline: '', budget: '', pm_name: '' }); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-neutral-200 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">{metric.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-2">{metric.value}</p>
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
          {(['projects', 'roadmap', 'timeline'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'roadmap' ? 'Execution Roadmap' : tab === 'timeline' ? 'Timeline View' : 'Projects'}
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

      {/* ── Projects List ── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <FolderKanban className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <h3 className="font-medium text-neutral-900 mb-1">No projects yet</h3>
              <p className="text-sm text-neutral-500 mb-4">Create your first project to get started.</p>
              <button
                onClick={() => { setShowNewProject(true); setWizardStep(1); setWizardCategory(''); setWizardSubType(''); setNewProjectForm({ name: '', type: '', deadline: '', budget: '', pm_name: '' }); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Create Project
              </button>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${projectStatusColors[project.status]}`}>
                        {project.status.replace('-', ' ')}
                      </span>
                      {project.type && (
                        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">{project.type}</span>
                      )}
                    </div>
                  </div>
                  <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {project.pm_name && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Project Manager</p>
                      <p className="text-sm font-medium text-neutral-900">{project.pm_name}</p>
                    </div>
                  )}
                  {project.deadline && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Deadline</p>
                      <p className="text-sm font-medium text-neutral-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {project.budget != null && (
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Budget</p>
                      <p className="text-sm font-medium text-neutral-900">
                        ₦{Number(project.budget).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <p className="text-xs text-neutral-400">
                    Added {new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => { setSelectedProjectId(project.id); setActiveTab('roadmap'); }}
                    className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View Roadmap →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Execution Roadmap ── */}
      {activeTab === 'roadmap' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          {/* Project selector */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-xs text-neutral-500 mb-1">Project</label>
              <select
                value={selectedProjectId ?? ''}
                onChange={e => setSelectedProjectId(e.target.value || null)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project…</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {selectedProject && (
              <div className="text-sm text-neutral-500 pt-5 space-y-0.5">
                {selectedProject.pm_name && <p>PM: <span className="text-neutral-900">{selectedProject.pm_name}</span></p>}
                {selectedProject.deadline && (
                  <p>Due: <span className="text-neutral-900">{new Date(selectedProject.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
                )}
              </div>
            )}
          </div>

          {!selectedProjectId ? (
            <p className="text-center py-12 text-neutral-400 text-sm">Select a project above to view its execution roadmap.</p>
          ) : loadingRoadmap ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {phases.length === 0 && (
                <p className="text-center py-8 text-neutral-400 text-sm">No phases yet — add the first one below.</p>
              )}
              {phases.map((phase, phaseIdx) => {
                const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
                const hasBlocked = phaseTasks.some(t => t.status === 'blocked');

                return (
                  <div key={phase.id} className="relative">
                    {phaseIdx < phases.length - 1 && (
                      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-neutral-200" />
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          phase.status === 'completed' ? 'bg-green-100' :
                          phase.status === 'in-progress' ? 'bg-blue-100' :
                          hasBlocked ? 'bg-red-100' : 'bg-neutral-100'
                        }`}>
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
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-neutral-900">{phase.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${phaseStatusColors[phase.status]}`}>
                              {phase.status.replace('-', ' ')}
                            </span>
                            {hasBlocked && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <AlertCircle className="w-3 h-3" />
                                {phaseTasks.filter(t => t.status === 'blocked').length} blocked
                              </span>
                            )}
                          </div>
                        </div>

                        {phaseTasks.length === 0 ? (
                          <p className="text-sm text-neutral-400 italic">No tasks in this phase yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {phaseTasks.map(task => {
                              const isBlocked = task.status === 'blocked';
                              const isDone = task.status === 'done';
                              const isInProgress = task.status === 'in-progress';
                              const blockingName = task.blocked_by ? taskNameMap.get(task.blocked_by) : null;

                              return (
                                <div
                                  key={task.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg ${
                                    isBlocked ? 'bg-red-50 border border-red-100' : 'bg-white'
                                  }`}
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    {isDone ? (
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
                                    <p className={`text-sm font-medium ${
                                      isDone ? 'text-neutral-400 line-through' :
                                      isBlocked ? 'text-red-700' : 'text-neutral-900'
                                    }`}>
                                      {task.name}
                                    </p>
                                    {task.assigned_to_name && (
                                      <p className="text-xs text-neutral-500 mt-0.5">{task.assigned_to_name}</p>
                                    )}
                                    {isBlocked && blockingName && (
                                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Blocked by: {blockingName}
                                      </p>
                                    )}
                                  </div>

                                  {!isDone && !isBlocked && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {isInProgress ? (
                                        <button
                                          onClick={() => updateTaskStatus(task.id, 'done')}
                                          className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                          Mark Done
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => updateTaskStatus(task.id, 'in-progress')}
                                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                          Start
                                        </button>
                                      )}

                                      <div className="relative">
                                        {task.assigned_to_name ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg">
                                            <UserCheck className="w-3 h-3" />
                                            {task.assigned_to_name}
                                          </span>
                                        ) : (
                                          <button
                                            onClick={() => setOpenAssignDropdown(
                                              openAssignDropdown === task.id ? null : task.id
                                            )}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 transition-colors"
                                          >
                                            Assign
                                            <ChevronDown className="w-3 h-3" />
                                          </button>
                                        )}
                                        {openAssignDropdown === task.id && (
                                          <div className="absolute right-0 top-8 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1 min-w-[200px]">
                                            <p className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wide border-b border-neutral-100">
                                              Assign to
                                            </p>
                                            {fieldWorkers.length === 0 ? (
                                              <p className="px-4 py-3 text-sm text-neutral-400">No staff found</p>
                                            ) : (
                                              fieldWorkers.map(worker => (
                                                <button
                                                  key={worker.id}
                                                  onClick={() => assignTask(task.id, worker)}
                                                  className="block w-full px-4 py-2 text-sm text-left hover:bg-neutral-50 transition-colors"
                                                >
                                                  <div className="font-medium text-neutral-900">{worker.full_name}</div>
                                                  <div className="text-xs text-neutral-400 capitalize">{worker.role.replace('_', ' ')}</div>
                                                </button>
                                              ))
                                            )}
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
                        {addingTaskForPhase === phase.id ? (
                          <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={newTaskForm.name}
                                onChange={e => setNewTaskForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Task name..."
                                autoFocus
                                onKeyDown={e => { if (e.key === 'Enter') createTask(phase.id); }}
                                className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <select
                                value={newTaskForm.assigned_to}
                                onChange={e => setNewTaskForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                                className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                <option value="">Assign to…</option>
                                {fieldWorkers.map(w => (
                                  <option key={w.id} value={w.id}>{w.full_name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => { setAddingTaskForPhase(null); setNewTaskForm({ name: '', assigned_to: '' }); }}
                                className="px-3 py-1 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => createTask(phase.id)}
                                disabled={!newTaskForm.name.trim() || savingTask}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                {savingTask && <Loader2 className="w-3 h-3 animate-spin" />}
                                Add Task
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingTaskForPhase(phase.id); setNewTaskForm({ name: '', assigned_to: '' }); }}
                            className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Task
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {addingPhase ? (
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newPhaseName}
                    onChange={e => setNewPhaseName(e.target.value)}
                    placeholder="Phase name (e.g. Foundation, Roofing…)"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') createPhase(); }}
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => { setAddingPhase(false); setNewPhaseName(''); }}
                    className="px-3 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createPhase}
                    disabled={!newPhaseName.trim() || savingPhase}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingPhase && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Phase
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingPhase(true)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors pt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Phase
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Timeline View ── */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="mb-6">
            <label className="block text-xs text-neutral-500 mb-1">Project</label>
            <select
              value={selectedProjectId ?? ''}
              onChange={e => setSelectedProjectId(e.target.value || null)}
              className="w-full max-w-sm px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a project…</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {!selectedProjectId ? (
            <p className="text-center py-12 text-neutral-400 text-sm">Select a project above to view its timeline.</p>
          ) : loadingRoadmap ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : phases.length === 0 ? (
            <p className="text-center py-12 text-neutral-400 text-sm">No phases for this project.</p>
          ) : (
            <div className="space-y-4">
              {phases.map(phase => {
                const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
                const doneTasks = phaseTasks.filter(t => t.status === 'done').length;
                const blockedTasks = phaseTasks.filter(t => t.status === 'blocked').length;
                return (
                  <div key={phase.id} className="flex items-center gap-4">
                    <div className="w-8 text-center flex-shrink-0">
                      <p className="text-sm font-semibold text-neutral-400">{phase.order_index}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={`w-3 h-3 rounded-full ${
                          phase.status === 'completed' ? 'bg-green-500' :
                          phase.status === 'in-progress' ? 'bg-blue-500' : 'bg-neutral-300'
                        }`} />
                        <h3 className="font-medium text-neutral-900">{phase.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${phaseStatusColors[phase.status]}`}>
                          {phase.status.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="ml-6 text-sm text-neutral-500">
                        {phaseTasks.length} tasks · {doneTasks} done
                        {blockedTasks > 0 && <span className="text-red-500"> · {blockedTasks} blocked</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── New Project Wizard ── */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {wizardStep === 1 ? 'New Project' : wizardStep === 2 ? wizardCategory : 'Project Details'}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {wizardStep === 1 ? 'What type of project is this?' :
                   wizardStep === 2 ? 'Select the scope of work' :
                   `${wizardCategory} — ${wizardSubType}`}
                </p>
              </div>
              <button onClick={() => setShowNewProject(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-4 flex items-center gap-2 flex-shrink-0">
              <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${wizardStep >= 1 ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>1</div>
              <div className={`h-0.5 flex-1 transition-colors ${wizardStep >= 2 ? 'bg-blue-500' : 'bg-neutral-200'}`} />
              <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${wizardStep >= 2 ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>2</div>
              <div className={`h-0.5 flex-1 transition-colors ${wizardStep >= 3 ? 'bg-blue-500' : 'bg-neutral-200'}`} />
              <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${wizardStep >= 3 ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>3</div>
            </div>
            <div className="px-6 flex text-xs text-neutral-400 mt-1 mb-1 flex-shrink-0">
              <span className={`flex-1 ${wizardStep === 1 ? 'text-blue-600 font-medium' : ''}`}>Project Type</span>
              <span className={`flex-1 text-center ${wizardStep === 2 ? 'text-blue-600 font-medium' : ''}`}>Scope</span>
              <span className={`flex-1 text-right ${wizardStep === 3 ? 'text-blue-600 font-medium' : ''}`}>Details</span>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">

              {/* Step 1 — Project Type */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {PROJECT_CATEGORIES.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.id];
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { setWizardCategory(cat.id); setWizardSubType(''); setWizardStep(2); }}
                        className="p-4 rounded-xl border-2 border-neutral-200 text-left hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${CATEGORY_COLORS[cat.id]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="font-medium text-neutral-900 text-sm leading-tight">{cat.id}</div>
                        <div className="text-xs text-neutral-500 mt-1 leading-relaxed">{cat.description}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2 — Scope */}
              {wizardStep === 2 && (
                <div>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to project types
                  </button>
                  <div className="space-y-2">
                    {(PROJECT_CATEGORIES.find(c => c.id === wizardCategory)?.subtypes ?? []).map(sub => (
                      <button
                        key={sub}
                        onClick={() => { setWizardSubType(sub); setWizardStep(3); }}
                        className="w-full p-3.5 rounded-xl border-2 border-neutral-200 text-left text-sm font-medium text-neutral-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 transition-all"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Details */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <span className="font-medium">{wizardCategory}</span> — {wizardSubType}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Project Name *</label>
                    <input
                      type="text"
                      value={newProjectForm.name}
                      onChange={e => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={`e.g. ${wizardSubType} — Lekki Phase 1`}
                      autoFocus
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Project Manager</label>
                      <input
                        type="text"
                        value={newProjectForm.pm_name}
                        onChange={e => setNewProjectForm(prev => ({ ...prev, pm_name: e.target.value }))}
                        placeholder="PM name"
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Deadline</label>
                      <input
                        type="date"
                        value={newProjectForm.deadline}
                        onChange={e => setNewProjectForm(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Budget (₦)</label>
                    <input
                      type="text"
                      value={newProjectForm.budget}
                      onChange={e => setNewProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="e.g. 500,000,000"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer — only on step 3 */}
            {wizardStep === 3 && (
              <div className="p-6 border-t border-neutral-200 flex justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createProject}
                  disabled={!newProjectForm.name.trim() || savingProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {savingProject && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Project
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
