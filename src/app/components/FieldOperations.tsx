import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Camera,
  FileText,
  Mic,
  Upload,
  Clock,
  MapPin,
  AlertCircle,
  Check,
  Image as ImageIcon,
  Video,
  BarChart3,
  X,
  MessageSquare,
  RotateCcw,
  FolderKanban,
} from 'lucide-react';

interface AssignedTask {
  id: string;
  name: string;
  phase: string;
  project: string;
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
}

interface MyTask {
  id: string;
  title: string;
  project: string;
  location: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: string;
  assignedBy: string;
  fromPM?: boolean;
  phase?: string;
}

export function FieldOperations() {
  const [selectedTask, setSelectedTask] = useState<MyTask | null>(null);
  const [activeView, setActiveView] = useState<'tasks' | 'report'>('tasks');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [pmAssignedTasks, setPmAssignedTasks] = useState<AssignedTask[]>([]);
  const [taskDoneStatus, setTaskDoneStatus] = useState<Record<string, boolean>>({});
  const [taskEvidence, setTaskEvidence] = useState<Record<string, string[]>>({});
  const [hoursWorked, setHoursWorked] = useState('');
  const [incidentNotes, setIncidentNotes] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('field_assigned_tasks');
      if (stored) {
        const parsed: AssignedTask[] = JSON.parse(stored);
        setPmAssignedTasks(parsed.filter((t) => t.assignedTo === 'Robert Lee'));
      }
    } catch (_) {}
  }, []);

  const staticTasks: MyTask[] = [
    {
      id: 'TSK-4521',
      title: 'Install electrical wiring — Floor 3',
      project: 'Oakwood Tower',
      location: 'Site A - Floor 3',
      priority: 'high',
      dueDate: 'Today 3:00 PM',
      status: 'in-progress',
      assignedBy: 'David Park',
    },
    {
      id: 'TSK-4520',
      title: 'HVAC unit inspection',
      project: 'Riverside Plaza',
      location: 'Building B - Roof',
      priority: 'medium',
      dueDate: 'Today 5:00 PM',
      status: 'pending',
      assignedBy: 'Jennifer Kim',
    },
    {
      id: 'TSK-4519',
      title: 'Concrete pour foundation check',
      project: 'Industrial Warehouse',
      location: 'Site C - Zone 2',
      priority: 'high',
      dueDate: 'Tomorrow 8:00 AM',
      status: 'pending',
      assignedBy: 'David Park',
    },
  ];

  const pmTasks: MyTask[] = pmAssignedTasks.map((t) => ({
    id: t.id,
    title: t.name,
    project: t.project,
    location: t.phase,
    priority: 'high' as const,
    dueDate: 'This week',
    status: 'pending',
    assignedBy: t.assignedBy,
    fromPM: true,
    phase: t.phase,
  }));

  const completedToday = [
    { id: 'TSK-4518', title: 'Safety equipment check', project: 'Downtown Office', completedAt: '11:30 AM' },
    { id: 'TSK-4517', title: 'Material delivery confirmation', project: 'Oakwood Tower', completedAt: '9:15 AM' },
  ];

  const allWeeklyTasks = [
    ...pmTasks,
    ...staticTasks,
  ];

  const toggleTaskDone = (taskId: string) =>
    setTaskDoneStatus((prev) => ({ ...prev, [taskId]: !prev[taskId] }));

  const addEvidence = (taskId: string, type: 'photo' | 'video') => {
    const label = type === 'photo'
      ? `photo_${taskId}_${Date.now()}.jpg`
      : `video_${taskId}_${Date.now()}.mp4`;
    setTaskEvidence((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] || []), label],
    }));
  };

  const removeEvidence = (taskId: string, idx: number) => {
    setTaskEvidence((prev) => ({
      ...prev,
      [taskId]: prev[taskId].filter((_, i) => i !== idx),
    }));
  };

  const mockSupervisorComments: Record<string, { author: string; text: string; date: string; status: 'rework' | 'approved' | 'note' }[]> = {
    'TSK-4521': [
      {
        author: 'David Park',
        text: 'Floor 3 wiring looks good on the south side. Junction box on grid C-7 needs re-checking — upload a close-up photo.',
        date: 'May 3, 9:45 AM',
        status: 'rework',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-white border-b border-neutral-200 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">
              {activeView === 'tasks' ? 'My Tasks' : 'Weekly Report'}
            </h1>
            <p className="text-sm text-neutral-500">Robert Lee · Field Operations</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm">
            RL
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xl font-semibold text-blue-900">
              {staticTasks.length + pmTasks.length}
            </p>
            <p className="text-xs text-blue-600">Active</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xl font-semibold text-green-900">{completedToday.length}</p>
            <p className="text-xs text-green-600">Done Today</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-xl font-semibold text-orange-900">
              {staticTasks.filter((t) => t.priority === 'high').length + pmTasks.length}
            </p>
            <p className="text-xs text-orange-600">Urgent</p>
          </div>
        </div>
      </div>

      {/* Task List View */}
      {activeView === 'tasks' && (
        <div className="p-4 space-y-3">

          {/* PM-Assigned Tasks */}
          {pmTasks.length > 0 && (
            <>
              <div className="flex items-center gap-2 mt-2">
                <FolderKanban className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
                  From Project Management
                </h2>
              </div>
              {pmTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-white rounded-xl border-2 border-purple-200 p-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-purple-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FolderKanban className="w-3 h-3 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-neutral-900 text-sm">{task.title}</h3>
                        <AlertCircle className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-purple-700 font-medium">{task.phase}</p>
                      <p className="text-xs text-neutral-500 mt-1">{task.project}</p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Assigned by {task.assignedBy} · {task.dueDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border-t border-neutral-200 pt-3" />
            </>
          )}

          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
            Today's Tasks
          </h2>

          {staticTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-white rounded-xl border border-neutral-200 p-4 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start gap-3">
                <button className="w-6 h-6 rounded-full border-2 border-neutral-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {task.status === 'completed' && <Check className="w-4 h-4 text-green-600" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-neutral-900">{task.title}</h3>
                    {task.priority === 'high' && (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <FileText className="w-4 h-4" />
                      <span>{task.project}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{task.dueDate}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <p className="text-xs text-neutral-500">Assigned by {task.assignedBy}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mt-6">
            Completed Today
          </h2>
          {completedToday.map((task) => (
            <div key={task.id} className="bg-white rounded-xl border border-neutral-200 p-4 opacity-60">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900 line-through">{task.title}</h3>
                  <p className="text-sm text-neutral-600 mt-1">{task.project}</p>
                  <p className="text-xs text-neutral-500 mt-2">Completed at {task.completedAt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly Report — Template */}
      {activeView === 'report' && (
        <div className="p-4 space-y-4">
          {reportSubmitted ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">Report Submitted!</h2>
              <p className="text-sm text-neutral-500 mt-2">
                Your Week 18 report has been sent for review.
              </p>
              <button
                onClick={() => {
                  setReportSubmitted(false);
                  setTaskDoneStatus({});
                  setTaskEvidence({});
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
                <p className="text-sm font-semibold text-blue-900">Week 18 — May 4–10, 2026</p>
                <p className="text-xs text-blue-600 mt-0.5">Due: Sunday, May 10 · Fill in each task below</p>
              </div>

              {/* Task template checklist */}
              <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-100 bg-neutral-50">
                  <h3 className="font-semibold text-neutral-900 text-sm">This Week's Tasks</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Mark each task done and attach photo/video evidence
                  </p>
                </div>

                <div className="divide-y divide-neutral-100">
                  {allWeeklyTasks.map((task) => {
                    const isDone = taskDoneStatus[task.id] ?? false;
                    const evidence = taskEvidence[task.id] ?? [];
                    return (
                      <div
                        key={task.id}
                        className={`p-4 ${isDone ? 'bg-green-50' : ''}`}
                      >
                        {/* Task header row */}
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleTaskDone(task.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              isDone
                                ? 'bg-green-600 border-green-600'
                                : 'border-neutral-300'
                            }`}
                          >
                            {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm font-medium ${isDone ? 'text-green-800 line-through' : 'text-neutral-900'}`}>
                                {task.title}
                              </p>
                              {task.fromPM && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full flex-shrink-0">
                                  <FolderKanban className="w-3 h-3" />
                                  PM
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {task.project}
                              {task.phase ? ` · ${task.phase}` : ` · ${task.location}`}
                            </p>
                          </div>
                        </div>

                        {/* Evidence per task */}
                        <div className="mt-3 ml-9">
                          <div className="flex gap-2 mb-2">
                            <button
                              onClick={() => addEvidence(task.id, 'photo')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium active:scale-95 transition-transform"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Photo
                            </button>
                            <button
                              onClick={() => addEvidence(task.id, 'video')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700 font-medium active:scale-95 transition-transform"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Video
                            </button>
                          </div>
                          {evidence.length > 0 && (
                            <div className="space-y-1">
                              {evidence.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-3 py-1.5"
                                >
                                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                                    {file.endsWith('.jpg') ? (
                                      <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                                    ) : (
                                      <Video className="w-3.5 h-3.5 text-purple-500" />
                                    )}
                                    <span>{file}</span>
                                  </div>
                                  <button onClick={() => removeEvidence(task.id, idx)}>
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
              </div>

              {/* Hours worked */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Total Hours Worked This Week
                </label>
                <input
                  type="number"
                  placeholder="e.g. 40"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
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
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  className="w-full px-3 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                onClick={() => setReportSubmitted(true)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-base active:scale-[0.98] transition-transform"
              >
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="bg-white border-b border-neutral-200 p-4 sticky top-0">
            <button
              onClick={() => setSelectedTask(null)}
              className="text-blue-600 font-medium mb-3"
            >
              ← Back
            </button>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{selectedTask.title}</h2>
                <p className="text-sm text-neutral-500 mt-1">{selectedTask.id}</p>
              </div>
              {selectedTask.fromPM && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                  <FolderKanban className="w-3 h-3" />
                  From PM
                </span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Task info */}
            <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-neutral-500" />
                <span className="text-neutral-900">{selectedTask.project}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-neutral-500" />
                <span className="text-neutral-900">{selectedTask.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-neutral-500" />
                <span className="font-medium text-neutral-900">{selectedTask.dueDate}</span>
              </div>
            </div>

            {/* Supervisor comments */}
            {mockSupervisorComments[selectedTask.id] && (
              <div>
                <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  Supervisor Review
                </h3>
                {mockSupervisorComments[selectedTask.id].map((comment, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border ${
                      comment.status === 'rework'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-neutral-900">{comment.author}</span>
                      <div className="flex items-center gap-2">
                        {comment.status === 'rework' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                            <RotateCcw className="w-3 h-3" />
                            Rework Needed
                          </span>
                        )}
                        <span className="text-xs text-neutral-500">{comment.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Update Task</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex flex-col items-center gap-2 p-6 bg-white border-2 border-neutral-200 rounded-xl active:scale-95 transition-transform">
                  <Camera className="w-8 h-8 text-blue-600" />
                  <span className="text-sm font-medium text-neutral-900">Take Photo</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-6 bg-white border-2 border-neutral-200 rounded-xl active:scale-95 transition-transform">
                  <Video className="w-8 h-8 text-purple-600" />
                  <span className="text-sm font-medium text-neutral-900">Record Video</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-6 bg-white border-2 border-neutral-200 rounded-xl active:scale-95 transition-transform">
                  <Mic className="w-8 h-8 text-green-600" />
                  <span className="text-sm font-medium text-neutral-900">Voice Note</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-6 bg-white border-2 border-neutral-200 rounded-xl active:scale-95 transition-transform">
                  <Upload className="w-8 h-8 text-orange-600" />
                  <span className="text-sm font-medium text-neutral-900">Upload File</span>
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Add Note</h3>
              <textarea
                rows={4}
                placeholder="Quick update or notes..."
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Evidence grid */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Evidence</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-neutral-400" />
                </div>
                <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-neutral-400" />
                </div>
                <button className="aspect-square border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center active:scale-95 transition-transform">
                  <Camera className="w-6 h-6 text-neutral-400" />
                </button>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <h3 className="font-medium text-neutral-900 mb-3">Update Status</h3>
              <div className="space-y-2">
                <button className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-xl text-left active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Mark as In Progress</span>
                  </div>
                </button>
                <button className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-xl text-left active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Mark as Completed</span>
                  </div>
                </button>
                <button className="w-full p-4 bg-red-50 border-2 border-red-200 rounded-xl text-left active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Report Issue</span>
                  </div>
                </button>
              </div>
            </div>

            <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-medium text-lg active:scale-[0.98] transition-transform">
              Submit Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
