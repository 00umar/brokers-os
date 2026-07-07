import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  AlertCircle,
  TrendingUp,
  Lock,
  X,
  Trash2,
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
  Share2,
  Award,
  Flag,
  ChevronUp,
  MoreVertical,
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

const PHASE_TEMPLATES: Record<string, string[]> = {
  'New Construction': [
    'Site Preparation & Clearing',
    'Foundation Works',
    'Structural Frame / Block Laying',
    'Roofing Works',
    'Plumbing Installation',
    'Electrical Installation',
    'Plastering & Screeding',
    'Tiling & Flooring',
    'Painting & Finishing',
    'External Works & Landscaping',
    'Final Inspection & Handover',
  ],
  'Renovation': [
    'Site Assessment & Planning',
    'Demolition & Strip-out',
    'Structural Repairs',
    'Plumbing & Electrical Works',
    'Plastering & Rendering',
    'Tiling & Flooring',
    'Painting & Decoration',
    'Final Cleaning & Handover',
  ],
  'Interior Design & Fit-out': [
    'Design & Mood Board Approval',
    'Material Procurement',
    'Flooring Installation',
    'Ceiling & Lighting Works',
    'Furniture & Joinery Installation',
    'Decor & Accessories',
    'Final Styling & Photography',
  ],
  'Property Development': [
    'Land Acquisition & Survey',
    'Planning & Regulatory Approvals',
    'Site Preparation & Infrastructure',
    'Construction Phase 1',
    'Construction Phase 2',
    'Finishing Works',
    'Sales & Marketing Launch',
    'Handover & Documentation',
  ],
  'Infrastructure & Services': [
    'Site Survey & Planning',
    'Material Procurement',
    'Ground Works / Civil Works',
    'Installation Works',
    'Testing & Commissioning',
    'Final Inspection & Sign-off',
  ],
  'Facility Management': [
    'Initial Assessment & Audit',
    'Work Order Scheduling',
    'Service Execution',
    'Quality Inspection',
    'Documentation & Reporting',
  ],
};

type PhaseHealth = 'on-track' | 'at-risk' | 'delayed' | 'upcoming' | 'completed' | 'unknown';

function getPhaseHealth(phase: Phase): PhaseHealth {
  if (phase.status === 'completed') return 'completed';
  if (phase.status === 'pending') return 'upcoming';
  if (!phase.end_date) return 'unknown';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(phase.end_date);
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return 'delayed';
  if (daysLeft <= 7) return 'at-risk';
  return 'on-track';
}

function ProgressRing({ percent, size = 48 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 100 ? '#16a34a' : percent >= 50 ? '#2563eb' : '#f59e0b';
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={String(circ)} strokeDashoffset={String(offset)} strokeLinecap="round" />
      </svg>
      <span className="text-xs font-bold" style={{ color, zIndex: 1 }}>{percent}%</span>
    </div>
  );
}

const healthConfig: Record<PhaseHealth, { label: string; className: string }> = {
  completed:  { label: 'Signed Off',  className: 'bg-green-100 text-green-700' },
  'on-track': { label: 'On Track',    className: 'bg-blue-100 text-blue-700' },
  'at-risk':  { label: 'At Risk',     className: 'bg-amber-100 text-amber-700' },
  delayed:    { label: 'Delayed',     className: 'bg-red-100 text-red-700' },
  upcoming:   { label: 'Upcoming',    className: 'bg-neutral-100 text-neutral-500' },
  unknown:    { label: 'No Dates',    className: 'bg-neutral-100 text-neutral-400' },
};

const phaseBorderColor: Record<PhaseHealth, string> = {
  completed:  'border-l-green-500',
  'on-track': 'border-l-blue-500',
  'at-risk':  'border-l-amber-400',
  delayed:    'border-l-red-500',
  upcoming:   'border-l-neutral-300',
  unknown:    'border-l-neutral-300',
};

export function ProjectManagement() {
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<'projects' | 'journey'>('projects');

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);

  const [fieldWorkers, setFieldWorkers] = useState<Profile[]>([]);

  const [openAssignDropdown, setOpenAssignDropdown] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseForm, setNewPhaseForm] = useState({ name: '', start_date: '', end_date: '' });
  const [savingPhase, setSavingPhase] = useState(false);
  const [addingTaskForPhase, setAddingTaskForPhase] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState({ name: '', assigned_to: '', due_date: '', priority: 'medium' as 'low' | 'medium' | 'high', notes: '', deliverables: '' });
  const [savingTask, setSavingTask] = useState(false);
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardCategory, setWizardCategory] = useState('');
  const [wizardSubType, setWizardSubType] = useState('');
  const [newProjectForm, setNewProjectForm] = useState({ name: '', type: 'New Construction', deadline: '', budget: '', pm_name: '' });
  const [signingOffPhase, setSigningOffPhase] = useState<string | null>(null);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const [copiedClientLink, setCopiedClientLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
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

  useEffect(() => {
    if (activeTab === 'journey' && !selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activeTab, selectedProjectId, projects]);

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const updatePhaseStatus = async (phaseId: string, status: Phase['status']) => {
    await supabase.from('phases').update({ status }).eq('id', phaseId);
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, status } : p));
  };

  const signOffPhase = async (phaseId: string) => {
    setSigningOffPhase(phaseId);
    const phaseTasks = tasks.filter(t => t.phase_id === phaseId && t.status !== 'done');
    await Promise.all(phaseTasks.map(t => supabase.from('tasks').update({ status: 'done' }).eq('id', t.id)));
    setTasks(prev => prev.map(t => t.phase_id === phaseId ? { ...t, status: 'done' as Task['status'] } : t));
    await updatePhaseStatus(phaseId, 'completed');
    setSigningOffPhase(null);
  };

  const assignTask = async (taskId: string, worker: Profile) => {
    await supabase.from('tasks').update({
      assigned_to: worker.id,
      assigned_to_name: worker.full_name,
      assigned_by: profile?.id ?? null,
      assigned_at: new Date().toISOString(),
    }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: worker.id, assigned_to_name: worker.full_name } : t));
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
      company_id: profile?.company_id ?? undefined,
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
    const name = newPhaseForm.name.trim();
    if (!selectedProjectId || !name) return;
    setSavingPhase(true);
    const nextIndex = phases.length > 0 ? Math.max(...phases.map(p => p.order_index)) + 1 : 1;
    const { data } = await supabase.from('phases').insert({
      project_id: selectedProjectId,
      name,
      order_index: nextIndex,
      status: 'pending',
      start_date: newPhaseForm.start_date || null,
      end_date: newPhaseForm.end_date || null,
      company_id: profile?.company_id ?? undefined,
    }).select().single();
    if (data) {
      setPhases(prev => [...prev, data as Phase]);
      setNewPhaseForm({ name: '', start_date: '', end_date: '' });
    }
    setSavingPhase(false);
  };

  const updatePhaseDate = async (phaseId: string, field: 'start_date' | 'end_date', value: string) => {
    await supabase.from('phases').update({ [field]: value || null }).eq('id', phaseId);
    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, [field]: value || undefined } : p));
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
      due_date: newTaskForm.due_date || undefined,
      priority: newTaskForm.priority,
      notes: newTaskForm.notes || undefined,
      deliverables: newTaskForm.deliverables || undefined,
      company_id: profile?.company_id ?? undefined,
    }).select().single();
    if (data) {
      setTasks(prev => [...prev, data as Task]);
      setNewTaskForm({ name: '', assigned_to: '', due_date: '', priority: 'medium' as 'low' | 'medium' | 'high', notes: '', deliverables: '' });
      setAddingTaskForPhase(null);
      // Auto-set phase to in-progress when first task is added
      const phase = phases.find(p => p.id === phaseId);
      if (phase && phase.status === 'pending') {
        updatePhaseStatus(phaseId, 'in-progress');
      }
    }
    setSavingTask(false);
  };

  const deletePhase = async (phaseId: string) => {
    if (!window.confirm('Delete this phase and all its tasks?')) return;
    setDeletingPhaseId(phaseId);
    await supabase.from('tasks').delete().eq('phase_id', phaseId);
    await supabase.from('phases').delete().eq('id', phaseId);
    setPhases(prev => prev.filter(p => p.id !== phaseId));
    setTasks(prev => prev.filter(t => t.phase_id !== phaseId));
    setDeletingPhaseId(null);
  };

  const copyClientLink = () => {
    if (!selectedProjectId) return;
    const url = `${window.location.origin}/project/${selectedProjectId}/client`;
    navigator.clipboard.writeText(url);
    setCopiedClientLink(true);
    setTimeout(() => setCopiedClientLink(false), 2000);
  };

  const togglePhaseCollapse = (phaseId: string) => {
    setCollapsedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  // Computed helpers
  const getPhaseProgress = (phaseId: string) => {
    const pt = tasks.filter(t => t.phase_id === phaseId);
    if (pt.length === 0) return 0;
    return Math.round((pt.filter(t => t.status === 'done').length / pt.length) * 100);
  };

  const overallProgress = phases.length === 0 ? 0 : Math.round((phases.filter(p => p.status === 'completed').length / phases.length) * 100);

  const projectHealth: PhaseHealth = (() => {
    const active = phases.filter(p => p.status === 'in-progress');
    if (active.some(p => getPhaseHealth(p) === 'delayed')) return 'delayed';
    if (active.some(p => getPhaseHealth(p) === 'at-risk')) return 'at-risk';
    if (phases.length > 0 && phases.every(p => p.status === 'completed')) return 'completed';
    if (active.length > 0) return 'on-track';
    return 'upcoming';
  })();

  const projectCategory = selectedProject?.type?.split(':')[0]?.trim() ?? '';
  const suggestedPhases = PHASE_TEMPLATES[projectCategory] ?? [];

  const filteredProjects = projects.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Project Management</h1>
          <p className="text-sm text-neutral-500 mt-1">Track delivery milestones from ground-break to handover</p>
        </div>
        <button
          onClick={() => { setShowNewProject(true); setWizardStep(1); setWizardCategory(''); setWizardSubType(''); setNewProjectForm({ name: '', type: '', deadline: '', budget: '', pm_name: '' }); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {metrics.map(metric => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="bg-white rounded-xl border border-neutral-200 p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-neutral-500">{metric.label}</p>
                  <p className="text-2xl font-semibold text-neutral-900 mt-1.5">{metric.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${colorClasses[metric.color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-1">
          {(['projects', 'journey'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'projects' ? 'All Projects' : 'Project Journey'}
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
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2 text-sm text-neutral-600">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* ── All Projects Tab ── */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          {loadingProjects ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredProjects.length === 0 ? (
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
            filteredProjects.map(project => {
              const CategoryIcon = CATEGORY_ICONS[project.type?.split(':')[0]?.trim() ?? ''] ?? FolderKanban;
              const catColor = CATEGORY_COLORS[project.type?.split(':')[0]?.trim() ?? ''] ?? 'bg-neutral-100 text-neutral-500';
              return (
                <div key={project.id} className="bg-white rounded-xl border border-neutral-200 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${catColor}`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-neutral-900 leading-tight">{project.name}</h3>
                            {project.type && (
                              <p className="text-xs text-neutral-500 mt-0.5">{project.type}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize flex-shrink-0 ${projectStatusColors[project.status]}`}>
                            {project.status.replace('-', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                          {project.pm_name && (
                            <span className="text-xs text-neutral-500">PM: <span className="text-neutral-700 font-medium">{project.pm_name}</span></span>
                          )}
                          {project.deadline && (
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          {project.budget != null && (
                            <span className="text-xs text-neutral-500">Budget: <span className="text-neutral-700 font-medium">₦{Number(project.budget).toLocaleString()}</span></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                    <p className="text-xs text-neutral-400">
                      Created {new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <button
                      onClick={() => { setSelectedProjectId(project.id); setActiveTab('journey'); }}
                      className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      Open Journey →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Project Journey Tab ── */}
      {activeTab === 'journey' && (
        <div className="space-y-6">
          {/* Project selector */}
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-sm">
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
          </div>

          {!selectedProjectId ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <FolderKanban className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Select a project above to view its journey.</p>
            </div>
          ) : loadingRoadmap ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* ── Project Overview Card ── */}
              {selectedProject && (
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                  {/* Top bar */}
                  <div className="bg-neutral-900 px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-lg font-semibold text-white truncate">{selectedProject.name}</h2>
                        {phases.length > 0 && (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${healthConfig[projectHealth].className}`}>
                            {healthConfig[projectHealth].label}
                          </span>
                        )}
                      </div>
                      {selectedProject.type && (
                        <p className="text-xs text-neutral-400 mt-0.5">{selectedProject.type}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {selectedProject.pm_name && (
                          <span className="text-xs text-neutral-400">PM: <span className="text-neutral-200">{selectedProject.pm_name}</span></span>
                        )}
                        {selectedProject.deadline && (
                          <span className="text-xs text-neutral-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-neutral-200">{new Date(selectedProject.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </span>
                        )}
                        {selectedProject.budget != null && (
                          <span className="text-xs text-neutral-400">Budget: <span className="text-neutral-200">₦{Number(selectedProject.budget).toLocaleString()}</span></span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={copyClientLink}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors border border-white/20"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copiedClientLink ? 'Link Copied!' : 'Client View'}
                    </button>
                  </div>

                  {/* Progress section */}
                  {phases.length > 0 && (
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Overall Progress</span>
                        <span className="text-sm font-bold text-neutral-900">{overallProgress}%</span>
                      </div>
                      <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${overallProgress}%`,
                            background: overallProgress >= 100
                              ? '#16a34a'
                              : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{phases.filter(p => p.status === 'completed').length} signed off</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />{phases.filter(p => p.status === 'in-progress').length} in progress</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300 inline-block" />{phases.filter(p => p.status === 'pending').length} upcoming</span>
                      </div>

                      {/* Phase strip */}
                      <div className="flex gap-1 mt-3 flex-wrap">
                        {phases.map(phase => (
                          <div
                            key={phase.id}
                            title={phase.name}
                            className={`h-2 flex-1 min-w-[8px] rounded-sm transition-colors cursor-pointer ${
                              phase.status === 'completed' ? 'bg-green-500' :
                              phase.status === 'in-progress' ? 'bg-blue-500' : 'bg-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Phase Journey ── */}
              <div className="relative">
                {/* Spine line */}
                {phases.length > 1 && (
                  <div className="absolute left-5 top-10 bottom-10 w-0.5 bg-neutral-200 z-0" />
                )}

                <div className="space-y-4">
                  {phases.length === 0 ? (
                    <div className="text-center py-10 text-neutral-400 text-sm bg-white rounded-xl border border-neutral-200">
                      No phases yet — add the first milestone below.
                    </div>
                  ) : phases.map((phase, phaseIdx) => {
                    const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
                    const doneTasks = phaseTasks.filter(t => t.status === 'done');
                    const activeTasks = phaseTasks.filter(t => t.status !== 'done');
                    const health = getPhaseHealth(phase);
                    const progress = getPhaseProgress(phase.id);
                    const allDone = phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'done');
                    const isCollapsed = collapsedPhases.has(phase.id);
                    const isCurrentPhase = phase.status === 'in-progress';

                    // Days remaining
                    let daysLabel = '';
                    if (phase.end_date && phase.status !== 'completed') {
                      const today = new Date(); today.setHours(0,0,0,0);
                      const end = new Date(phase.end_date);
                      const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
                      if (days < 0) daysLabel = `${Math.abs(days)} days overdue`;
                      else if (days === 0) daysLabel = 'Due today';
                      else daysLabel = `${days} days left`;
                    }

                    return (
                      <div key={phase.id} className="relative flex gap-4 z-10">
                        {/* Phase node */}
                        <div className="flex-shrink-0 z-10">
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold shadow-sm ${
                            phase.status === 'completed'
                              ? 'bg-green-600 border-green-600 text-white'
                              : isCurrentPhase
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : health === 'delayed'
                              ? 'bg-red-100 border-red-400 text-red-600'
                              : 'bg-white border-neutral-300 text-neutral-400'
                          }`}>
                            {phase.status === 'completed'
                              ? <CheckCircle2 className="w-5 h-5" />
                              : isCurrentPhase
                              ? <Clock className="w-4 h-4" />
                              : phaseIdx + 1}
                          </div>
                        </div>

                        {/* Phase card */}
                        <div className={`flex-1 bg-white rounded-xl border border-neutral-200 border-l-4 overflow-hidden shadow-sm ${phaseBorderColor[health]}`}>
                          {/* Card header — always visible */}
                          <div
                            className="px-4 py-3 flex items-center gap-3 cursor-pointer select-none"
                            onClick={() => togglePhaseCollapse(phase.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Phase {phaseIdx + 1}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${healthConfig[health].className}`}>
                                  {healthConfig[health].label}
                                </span>
                                {daysLabel && health !== 'upcoming' && health !== 'completed' && (
                                  <span className={`text-xs ${health === 'delayed' ? 'text-red-500' : health === 'at-risk' ? 'text-amber-600' : 'text-neutral-500'}`}>
                                    · {daysLabel}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-neutral-900 text-sm mt-0.5 leading-snug">{phase.name}</h3>
                              {(phase.start_date || phase.end_date) && (
                                <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {phase.start_date ? new Date(phase.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                                  {' → '}
                                  {phase.end_date ? new Date(phase.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <ProgressRing percent={progress} size={44} />
                              <button
                                onClick={e => { e.stopPropagation(); deletePhase(phase.id); }}
                                disabled={deletingPhaseId === phase.id}
                                className="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                {deletingPhaseId === phase.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                              {isCollapsed ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronUp className="w-4 h-4 text-neutral-400" />}
                            </div>
                          </div>

                          {/* Dates editor (inline, only when expanded) */}
                          {!isCollapsed && (
                            <>
                              <div className="px-4 pb-3 flex flex-wrap gap-3 border-t border-neutral-100 pt-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-neutral-400">Start</span>
                                  <input type="date" value={phase.start_date ?? ''} onChange={e => updatePhaseDate(phase.id, 'start_date', e.target.value)}
                                    className="text-xs border border-neutral-200 rounded px-2 py-1 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-neutral-400">End</span>
                                  <input type="date" value={phase.end_date ?? ''} onChange={e => updatePhaseDate(phase.id, 'end_date', e.target.value)}
                                    className="text-xs border border-neutral-200 rounded px-2 py-1 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white" />
                                </div>
                                {phase.status !== 'completed' && (
                                  <select
                                    value={phase.status}
                                    onChange={e => updatePhaseStatus(phase.id, e.target.value as Phase['status'])}
                                    onClick={e => e.stopPropagation()}
                                    className="text-xs border border-neutral-200 rounded px-2 py-1 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                  </select>
                                )}
                              </div>

                              {/* Deliverables split: Active Work | Delivered */}
                              <div className="border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
                                {/* Active Work */}
                                <div className="p-4">
                                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" /> Active Work
                                    {activeTasks.length > 0 && <span className="bg-neutral-200 text-neutral-600 rounded-full px-1.5 py-0.5 text-[9px]">{activeTasks.length}</span>}
                                  </p>
                                  {activeTasks.length === 0 ? (
                                    <p className="text-xs text-neutral-400 italic">No pending tasks.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {activeTasks.map(task => (
                                        <div key={task.id} onClick={() => setSelectedTask(task)} className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer hover:shadow-sm transition-shadow ${
                                          task.status === 'blocked' ? 'bg-red-50 border border-red-100' :
                                          task.status === 'in-progress' ? 'bg-blue-50/50 border border-blue-100' : 'bg-neutral-50 border border-neutral-100'
                                        }`}>
                                          <div className="flex-shrink-0 mt-0.5">
                                            {task.status === 'blocked' ? <Lock className="w-4 h-4 text-red-500" /> :
                                             task.status === 'in-progress' ? <Clock className="w-4 h-4 text-blue-600" /> :
                                             <Circle className="w-4 h-4 text-neutral-300" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium leading-snug ${task.status === 'blocked' ? 'text-red-700' : 'text-neutral-800'}`}>{task.name}</p>
                                            {task.deliverables && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{task.deliverables}</p>}
                                            {task.assigned_to_name && <p className="text-xs text-neutral-400 mt-0.5">{task.assigned_to_name}</p>}
                                            {task.due_date && <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" />{new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>}
                                          </div>
                                          {task.status !== 'blocked' && (
                                            <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                                              {task.status === 'in-progress' ? (
                                                <button onClick={() => updateTaskStatus(task.id, 'done')}
                                                  className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap">
                                                  Mark Done
                                                </button>
                                              ) : (
                                                <button onClick={() => updateTaskStatus(task.id, 'in-progress')}
                                                  className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                                                  Start
                                                </button>
                                              )}
                                              {!task.assigned_to_name && (
                                                <div className="relative">
                                                  <button onClick={() => setOpenAssignDropdown(openAssignDropdown === task.id ? null : task.id)}
                                                    className="flex items-center gap-1 px-2 py-0.5 text-xs border border-neutral-200 text-neutral-600 rounded-md hover:bg-neutral-50 transition-colors whitespace-nowrap">
                                                    Assign <ChevronDown className="w-3 h-3" />
                                                  </button>
                                                  {openAssignDropdown === task.id && (
                                                    <div className="absolute right-0 top-7 bg-white border border-neutral-200 rounded-lg shadow-lg z-30 py-1 min-w-[180px]">
                                                      <p className="px-3 py-1.5 text-xs font-medium text-neutral-400 uppercase tracking-wide border-b">Assign to</p>
                                                      {fieldWorkers.map(w => (
                                                        <button key={w.id} onClick={() => assignTask(task.id, w)}
                                                          className="block w-full px-3 py-2 text-sm text-left hover:bg-neutral-50">
                                                          <div className="font-medium text-neutral-900">{w.full_name}</div>
                                                          <div className="text-xs text-neutral-400 capitalize">{w.role.replace('_', ' ')}</div>
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Add task form */}
                                  {addingTaskForPhase === phase.id ? (
                                    <div className="mt-3 p-3 bg-white border border-blue-200 rounded-xl space-y-2.5">
                                      <input type="text" value={newTaskForm.name} onChange={e => setNewTaskForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Task name *" autoFocus
                                        className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                      <div className="grid grid-cols-2 gap-2">
                                        <select value={newTaskForm.assigned_to} onChange={e => setNewTaskForm(p => ({ ...p, assigned_to: e.target.value }))}
                                          className="px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                          <option value="">Unassigned</option>
                                          {fieldWorkers.map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                                        </select>
                                        <input type="date" value={newTaskForm.due_date} onChange={e => setNewTaskForm(p => ({ ...p, due_date: e.target.value }))}
                                          className="px-2 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                      </div>
                                      <div className="flex gap-1.5">
                                        {(['low', 'medium', 'high'] as const).map(p => (
                                          <button key={p} onClick={() => setNewTaskForm(prev => ({ ...prev, priority: p }))}
                                            className={`flex-1 py-1 rounded text-xs font-medium capitalize border transition-colors ${
                                              newTaskForm.priority === p
                                                ? p === 'high' ? 'border-red-400 bg-red-50 text-red-700' : p === 'low' ? 'border-green-400 bg-green-50 text-green-700' : 'border-blue-400 bg-blue-50 text-blue-700'
                                                : 'border-neutral-200 text-neutral-500 hover:border-neutral-300'
                                            }`}>{p}</button>
                                        ))}
                                      </div>
                                      <textarea rows={2} value={newTaskForm.deliverables} onChange={e => setNewTaskForm(p => ({ ...p, deliverables: e.target.value }))}
                                        placeholder="Deliverable — what should be produced..."
                                        className="w-full px-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => { setAddingTaskForPhase(null); setNewTaskForm({ name: '', assigned_to: '', due_date: '', priority: 'medium', notes: '', deliverables: '' }); }}
                                          className="px-3 py-1.5 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
                                        <button onClick={() => createTask(phase.id)} disabled={!newTaskForm.name.trim() || savingTask}
                                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                                          {savingTask && <Loader2 className="w-3 h-3 animate-spin" />} Add Task
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setAddingTaskForPhase(phase.id); setNewTaskForm({ name: '', assigned_to: '', due_date: '', priority: 'medium', notes: '', deliverables: '' }); }}
                                      className="mt-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium">
                                      <Plus className="w-3.5 h-3.5" /> Add Task
                                    </button>
                                  )}
                                </div>

                                {/* Delivered */}
                                <div className="p-4 bg-green-50/30">
                                  <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <Award className="w-3 h-3" /> Delivered
                                    {doneTasks.length > 0 && <span className="bg-green-200 text-green-800 rounded-full px-1.5 py-0.5 text-[9px]">{doneTasks.length}</span>}
                                  </p>
                                  {doneTasks.length === 0 ? (
                                    <p className="text-xs text-neutral-400 italic">Nothing completed yet.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {doneTasks.map(task => (
                                        <div key={task.id} onClick={() => setSelectedTask(task)} className="flex items-start gap-2.5 p-2.5 bg-white rounded-lg border border-green-100 cursor-pointer hover:shadow-sm transition-shadow">
                                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-600 line-through leading-snug">{task.name}</p>
                                            {task.deliverables && <p className="text-xs text-green-700 mt-0.5 line-clamp-2">{task.deliverables}</p>}
                                            {task.assigned_to_name && <p className="text-xs text-neutral-400 mt-0.5">{task.assigned_to_name}</p>}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Phase footer */}
                              <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                                <p className="text-xs text-neutral-400">
                                  {phaseTasks.length} task{phaseTasks.length !== 1 ? 's' : ''} · {doneTasks.length} delivered
                                </p>
                                {phase.status !== 'completed' && allDone && phaseTasks.length > 0 && (
                                  <button onClick={() => signOffPhase(phase.id)} disabled={signingOffPhase === phase.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-60">
                                    {signingOffPhase === phase.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                                    Sign Off Phase
                                  </button>
                                )}
                                {phase.status === 'completed' && (
                                  <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Phase Signed Off
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Phase */}
                  {addingPhase ? (
                    <div className="ml-14 border border-neutral-200 rounded-xl p-4 bg-white space-y-4">
                      {suggestedPhases.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Suggested phases — click to select</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestedPhases.map(phaseName => {
                              const alreadyAdded = phases.some(p => p.name === phaseName);
                              const isSelected = newPhaseForm.name === phaseName;
                              return (
                                <button key={phaseName} onClick={() => { if (!alreadyAdded) setNewPhaseForm(prev => ({ ...prev, name: phaseName })); }} disabled={alreadyAdded}
                                  className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all flex items-center gap-1.5 ${
                                    alreadyAdded ? 'border-green-200 bg-green-50 text-green-600 cursor-default' :
                                    isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' :
                                    'border-dashed border-neutral-300 text-neutral-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                                  }`}>
                                  {alreadyAdded || isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                  {phaseName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <input type="text" value={newPhaseForm.name} onChange={e => setNewPhaseForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Phase name…" autoFocus={suggestedPhases.length === 0}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-neutral-500 mb-1">Start Date</label>
                            <input type="date" value={newPhaseForm.start_date} onChange={e => setNewPhaseForm(prev => ({ ...prev, start_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-neutral-500 mb-1">End Date</label>
                            <input type="date" value={newPhaseForm.end_date} onChange={e => setNewPhaseForm(prev => ({ ...prev, end_date: e.target.value }))}
                              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                          </div>
                          <button onClick={() => createPhase()} disabled={!newPhaseForm.name.trim() || savingPhase}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap">
                            {savingPhase && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add Phase
                          </button>
                        </div>
                      </div>
                      <button onClick={() => { setAddingPhase(false); setNewPhaseForm({ name: '', start_date: '', end_date: '' }); }}
                        className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
                        Done adding phases
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingPhase(true)}
                      className="ml-14 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-blue-300 flex items-center justify-center -ml-14">
                        <Plus className="w-4 h-4 text-blue-400" />
                      </div>
                      Add Phase
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Task Detail Modal ── */}
      {selectedTask && (() => {
        const t = selectedTask;
        const priorityColors = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-green-100 text-green-700' };
        const statusLabels: Record<string, string> = { pending: 'Pending', 'in-progress': 'In Progress', done: 'Delivered', blocked: 'Blocked' };
        const statusColors: Record<string, string> = { pending: 'bg-neutral-100 text-neutral-600', 'in-progress': 'bg-blue-100 text-blue-700', done: 'bg-green-100 text-green-700', blocked: 'bg-red-100 text-red-700' };
        return (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-neutral-100 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[t.status]}`}>
                      {statusLabels[t.status] ?? t.status}
                    </span>
                    {t.priority && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${priorityColors[t.priority as 'high' | 'medium' | 'low'] ?? 'bg-neutral-100 text-neutral-600'}`}>
                        {t.priority} priority
                      </span>
                    )}
                  </div>
                  <h3 className={`font-semibold text-neutral-900 text-base leading-snug ${t.status === 'done' ? 'line-through text-neutral-500' : ''}`}>{t.name}</h3>
                </div>
                <button onClick={() => setSelectedTask(null)} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0">
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Meta row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {t.assigned_to_name && (
                    <div>
                      <p className="text-xs text-neutral-400 mb-0.5">Assigned To</p>
                      <p className="font-medium text-neutral-800">{t.assigned_to_name}</p>
                    </div>
                  )}
                  {t.due_date && (
                    <div>
                      <p className="text-xs text-neutral-400 mb-0.5">Due Date</p>
                      <p className="font-medium text-neutral-800">{new Date(t.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                </div>

                {/* Deliverables */}
                {t.deliverables && (
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Award className="w-3 h-3" /> Deliverable
                    </p>
                    <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100 leading-relaxed">{t.deliverables}</p>
                  </div>
                )}

                {/* Notes */}
                {t.notes && (
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">Notes</p>
                    <p className="text-sm text-neutral-700 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-100 leading-relaxed whitespace-pre-wrap">{t.notes}</p>
                  </div>
                )}

                {/* Empty state */}
                {!t.deliverables && !t.notes && !t.assigned_to_name && !t.due_date && (
                  <p className="text-sm text-neutral-400 italic text-center py-2">No additional details recorded for this task.</p>
                )}
              </div>

              {/* Footer actions */}
              {t.status !== 'done' && t.status !== 'blocked' && (
                <div className="px-5 pb-5 flex gap-2 border-t border-neutral-100 pt-4">
                  {t.status === 'pending' && (
                    <button onClick={() => { updateTaskStatus(t.id, 'in-progress'); setSelectedTask(prev => prev ? { ...prev, status: 'in-progress' } : null); }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Start Task
                    </button>
                  )}
                  {t.status === 'in-progress' && (
                    <button onClick={() => { updateTaskStatus(t.id, 'done'); setSelectedTask(null); }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium">
                      Mark as Delivered
                    </button>
                  )}
                  <button onClick={() => setSelectedTask(null)} className="px-4 py-2 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
                    Close
                  </button>
                </div>
              )}
              {(t.status === 'done' || t.status === 'blocked') && (
                <div className="px-5 pb-5 border-t border-neutral-100 pt-4">
                  <button onClick={() => setSelectedTask(null)} className="px-4 py-2 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── New Project Wizard ── */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {wizardStep === 1 ? 'New Project' : wizardStep === 2 ? wizardCategory : 'Project Details'}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {wizardStep === 1 ? 'What type of project is this?' : wizardStep === 2 ? 'Select the scope of work' : `${wizardCategory} — ${wizardSubType}`}
                </p>
              </div>
              <button onClick={() => setShowNewProject(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

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

            <div className="p-6 overflow-y-auto flex-1">
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROJECT_CATEGORIES.map(cat => {
                    const Icon = CATEGORY_ICONS[cat.id];
                    return (
                      <button key={cat.id} onClick={() => { setWizardCategory(cat.id); setWizardSubType(''); setWizardStep(2); }}
                        className="p-4 rounded-xl border-2 border-neutral-200 text-left hover:border-blue-300 hover:bg-blue-50 transition-all">
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
              {wizardStep === 2 && (
                <div>
                  <button onClick={() => setWizardStep(1)} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-5 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to project types
                  </button>
                  <div className="space-y-2">
                    {(PROJECT_CATEGORIES.find(c => c.id === wizardCategory)?.subtypes ?? []).map(sub => (
                      <button key={sub} onClick={() => { setWizardSubType(sub); setWizardStep(3); }}
                        className="w-full p-3.5 rounded-xl border-2 border-neutral-200 text-left text-sm font-medium text-neutral-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-900 transition-all">
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <button onClick={() => setWizardStep(2)} className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <span className="font-medium">{wizardCategory}</span> — {wizardSubType}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Project Name *</label>
                    <input type="text" value={newProjectForm.name} onChange={e => setNewProjectForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={`e.g. ${wizardSubType} — Lekki Phase 1`} autoFocus
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Project Manager</label>
                      <input type="text" value={newProjectForm.pm_name} onChange={e => setNewProjectForm(prev => ({ ...prev, pm_name: e.target.value }))}
                        placeholder="PM name"
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Deadline</label>
                      <input type="date" value={newProjectForm.deadline} onChange={e => setNewProjectForm(prev => ({ ...prev, deadline: e.target.value }))}
                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Budget (₦)</label>
                    <input type="text" value={newProjectForm.budget} onChange={e => setNewProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                      placeholder="e.g. 500,000,000"
                      className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
            </div>

            {wizardStep === 3 && (
              <div className="p-6 border-t border-neutral-200 flex justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowNewProject(false)} className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">Cancel</button>
                <button onClick={createProject} disabled={!newProjectForm.name.trim() || savingProject}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {savingProject && <Loader2 className="w-4 h-4 animate-spin" />} Create Project
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
