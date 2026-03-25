"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  Home,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Settings,
  StickyNote,
  Target,
  User2,
  Wrench,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ListTodo,
  Rss,
  X,
} from "lucide-react";
import {
  useDeals,
  useTasks,
  createActivity,
  createNote,
  getActivities,
  getActivityCount,
} from "@/lib/useStore";
import { useAuth } from "@/lib/auth";
import type { ActivityLog, Task } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEAM_MEMBERS = ["Ivan", "Bryce", "Jack"] as const;
const PAGE_SIZE = 30;

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  deal: <Home className="h-4 w-4" />,
  lead: <Target className="h-4 w-4" />,
  rehab: <Wrench className="h-4 w-4" />,
  draw: <DollarSign className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
};

const ENTITY_COLORS: Record<string, string> = {
  deal: "bg-brand-500/20 text-brand-400",
  lead: "bg-blue-500/20 text-blue-400",
  rehab: "bg-yellow-500/20 text-yellow-400",
  draw: "bg-green-500/20 text-green-400",
  note: "bg-purple-500/20 text-purple-400",
  system: "bg-dark-700 text-dark-400",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "Pending",
    icon: <Circle className="h-3.5 w-3.5" />,
    color: "text-dark-400",
  },
  in_progress: {
    label: "In Progress",
    icon: <Clock className="h-3.5 w-3.5" />,
    color: "text-yellow-400",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "text-green-400",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByDate(items: ActivityLog[]): Record<string, ActivityLog[]> {
  const groups: Record<string, ActivityLog[]> = {};
  for (const item of items) {
    const d = new Date(item.created_at);
    const key = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avatarColor(name: string): string {
  const colors = [
    "bg-brand-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-pink-500",
  ];
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ActivityPage() {
  const { user } = useAuth();

  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<"feed" | "tasks">("feed");

  // Activity feed (manual pagination)
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityOffset, setActivityOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Tasks from hook
  const { data: hookTasks, loading: tasksLoading, createTask, updateTask } = useTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => { setTasks(hookTasks); }, [hookTasks]);

  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [showAddTask, setShowAddTask] = useState(false);

  // Add task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to_name: "",
    due_date: "",
    deal_id: "",
  });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Deals from hook
  const { data: allDeals } = useDeals();
  const deals = useMemo(() => allDeals.map(d => ({ id: d.id, address: d.address, city: d.city, state: d.state })), [allDeals]);

  // Quick note
  const [noteContent, setNoteContent] = useState("");
  const [noteDealId, setNoteDealId] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Error
  const [error] = useState<string | null>(null);

  // ---- Activity fetching (manual for pagination) ----

  const fetchActivities = useCallback(async (offset: number, append: boolean) => {
    const rows = await getActivities(offset, PAGE_SIZE);
    if (append) {
      setActivities((prev) => [...prev, ...rows]);
    } else {
      setActivities(rows);
    }
    const total = await getActivityCount();
    setHasMore(offset + rows.length < total);
  }, []);

  useEffect(() => {
    setActivityLoading(true);
    fetchActivities(0, false).catch(() => {}).finally(() => setActivityLoading(false));
  }, [fetchActivities]);

  // Load more
  const loadMore = async () => {
    const nextOffset = activityOffset + PAGE_SIZE;
    setLoadingMore(true);
    await fetchActivities(nextOffset, true);
    setActivityOffset(nextOffset);
    setLoadingMore(false);
  };

  // ---- Task actions ----

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus: Record<string, string> = {
      pending: "in_progress",
      in_progress: "completed",
      completed: "pending",
    };
    const newStatus = nextStatus[task.status] as Task["status"];
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null }
          : t
      )
    );
    await updateTask(task.id, {
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    });
  };

  const addTask = async () => {
    if (!newTask.title.trim()) return;
    setTaskSubmitting(true);

    const created = await createTask({
      title: newTask.title.trim(),
      description: newTask.description.trim() || null,
      assigned_to_name: newTask.assigned_to_name || null,
      due_date: newTask.due_date || null,
      deal_id: newTask.deal_id || null,
      status: "pending",
      created_by: user?.id ?? null,
    });

    setNewTask({ title: "", description: "", assigned_to_name: "", due_date: "", deal_id: "" });
    setShowAddTask(false);

    // Log activity
    await createActivity({
      user_id: user?.id ?? null,
      user_name: user?.name ?? "System",
      action: "created task",
      entity_type: "system",
      entity_id: created.id,
      details: newTask.title.trim(),
    });

    setTaskSubmitting(false);
  };

  // ---- Quick note ----

  const postNote = async () => {
    if (!noteContent.trim() || !noteDealId) return;
    setNoteSubmitting(true);

    await createNote({
      deal_id: noteDealId,
      user_id: user?.id ?? null,
      user_name: user?.name ?? "Unknown",
      content: noteContent.trim(),
    });

    // Log activity
    const deal = deals.find((d) => d.id === noteDealId);
    await createActivity({
      user_id: user?.id ?? null,
      user_name: user?.name ?? "Unknown",
      action: "added a note",
      entity_type: "note" as const,
      entity_id: noteDealId,
      details: `on ${deal?.address ?? "a deal"}: "${noteContent.trim().slice(0, 80)}${noteContent.trim().length > 80 ? "..." : ""}"`,
    });

    setNoteContent("");
    setNoteDealId("");

    // Refresh feed
    await fetchActivities(0, false);
    setActivityOffset(0);

    setNoteSubmitting(false);
  };

  // ---- Filtered / grouped data ----

  const filteredTasks = tasks.filter(
    (t) => taskFilter === "all" || t.assigned_to_name === taskFilter
  );

  const tasksByStatus = {
    pending: filteredTasks.filter((t) => t.status === "pending"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    completed: filteredTasks.filter((t) => t.status === "completed"),
  };

  const activityGroups = groupByDate(activities);

  // ---- Render ----

  return (
    <div className="min-h-screen bg-dark-950 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-200 sm:text-3xl">Team Activity</h1>
          <p className="mt-1 text-dark-400">
            {user ? `Logged in as ${user.name}` : "Activity feed & task management"}
          </p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-500/90 hover:shadow-brand-500/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Mobile tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-dark-900 p-1 lg:hidden">
        <button
          onClick={() => setMobileTab("feed")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mobileTab === "feed"
              ? "bg-dark-800 text-dark-200"
              : "text-dark-500 hover:text-dark-300"
          }`}
        >
          <Rss className="h-4 w-4" />
          Feed
        </button>
        <button
          onClick={() => setMobileTab("tasks")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            mobileTab === "tasks"
              ? "bg-dark-800 text-dark-200"
              : "text-dark-500 hover:text-dark-300"
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Tasks
          {tasksByStatus.pending.length > 0 && (
            <span className="ml-1 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-xs text-brand-400">
              {tasksByStatus.pending.length}
            </span>
          )}
        </button>
      </div>

      {/* Main layout: feed + sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ====== LEFT: Activity Feed ====== */}
        <div
          className={`flex-1 min-w-0 ${
            mobileTab !== "feed" ? "hidden lg:block" : ""
          }`}
        >
          {/* Quick note form */}
          <div className="mb-6 rounded-xl border border-dark-700 bg-dark-900 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-dark-300">
              <MessageSquare className="h-4 w-4 text-brand-500" />
              Quick Note
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={noteDealId}
                onChange={(e) => setNoteDealId(e.target.value)}
                className="rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-48"
              >
                <option value="">Select deal...</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.address}, {d.city}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    postNote();
                  }
                }}
                placeholder="Write a note..."
                className="flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                onClick={postNote}
                disabled={!noteContent.trim() || !noteDealId || noteSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-500/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {noteSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Post
              </button>
            </div>
          </div>

          {/* Activity feed list */}
          <div className="rounded-xl border border-dark-700 bg-dark-900 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-dark-300">
              <Activity className="h-4 w-4 text-brand-500" />
              Activity Feed
            </div>

            {activityLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-dark-800" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-dark-800" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-dark-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity className="mb-3 h-10 w-10 text-dark-600" />
                <p className="text-sm text-dark-400">No activity yet</p>
                <p className="mt-1 text-xs text-dark-500">
                  Actions across deals, leads, and rehab items will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(activityGroups).map(([date, items]) => (
                  <div key={date}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-xs font-medium uppercase tracking-wider text-dark-500">
                        {date}
                      </span>
                      <div className="h-px flex-1 bg-dark-800" />
                    </div>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-dark-800/50"
                        >
                          {/* Avatar */}
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(item.user_name)}`}
                          >
                            {item.user_name.charAt(0).toUpperCase()}
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-dark-300">
                              <span className="font-medium text-dark-200">
                                {item.user_name}
                              </span>{" "}
                              {item.action}
                              {item.entity_id && item.entity_type !== "system" && (
                                <>
                                  {" "}
                                  <Link
                                    href={
                                      item.entity_type === "deal" || item.entity_type === "note"
                                        ? `/deals/${item.entity_id}`
                                        : item.entity_type === "lead"
                                        ? `/leads/${item.entity_id}`
                                        : "#"
                                    }
                                    className="font-medium text-brand-500 hover:text-brand-400 transition-colors"
                                  >
                                    {item.entity_type}
                                  </Link>
                                </>
                              )}
                            </p>
                            {item.details && (
                              <p className="mt-0.5 truncate text-xs text-dark-500">
                                {item.details}
                              </p>
                            )}
                          </div>

                          {/* Meta: icon + time */}
                          <div className="flex shrink-0 items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full p-1 ${ENTITY_COLORS[item.entity_type] ?? "bg-dark-800 text-dark-400"}`}
                            >
                              {ENTITY_ICONS[item.entity_type] ?? <Activity className="h-4 w-4" />}
                            </span>
                            <span className="whitespace-nowrap text-xs text-dark-500">
                              {relativeTime(item.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load more */}
            {!activityLoading && hasMore && activities.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-dark-300 transition-colors hover:bg-dark-700 hover:text-dark-200 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ====== RIGHT: Tasks Panel ====== */}
        <div
          className={`w-full lg:w-96 xl:w-[420px] shrink-0 ${
            mobileTab !== "tasks" ? "hidden lg:block" : ""
          }`}
        >
          <div className="rounded-xl border border-dark-700 bg-dark-900 p-4 sm:p-5">
            {/* Tasks header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-dark-300">
                <ListTodo className="h-4 w-4 text-brand-500" />
                Tasks
              </div>
              <button
                onClick={() => setShowAddTask(true)}
                className="rounded-md p-1.5 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Filter by person */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => setTaskFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  taskFilter === "all"
                    ? "bg-brand-500/20 text-brand-400"
                    : "bg-dark-800 text-dark-400 hover:text-dark-300"
                }`}
              >
                All
              </button>
              {TEAM_MEMBERS.map((name) => (
                <button
                  key={name}
                  onClick={() => setTaskFilter(taskFilter === name ? "all" : name)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    taskFilter === name
                      ? "bg-brand-500/20 text-brand-400"
                      : "bg-dark-800 text-dark-400 hover:text-dark-300"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Task list by status */}
            {tasksLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-dark-800" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ListTodo className="mb-3 h-10 w-10 text-dark-600" />
                <p className="text-sm text-dark-400">No tasks found</p>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="mt-3 text-sm font-medium text-brand-500 hover:text-brand-400"
                >
                  Create a task
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {(["pending", "in_progress", "completed"] as const).map((status) => {
                  const items = tasksByStatus[status];
                  if (items.length === 0) return null;
                  const config = STATUS_CONFIG[status];
                  return (
                    <div key={status}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={config.color}>{config.icon}</span>
                        <span className="text-xs font-medium uppercase tracking-wider text-dark-500">
                          {config.label}
                        </span>
                        <span className="text-xs text-dark-600">({items.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {items.map((task) => (
                          <div
                            key={task.id}
                            className="group flex items-start gap-3 rounded-lg border border-dark-700/50 bg-dark-800/50 px-3 py-2.5 transition-colors hover:border-dark-700 hover:bg-dark-800"
                          >
                            {/* Status toggle */}
                            <button
                              onClick={() => toggleTaskStatus(task)}
                              className={`mt-0.5 shrink-0 transition-colors hover:text-brand-400 ${config.color}`}
                              title={`Mark as ${
                                status === "pending"
                                  ? "in progress"
                                  : status === "in_progress"
                                  ? "completed"
                                  : "pending"
                              }`}
                            >
                              {status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : status === "in_progress" ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                <Circle className="h-4 w-4" />
                              )}
                            </button>

                            {/* Task content */}
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  status === "completed"
                                    ? "text-dark-500 line-through"
                                    : "text-dark-200"
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {task.assigned_to_name && (
                                  <span className="flex items-center gap-1 text-xs text-dark-500">
                                    <User2 className="h-3 w-3" />
                                    {task.assigned_to_name}
                                  </span>
                                )}
                                {task.due_date && (
                                  <span
                                    className={`flex items-center gap-1 text-xs ${
                                      new Date(task.due_date) < new Date() && status !== "completed"
                                        ? "text-red-400"
                                        : "text-dark-500"
                                    }`}
                                  >
                                    <Clock className="h-3 w-3" />
                                    {new Date(task.due_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                                {task.deal_id && (
                                  <Link
                                    href={`/deals/${task.deal_id}`}
                                    className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-400"
                                  >
                                    <Home className="h-3 w-3" />
                                    Deal
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== Add Task Modal ====== */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-dark-700 bg-dark-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark-200">New Task</h3>
              <button
                onClick={() => setShowAddTask(false)}
                className="rounded-md p-1 text-dark-400 transition-colors hover:bg-dark-800 hover:text-dark-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-400">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Schedule inspection"
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-400">
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 placeholder-dark-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Assign to */}
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-400">
                  Assign to
                </label>
                <select
                  value={newTask.assigned_to_name}
                  onChange={(e) => setNewTask((p) => ({ ...p, assigned_to_name: e.target.value }))}
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Unassigned</option>
                  {TEAM_MEMBERS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-400">
                  Due date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Link to deal */}
              <div>
                <label className="mb-1 block text-xs font-medium text-dark-400">
                  Link to deal
                </label>
                <select
                  value={newTask.deal_id}
                  onChange={(e) => setNewTask((p) => ({ ...p, deal_id: e.target.value }))}
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-dark-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">No deal</option>
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.address}, {d.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddTask(false)}
                className="rounded-lg px-4 py-2 text-sm text-dark-400 transition-colors hover:text-dark-200"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!newTask.title.trim() || taskSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-500/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {taskSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
