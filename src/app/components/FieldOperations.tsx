import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Camera,
  FileText,
  Upload,
  Clock,
  MapPin,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Video,
  BarChart3,
  X,
  FolderKanban,
  Loader2,
  Paperclip,
  MessageCircle,
  MessageSquare,
  Music2,
  Mic,
  MicOff,
  LogOut,
} from 'lucide-react';

// Replace with your WhatsApp Business number (digits only, include country code, no +)
const MANAGER_WHATSAPP = '2348000000000';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Task, TaskNote } from '../../lib/database.types';

interface TaskWithRelations extends Task {
  project: { name: string } | null;
  phase: { name: string } | null;
}

interface EvidenceFile {
  name: string;
  url: string;
  type: string;
}

function getWeekInfo() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const weekNum = Math.ceil(
    (((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + 1) / 7
  );
  return {
    weekStart: monday.toISOString().split('T')[0],
    label: `Week ${weekNum} — ${fmt(monday)}–${fmt(sunday)}`,
    dueLabel: `Sunday, ${fmt(sunday)}`,
  };
}

export function FieldOperations() {
  const { user, profile, signOut } = useAuth();

  const [activeTasks, setActiveTasks] = useState<TaskWithRelations[]>([]);
  const [completedTasks, setCompletedTasks] = useState<TaskWithRelations[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null);
  const [activeView, setActiveView] = useState<'tasks' | 'report'>('tasks');

  // Evidence per task (in task detail modal)
  const [evidenceByTask, setEvidenceByTask] = useState<Record<string, EvidenceFile[]>>({});
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  // Task status update
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Task notes
  const [notesByTask, setNotesByTask] = useState<Record<string, TaskNote[]>>({});
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Weekly report state
  const [reportDoneStatus, setReportDoneStatus] = useState<Record<string, boolean>>({});
  const [reportEvidence, setReportEvidence] = useState<Record<string, string[]>>({});
  const [hoursWorked, setHoursWorked] = useState('');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadTaskId = useRef<string | null>(null);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFor, setRecordingFor] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunks = useRef<Blob[]>([]);

  const weekInfo = getWeekInfo();

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoadingTasks(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [{ data: active }, { data: done }] = await Promise.all([
      supabase
        .from('tasks')
        .select('*, project:projects(name), phase:phases(name)')
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in-progress', 'blocked'])
        .order('created_at'),
      supabase
        .from('tasks')
        .select('*, project:projects(name), phase:phases(name)')
        .eq('assigned_to', user.id)
        .eq('status', 'done')
        .gte('assigned_at', today.toISOString())
        .order('assigned_at', { ascending: false }),
    ]);

    const allActive = (active as TaskWithRelations[]) ?? [];
    const allDone = (done as TaskWithRelations[]) ?? [];
    setActiveTasks(allActive);
    setCompletedTasks(allDone);
    setLoadingTasks(false);

    // Load evidence and notes from DB (fixes the "evidence disappears on refresh" bug)
    const allIds = [...allActive, ...allDone].map(t => t.id);
    if (allIds.length > 0) {
      const [{ data: evData }, { data: noteData }] = await Promise.all([
        supabase.from('task_evidence').select('*').in('task_id', allIds),
        supabase.from('task_notes').select('*').in('task_id', allIds).order('created_at', { ascending: true }),
      ]);

      if (evData) {
        const grouped: Record<string, EvidenceFile[]> = {};
        evData.forEach(ev => {
          if (!grouped[ev.task_id]) grouped[ev.task_id] = [];
          grouped[ev.task_id].push({
            name: ev.file_name ?? ev.file_url.split('/').pop() ?? 'file',
            url: ev.file_url,
            type: ev.file_type ?? 'application/octet-stream',
          });
        });
        setEvidenceByTask(grouped);
      }

      if (noteData) {
        const grouped: Record<string, TaskNote[]> = {};
        noteData.forEach(n => {
          if (!grouped[n.task_id]) grouped[n.task_id] = [];
          grouped[n.task_id].push(n as TaskNote);
        });
        setNotesByTask(grouped);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    setUpdatingStatus(taskId);
    await supabase.from('tasks').update({ status }).eq('id', taskId);
    setUpdatingStatus(null);

    if (status === 'done') {
      const task = activeTasks.find(t => t.id === taskId);
      if (task) {
        setActiveTasks(prev => prev.filter(t => t.id !== taskId));
        setCompletedTasks(prev => [{ ...task, status: 'done' }, ...prev]);
      }
      if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, status: 'done' } : prev);
    } else {
      setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, status } : prev);
    }
  };

  const triggerFileUpload = (taskId: string) => {
    activeUploadTaskId.current = taskId;
    fileInputRef.current?.click();
  };

  const uploadEvidenceFile = async (taskId: string, file: File) => {
    if (!user) return;
    setUploadingFor(taskId);
    const path = `${user.id}/${taskId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('evidence').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(path);
      await supabase.from('task_evidence').insert({
        task_id: taskId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        uploaded_by: user.id,
      });
      setEvidenceByTask(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] ?? []), { name: file.name, url: publicUrl, type: file.type }],
      }));
    }
    setUploadingFor(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const taskId = activeUploadTaskId.current;
    if (!file || !taskId || !user) return;
    await uploadEvidenceFile(taskId, file);
    e.target.value = '';
  };

  const startRecording = async (taskId: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunks.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(recordingChunks.current, { type: mimeType });
        const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: mimeType });
        await uploadEvidenceFile(taskId, file);
        setIsRecording(false);
        setRecordingFor(null);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingFor(taskId);
    } catch {
      alert('Microphone access denied. Please allow microphone access to record voice notes.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const removeEvidence = (taskId: string, idx: number) => {
    setEvidenceByTask(prev => ({
      ...prev,
      [taskId]: prev[taskId].filter((_, i) => i !== idx),
    }));
  };

  const addNote = async (taskId: string, body: string, noteType: TaskNote['note_type'] = 'text') => {
    if (!body.trim() || !user || !profile) return;
    setAddingNote(true);
    const { data } = await supabase.from('task_notes').insert({
      task_id: taskId,
      worker_id: user.id,
      worker_name: profile.full_name,
      note_type: noteType,
      body: body.trim(),
    }).select().single();
    if (data) {
      setNotesByTask(prev => ({
        ...prev,
        [taskId]: [...(prev[taskId] ?? []), data as TaskNote],
      }));
      setNewNoteText('');
    }
    setAddingNote(false);
  };

  const submitReport = async () => {
    if (!user || !profile) return;
    setSubmittingReport(true);

    const { data: report, error } = await supabase
      .from('weekly_reports')
      .insert({
        worker_id: user.id,
        worker_name: profile.full_name,
        week_start: weekInfo.weekStart,
        hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
        incident_notes: incidentNotes || null,
        status: 'pending-review',
        company_id: profile.company_id ?? undefined,
      })
      .select()
      .single();

    if (!error && report) {
      const allReportTasks = [...activeTasks, ...completedTasks];
      if (allReportTasks.length > 0) {
        await supabase.from('report_task_items').insert(
          allReportTasks.map(task => ({
            report_id: report.id,
            task_name: task.name,
            done: task.status === 'done' || (reportDoneStatus[task.id] ?? false),
            evidence_urls: reportEvidence[task.id] ?? [],
          }))
        );
      }
      setReportSubmitted(true);
    }

    setSubmittingReport(false);
  };

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const priorityColors: Record<string, string> = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-neutral-400',
  };

  const statusLabel: Record<string, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    done: 'Done',
    blocked: 'Blocked',
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mobile Header */}
      <div className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              {activeView === 'tasks' ? 'My Tasks' : 'Weekly Report'}
            </h1>
            <p className="text-sm text-neutral-500">
              {profile?.full_name ?? '...'} · Field Operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent(`Hi, this is ${profile?.full_name ?? 'a field worker'} from site. I need to speak with the manager.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center"
              title="Contact Manager via WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm">
              {initials}
            </div>
            <button
              onClick={signOut}
              className="w-9 h-9 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center hover:bg-neutral-200 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-blue-900">{activeTasks.length}</p>
            <p className="text-xs text-blue-600">Active</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-green-900">{completedTasks.length}</p>
            <p className="text-xs text-green-600">Done Today</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-lg font-semibold text-orange-900">
              {activeTasks.filter(t => t.status === 'blocked').length}
            </p>
            <p className="text-xs text-orange-600">Blocked</p>
          </div>
        </div>
      </div>

      {/* ── Task List View ── */}
      {activeView === 'tasks' && (
        <div className="p-4 space-y-3">
          {loadingTasks ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-neutral-200 mb-3" />
              <h3 className="font-medium text-neutral-900">No tasks assigned</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Your manager will assign tasks to you from Project Management.
              </p>
            </div>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <>
                  <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Active Tasks</h2>
                  {activeTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`bg-white rounded-xl border p-4 cursor-pointer active:scale-[0.99] transition-transform ${
                        task.status === 'blocked' ? 'border-red-200' : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          task.status === 'in-progress' ? 'border-blue-400' :
                          task.status === 'blocked' ? 'border-red-400' : 'border-neutral-300'
                        }`}>
                          {task.status === 'in-progress' && <Clock className="w-3.5 h-3.5 text-blue-500" />}
                          {task.status === 'blocked' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-medium text-neutral-900 text-sm">{task.name}</h3>
                            {task.status === 'blocked' && (
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="space-y-1">
                            {task.project?.name && (
                              <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{task.project.name}</span>
                              </div>
                            )}
                            {task.phase?.name && (
                              <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{task.phase.name}</span>
                              </div>
                            )}
                            {task.status === 'blocked' && (
                              <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                Task is blocked
                              </p>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              task.status === 'blocked' ? 'bg-red-100 text-red-700' :
                              'bg-neutral-100 text-neutral-600'
                            }`}>
                              {statusLabel[task.status]}
                            </span>
                            {task.status === 'in-progress' && (
                              <span className="text-xs text-neutral-400">Tap to update</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {completedTasks.length > 0 && (
                <>
                  <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mt-6">Completed Today</h2>
                  {completedTasks.map(task => (
                    <div key={task.id} className="bg-white rounded-xl border border-neutral-200 p-4 opacity-60">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900 text-sm line-through">{task.name}</h3>
                          {task.project?.name && (
                            <p className="text-xs text-neutral-500 mt-1">{task.project.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Weekly Report ── */}
      {activeView === 'report' && (
        <div className="p-4 space-y-4">
          {reportSubmitted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">Report Submitted!</h2>
              <p className="text-sm text-neutral-500 mt-2">
                Your {weekInfo.label.split('—')[0].trim()} report has been sent for review.
              </p>
              <button
                onClick={() => {
                  setReportSubmitted(false);
                  setReportDoneStatus({});
                  setReportEvidence({});
                  setHoursWorked('');
                  setIncidentNotes('');
                }}
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Week banner */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-900">{weekInfo.label}</p>
                <p className="text-xs text-blue-600 mt-0.5">Due: {weekInfo.dueLabel} · Fill in each task below</p>
              </div>

              {/* Task checklist */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50">
                  <h3 className="font-semibold text-neutral-900 text-sm">This Week's Tasks</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Mark each task done and attach evidence</p>
                </div>

                {loadingTasks ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                ) : activeTasks.length === 0 && completedTasks.length === 0 ? (
                  <p className="p-6 text-sm text-neutral-400 text-center">No tasks assigned this week.</p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {[...activeTasks, ...completedTasks].map(task => {
                      const isDone = task.status === 'done' || (reportDoneStatus[task.id] ?? false);
                      const evidence = reportEvidence[task.id] ?? [];
                      return (
                        <div key={task.id} className={`p-4 ${isDone ? 'bg-green-50' : ''}`}>
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => setReportDoneStatus(prev => ({ ...prev, [task.id]: !isDone }))}
                              disabled={task.status === 'done'}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                                isDone ? 'bg-green-600 border-green-600' : 'border-neutral-300'
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm font-medium ${isDone ? 'text-green-800 line-through' : 'text-neutral-900'}`}>
                                  {task.name}
                                </p>
                                {task.phase_id && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                                    <FolderKanban className="w-3 h-3" />
                                    PM
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {task.project?.name}
                                {task.phase?.name ? ` · ${task.phase.name}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Evidence per task in report */}
                          <div className="mt-3 ml-9">
                            <button
                              onClick={() => {
                                activeUploadTaskId.current = `report_${task.id}`;
                                fileInputRef.current?.click();
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Add Evidence
                            </button>
                            {evidence.length > 0 && (
                              <div className="space-y-1 mt-2">
                                {evidence.map((url, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-3 py-1.5">
                                    <div className="flex items-center gap-2 text-xs text-neutral-700">
                                      <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                                      <span className="truncate max-w-[180px]">{url.split('/').pop()}</span>
                                    </div>
                                    <button onClick={() => setReportEvidence(prev => ({
                                      ...prev,
                                      [task.id]: prev[task.id].filter((_, i) => i !== idx),
                                    }))}>
                                      <X className="w-3.5 h-3.5 text-neutral-400" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hours */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Total Hours Worked This Week
                </label>
                <input
                  type="number"
                  placeholder="e.g. 40"
                  value={hoursWorked}
                  onChange={e => setHoursWorked(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-2xl font-semibold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Incidents */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Any Incidents or Issues?
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe any safety incidents, delays, or blockers this week..."
                  value={incidentNotes}
                  onChange={e => setIncidentNotes(e.target.value)}
                  className="w-full px-3 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                onClick={submitReport}
                disabled={submittingReport}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-base active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingReport && <Loader2 className="w-5 h-5 animate-spin" />}
                Submit Weekly Report
              </button>
            </>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex z-40">
        <button
          onClick={() => setActiveView('tasks')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeView === 'tasks' ? 'text-blue-600' : 'text-neutral-400'
          }`}
        >
          <CheckCircle2 className="w-6 h-6" />
          <span className="text-xs font-medium">My Tasks</span>
        </button>
        <button
          onClick={() => setActiveView('report')}
          className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
            activeView === 'report' ? 'text-blue-600' : 'text-neutral-400'
          }`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs font-medium">Weekly Report</span>
        </button>
      </div>

      {/* ── Task Detail Modal ── */}
      {selectedTask && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="bg-white border-b border-neutral-200 p-4 sticky top-0">
            <button onClick={() => setSelectedTask(null)} className="text-blue-600 font-medium mb-3">
              ← Back
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{selectedTask.name}</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {selectedTask.project?.name ?? 'Unknown project'}
                </p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedTask.status === 'done' ? 'bg-green-100 text-green-700' :
                selectedTask.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                selectedTask.status === 'blocked' ? 'bg-red-100 text-red-700' :
                'bg-neutral-100 text-neutral-600'
              }`}>
                {statusLabel[selectedTask.status]}
              </span>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Task info */}
            <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
              {selectedTask.project?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-900">{selectedTask.project.name}</span>
                </div>
              )}
              {selectedTask.phase?.name && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-900">{selectedTask.phase.name}</span>
                </div>
              )}
              {selectedTask.notes && (
                <p className="text-sm text-neutral-600">{selectedTask.notes}</p>
              )}
            </div>

            {/* Upload Evidence */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Evidence</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => triggerFileUpload(selectedTask.id)}
                  disabled={uploadingFor === selectedTask.id || isRecording}
                  className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-neutral-200 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {uploadingFor === selectedTask.id ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-blue-600" />
                  )}
                  <span className="text-xs font-medium text-neutral-900 text-center">Photo / Video</span>
                </button>
                <button
                  onClick={() =>
                    isRecording && recordingFor === selectedTask.id
                      ? stopRecording()
                      : startRecording(selectedTask.id)
                  }
                  disabled={uploadingFor === selectedTask.id || (isRecording && recordingFor !== selectedTask.id)}
                  className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50 ${
                    isRecording && recordingFor === selectedTask.id
                      ? 'bg-red-50 border-red-300 animate-pulse'
                      : 'bg-white border-neutral-200'
                  }`}
                >
                  {isRecording && recordingFor === selectedTask.id ? (
                    <MicOff className="w-6 h-6 text-red-600" />
                  ) : (
                    <Mic className="w-6 h-6 text-purple-600" />
                  )}
                  <span className="text-xs font-medium text-neutral-900 text-center">
                    {isRecording && recordingFor === selectedTask.id ? 'Stop' : 'Voice Note'}
                  </span>
                </button>
                <button
                  onClick={() => triggerFileUpload(selectedTask.id)}
                  disabled={uploadingFor === selectedTask.id || isRecording}
                  className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-neutral-200 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Upload className="w-6 h-6 text-orange-600" />
                  <span className="text-xs font-medium text-neutral-900 text-center">Upload File</span>
                </button>
              </div>
              {isRecording && recordingFor === selectedTask.id && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-sm text-red-700 font-medium">Recording… tap Stop when done</span>
                </div>
              )}
              {uploadingFor === selectedTask.id && !isRecording && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                  <span className="text-sm text-blue-700">Uploading…</span>
                </div>
              )}

              {(evidenceByTask[selectedTask.id] ?? []).length > 0 ? (
                <div className="space-y-2">
                  {evidenceByTask[selectedTask.id].map((file, idx) => (
                    <div key={idx} className="bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <a href={file.url} target="_blank" rel="noopener noreferrer">
                          <img src={file.url} alt={file.name} className="w-full max-h-48 object-cover" />
                        </a>
                      ) : file.type.startsWith('audio/') ? (
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Music2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <span className="text-xs text-neutral-600 truncate">{file.name}</span>
                          </div>
                          <audio controls src={file.url} className="w-full h-10" />
                        </div>
                      ) : file.type.startsWith('video/') ? (
                        <video controls src={file.url} className="w-full max-h-48" />
                      ) : null}
                      <div className="flex items-center justify-between px-3 py-2">
                        {!file.type.startsWith('image/') && !file.type.startsWith('audio/') && !file.type.startsWith('video/') ? (
                          <div className="flex items-center gap-2 text-sm text-neutral-700 min-w-0">
                            <Paperclip className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate text-blue-600 underline">{file.name}</a>
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400 truncate">{file.name}</span>
                        )}
                        <button onClick={() => removeEvidence(selectedTask.id, idx)} className="ml-2 flex-shrink-0">
                          <X className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 text-center py-3">No evidence uploaded yet.</p>
              )}
            </div>

            {/* Status Update */}
            {selectedTask.status !== 'done' && selectedTask.status !== 'blocked' && (
              <div>
                <h3 className="font-medium text-neutral-900 mb-3">Update Status</h3>
                <div className="space-y-2">
                  {selectedTask.status === 'pending' && (
                    <button
                      onClick={() => updateTaskStatus(selectedTask.id, 'in-progress')}
                      disabled={updatingStatus === selectedTask.id}
                      className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-left active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        {updatingStatus === selectedTask.id ? (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-600" />
                        )}
                        <span className="font-medium text-blue-900">Mark as In Progress</span>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => updateTaskStatus(selectedTask.id, 'done')}
                    disabled={updatingStatus === selectedTask.id}
                    className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-xl text-left active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      {updatingStatus === selectedTask.id ? (
                        <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      <span className="font-medium text-green-900">Mark as Completed</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {selectedTask.status === 'blocked' && (
              <div>
                <h3 className="font-medium text-neutral-900 mb-3">Task is Blocked</h3>
                <a
                  href={`https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent(`Task BLOCKED: "${selectedTask.name}"${selectedTask.project?.name ? ` (${selectedTask.project.name})` : ''}. Please advise.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-transform"
                >
                  <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-green-900">Report Blocked via WhatsApp</span>
                </a>
              </div>
            )}

            {selectedTask.status === 'done' && (
              <div className="flex items-center justify-center gap-2 py-4 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Task completed</span>
              </div>
            )}

            {/* ── Notes & Updates ── */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neutral-500" />
                Notes & Updates
              </h3>

              {/* Existing notes */}
              {(notesByTask[selectedTask.id] ?? []).length > 0 && (
                <div className="space-y-2 mb-4">
                  {notesByTask[selectedTask.id].map(note => (
                    <div key={note.id} className={`rounded-xl p-3 border ${
                      note.note_type === 'whatsapp_log' ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {note.note_type === 'whatsapp_log' ? (
                          <MessageCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                        )}
                        <span className="text-xs text-neutral-500">
                          {new Date(note.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(note.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {note.note_type === 'whatsapp_log' && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Sent to manager</span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-800">{note.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {(notesByTask[selectedTask.id] ?? []).length === 0 && (
                <p className="text-xs text-neutral-400 text-center py-2 mb-3">No notes yet.</p>
              )}

              {/* New note input */}
              <textarea
                rows={2}
                placeholder="Add a field update, observation, or progress note..."
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => addNote(selectedTask.id, newNoteText)}
                  disabled={!newNoteText.trim() || addingNote}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                  Save Note
                </button>
                <a
                  href={`https://wa.me/${MANAGER_WHATSAPP}?text=${encodeURIComponent(`Update on "${selectedTask.name}" (${selectedTask.project?.name ?? 'project'}): ${newNoteText}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { if (newNoteText.trim()) { addNote(selectedTask.id, newNoteText, 'whatsapp_log'); } }}
                  className={`px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl flex items-center gap-2 active:scale-[0.98] transition-transform ${!newNoteText.trim() ? 'pointer-events-none opacity-40' : ''}`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Send to Manager
                </a>
              </div>
              <p className="text-xs text-neutral-400 mt-2 text-center">
                "Send to Manager" opens WhatsApp and logs the note here automatically.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
