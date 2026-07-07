import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { CheckCircle2, Clock, Circle, Calendar, Building2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Project, Phase, Task } from '../../lib/database.types';

export default function ProjectClientView() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [{ data: proj }, { data: phaseData }, { data: taskData }] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('phases').select('*').eq('project_id', id).order('order_index'),
        supabase.from('tasks').select('id, phase_id, status, name, deliverables').eq('project_id', id),
      ]);
      if (!proj) { setNotFound(true); setLoading(false); return; }
      setProject(proj);
      setPhases(phaseData ?? []);
      setTasks(taskData ?? []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-3 text-neutral-500">
        <AlertCircle className="w-10 h-10 text-neutral-300" />
        <p className="text-sm">Project not found or access has been removed.</p>
      </div>
    );
  }

  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const overallProgress = phases.length === 0 ? 0 : Math.round((completedPhases / phases.length) * 100);

  const getPhaseProgress = (phaseId: string) => {
    const pt = tasks.filter(t => t.phase_id === phaseId);
    if (pt.length === 0) return 0;
    return Math.round((pt.filter(t => t.status === 'done').length / pt.length) * 100);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-neutral-900 text-white">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">B</div>
            <span className="font-semibold text-sm">BrokerOS</span>
          </div>
          <span className="text-xs text-neutral-400">Project Progress Report</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-8 space-y-6">
        {/* Project header */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-neutral-900">{project.name}</h1>
                {project.type && <p className="text-sm text-neutral-500 mt-0.5">{project.type}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {project.pm_name && (
                    <span className="text-xs text-neutral-500">Project Manager: <span className="font-medium text-neutral-700">{project.pm_name}</span></span>
                  )}
                  {project.deadline && (
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Target: <span className="font-medium text-neutral-700 ml-0.5">{new Date(project.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          {phases.length > 0 && (
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Overall Completion</span>
                <span className="text-sm font-bold text-neutral-900">{overallProgress}%</span>
              </div>
              <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${overallProgress}%`,
                    background: overallProgress >= 100 ? '#16a34a' : 'linear-gradient(90deg, #2563eb, #3b82f6)',
                  }}
                />
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                <span>{completedPhases} of {phases.length} phases complete</span>
              </div>
            </div>
          )}
        </div>

        {/* Phases */}
        {phases.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide px-1">Project Phases</h2>
            {phases.map((phase, idx) => {
              const progress = getPhaseProgress(phase.id);
              const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
              const doneCount = phaseTasks.filter(t => t.status === 'done').length;

              return (
                <div key={phase.id} className={`bg-white rounded-xl border overflow-hidden ${
                  phase.status === 'completed' ? 'border-green-200' :
                  phase.status === 'in-progress' ? 'border-blue-200' : 'border-neutral-200'
                }`}>
                  <div className="p-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      phase.status === 'completed' ? 'bg-green-600 text-white' :
                      phase.status === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-400'
                    }`}>
                      {phase.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                       phase.status === 'in-progress' ? <Clock className="w-4 h-4" /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-neutral-900 text-sm">{phase.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                          phase.status === 'completed' ? 'bg-green-100 text-green-700' :
                          phase.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {phase.status === 'in-progress' ? 'In Progress' : phase.status === 'completed' ? 'Signed Off' : 'Upcoming'}
                        </span>
                      </div>
                      {(phase.start_date || phase.end_date) && (
                        <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {phase.start_date ? new Date(phase.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
                          {' → '}
                          {phase.end_date ? new Date(phase.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-lg font-bold text-neutral-900">{progress}%</p>
                      <p className="text-xs text-neutral-400">{doneCount}/{phaseTasks.length} tasks</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {phaseTasks.length > 0 && (
                    <div className="px-4 pb-3">
                      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Delivered items (only for completed/active phases) */}
                  {phase.status !== 'pending' && phaseTasks.filter(t => t.status === 'done' && t.deliverables).length > 0 && (
                    <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50/50">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Deliverables</p>
                      <div className="space-y-1">
                        {phaseTasks.filter(t => t.status === 'done' && t.deliverables).map(task => (
                          <div key={task.id} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-neutral-600">{task.deliverables}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-neutral-400">
            Powered by <span className="font-semibold text-neutral-600">BrokerOS</span> · Project progress as of {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
