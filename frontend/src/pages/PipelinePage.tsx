
import { useState } from "react"
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  FileText,
  GitBranch,
  Layers3,
  Play,
  RefreshCw,
  Server,
  Terminal,
  Workflow,
  XCircle,
  Zap,
  History
} from "lucide-react"

type TaskStatus = "success" | "running" | "pending" | "failed"

type PipelineTask = {
  id: string
  name: string
  description: string
  command: string
  duration: string
  status: TaskStatus
  startedAt: string
  logs: string[]
}

type PipelineRun = {
  id: string
  status: "success" | "running" | "failed"
  startedAt: string
  duration: string
  tasksCompleted: string
  triggeredBy: string
}

const initialTasks: PipelineTask[] = [
  {
    id: "dbt_build_core",
    name: "Build Core Models",
    description: "Build and test Gold dimensional and fact models.",
    command: "dbt build --exclude tag:ai",
    duration: "2m 34s",
    status: "success",
    startedAt: "10:00:02",
    logs: [
      "[INFO] Starting dbt core model build",
      "[INFO] Running fact_orders",
      "[INFO] Running fact_order_items",
      "[INFO] Running dim_customers",
      "[INFO] Running dim_restaurants",
      "[INFO] Running dim_food",
      "[INFO] Running dim_date",
      "[INFO] Running dbt tests",
      "[SUCCESS] 6 tests passed, 0 warnings, 0 errors",
      "[SUCCESS] Core model build completed",
    ],
  },
  {
    id: "enrich_reviews",
    name: "Enrich Reviews",
    description: "Use an LLM to classify sentiment, topics, and key issues.",
    command: "python /opt/airflow/ai/enrich_reviews.py",
    duration: "48s",
    status: "success",
    startedAt: "10:02:38",
    logs: [
      "[INFO] Initializing review enrichment",
      "[INFO] Fetching pending reviews",
      "[INFO] Batch size: 5",
      "[INFO] Provider: Groq",
      "[INFO] Processing review batch",
      "[INFO] Successfully enriched 5 reviews",
      "[SUCCESS] Review enrichment completed",
    ],
  },
  {
    id: "dbt_build_ai",
    name: "Build AI Marts",
    description: "Build analytical models using enriched review data.",
    command: "dbt build --select tag:ai",
    duration: "36s",
    status: "success",
    startedAt: "10:03:27",
    logs: [
      "[INFO] Starting AI mart build",
      "[INFO] Running mart_review_insights",
      "[INFO] Updating review insight aggregates",
      "[SUCCESS] AI mart build completed",
    ],
  },
]

const initialRuns: PipelineRun[] = [
  {
    id: "manual__2026-11-04T10:00:00",
    status: "success",
    startedAt: "Today, 10:00 AM",
    duration: "3m 58s",
    tasksCompleted: "3/3",
    triggeredBy: "Manual",
  },
  {
    id: "manual__2026-11-03T18:30:00",
    status: "success",
    startedAt: "Yesterday, 6:30 PM",
    duration: "4m 12s",
    tasksCompleted: "3/3",
    triggeredBy: "Manual",
  },
  {
    id: "manual__2026-11-03T12:00:00",
    status: "failed",
    startedAt: "Yesterday, 12:00 PM",
    duration: "1m 42s",
    tasksCompleted: "1/3",
    triggeredBy: "Manual",
  },
  {
    id: "manual__2026-11-02T09:15:00",
    status: "success",
    startedAt: "Nov 2, 9:15 AM",
    duration: "4m 05s",
    tasksCompleted: "3/3",
    triggeredBy: "Manual",
  },
]

const statusConfig = {
  success: {
    label: "Success",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  running: {
    label: "Running",
    icon: RefreshCw,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  pending: {
    label: "Pending",
    icon: Clock3,
    color: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    color: "text-rose-600",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${config.bg} ${config.color}`}
    >
      <Icon
        size={12}
        className={status === "running" ? "animate-spin" : ""}
      />
      {config.label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  description: string
  icon: typeof Activity
  accent: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
    </div>
  )
}

function TaskCard({
  task,
  selected,
  onClick,
}: {
  task: PipelineTask
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? "border-primary/50 bg-primary/[0.04] ring-1 ring-primary/10"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
          {task.id === "enrich_reviews" ? (
            <Zap size={17} />
          ) : (
            <Database size={17} />
          )}
        </div>
        <StatusBadge status={task.status} />
      </div>

      <h3 className="mt-4 text-sm font-semibold">{task.name}</h3>
      <p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">
        {task.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-[10px] text-muted-foreground">
          <Clock3 size={11} className="mr-1 inline" />
          {task.duration}
        </span>
        <span className="text-[10px] font-medium text-primary">
          View logs <ArrowRight size={11} className="ml-1 inline" />
        </span>
      </div>
    </button>
  )
}

export function PipelinePage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [runs, setRuns] = useState(initialRuns)
  const [selectedTask, setSelectedTask] = useState(initialTasks[0])
  const [selectedRun, setSelectedRun] = useState(initialRuns[0])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)
  const [showAllRuns, setShowAllRuns] = useState(false)
  const [activeTab, setActiveTab] = useState<"logs" | "details">("logs")
  const [lastUpdated, setLastUpdated] = useState("Just now")

  const successfulRuns = runs.filter((run) => run.status === "success").length
  const failedRuns = runs.filter((run) => run.status === "failed").length

  const refreshPipeline = () => {
    setIsRefreshing(true)

    window.setTimeout(() => {
      setLastUpdated("Just now")
      setIsRefreshing(false)
    }, 800)
  }

  const triggerPipeline = () => {
    if (isTriggering) return

    setIsTriggering(true)

    const run: PipelineRun = {
      id: `manual__${Date.now()}`,
      status: "running",
      startedAt: "Just now",
      duration: "In progress",
      tasksCompleted: "0/3",
      triggeredBy: "Manual",
    }

    const runningTasks = initialTasks.map((task, index) => ({
      ...task,
      status: (index === 0 ? "running" : "pending") as TaskStatus,
      duration: "—",
      logs:
        index === 0
          ? ["[INFO] Pipeline triggered manually", "[INFO] Starting core model build"]
          : task.logs,
    }))

    setRuns((previous) => [run, ...previous])
    setSelectedRun(run)
    setTasks(runningTasks)
    setSelectedTask(runningTasks[0])
    setActiveTab("logs")

    // Simulated run completion. No actual Airflow request is made.
    window.setTimeout(() => {
      const completedTasks = initialTasks.map((task) => ({
        ...task,
        status: "success" as TaskStatus,
      }))

      const completedRun = {
        ...run,
        status: "success" as const,
        duration: "3m 58s",
        tasksCompleted: "3/3",
      }

      setTasks(completedTasks)
      setSelectedTask(completedTasks[0])
      setRuns((previous) =>
        previous.map((item) =>
          item.id === run.id ? completedRun : item,
        ),
      )
      setSelectedRun(completedRun)
      setIsTriggering(false)
      setLastUpdated("Just now")
    }, 3500)
  }

  const visibleRuns = showAllRuns ? runs : runs.slice(0, 4)

  return (
    <div className="space-y-6 pb-8">
      {/* Heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Workflow size={14} />
            <span>Operations</span>
            <span>/</span>
            <span className="text-foreground">Pipeline Monitor</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Pipeline Monitor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor your data pipeline, task execution, and AI enrichment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshPipeline}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
          <button
            onClick={triggerPipeline}
            disabled={isTriggering}
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Play size={13} />
            {isTriggering ? "Running..." : "Trigger DAG"}
          </button>
        </div>
      </div>

      {/* Demo notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            Demo monitoring data
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Task statuses, execution history, and trigger actions are simulated.
            Live Airflow integration will be added later.
          </p>
        </div>
      </div>

      {/* Overview metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="DAG status"
          value={isTriggering ? "Running" : "Healthy"}
          description="restaurant_ai_pipeline"
          icon={Workflow}
          accent="bg-emerald-500/10 text-emerald-600"
        />
        <MetricCard
          label="Successful runs"
          value={String(successfulRuns)}
          description="In displayed run history"
          icon={CheckCircle2}
          accent="bg-emerald-500/10 text-emerald-600"
        />
        <MetricCard
          label="Failed runs"
          value={String(failedRuns)}
          description="In displayed run history"
          icon={XCircle}
          accent="bg-rose-500/10 text-rose-600"
        />
        <MetricCard
          label="Enriched reviews"
          value="241"
          description="Current project snapshot"
          icon={Layers3}
          accent="bg-violet-500/10 text-violet-600"
        />
      </div>

      {/* DAG information */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">DAG overview</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              restaurant_ai_pipeline
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Success
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Running
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              Pending
            </span>
          </div>
        </div>

        <div className="mt-6 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {tasks.map((task, index) => (
            <div key={task.id} className="contents">
              <TaskCard
                task={task}
                selected={selectedTask.id === task.id}
                onClick={() => {
                  setSelectedTask(task)
                  setActiveTab("logs")
                }}
              />
              {index < tasks.length - 1 && (
                <div className="flex justify-center text-muted-foreground">
                  <ArrowRight className="hidden md:block" size={18} />
                  <ArrowDown className="md:hidden" size={18} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>
            <Clock3 size={12} className="mr-1 inline" />
            Last updated: {lastUpdated}
          </span>
          <span>
            <Server size={12} className="mr-1 inline" />
            Airflow Standalone · Local Docker
          </span>
        </div>
      </section>

      {/* Task details and logs */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Task inspector</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedTask.id}
            </p>
          </div>

          <StatusBadge status={selectedTask.status} />
        </div>

        <div className="flex gap-5 border-b border-border px-5">
          <button
            onClick={() => setActiveTab("logs")}
            className={`border-b-2 py-3 text-xs font-semibold ${
              activeTab === "logs"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Execution logs
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`border-b-2 py-3 text-xs font-semibold ${
              activeTab === "details"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}
          >
            Task details
          </button>
        </div>

        {activeTab === "logs" ? (
          <div className="min-h-56 bg-[#111827] p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3">
              <span className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                <Terminal size={12} />
                CONSOLE OUTPUT
              </span>
              <span className="text-[10px] text-slate-500">Mock logs</span>
            </div>
            <div className="space-y-2 font-mono text-[11px] leading-5">
              {selectedTask.logs.map((log, index) => (
                <p
                  key={index}
                  className={
                    log.includes("SUCCESS")
                      ? "text-emerald-400"
                      : log.includes("ERROR")
                        ? "text-rose-400"
                        : "text-slate-300"
                  }
                >
                  <span className="mr-3 text-slate-600">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {log}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Task name
              </p>
              <p className="mt-2 text-sm font-medium">{selectedTask.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Task ID
              </p>
              <p className="mt-2 font-mono text-xs">{selectedTask.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Start time
              </p>
              <p className="mt-2 text-sm">{selectedTask.startedAt}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duration
              </p>
              <p className="mt-2 text-sm">{selectedTask.duration}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Command
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs">
                {selectedTask.command}
              </pre>
            </div>
            <div className="sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedTask.description}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Run history */}
      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <History size={16} className="text-primary" />
              <h2 className="text-sm font-semibold">Recent DAG runs</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pipeline execution history
            </p>
          </div>
          <span className="rounded-md border border-border px-2 py-1 text-[10px] text-muted-foreground">
            {runs.length} runs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Run ID</th>
                <th className="px-5 py-3 font-semibold">Started</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Tasks</th>
                <th className="px-5 py-3 font-semibold">Duration</th>
                <th className="px-5 py-3 font-semibold">Triggered by</th>
              </tr>
            </thead>
            <tbody>
              {visibleRuns.map((run) => (
                <tr
                  key={run.id}
                  onClick={() => {
                    setSelectedRun(run)
                  }}
                  className={`cursor-pointer border-t border-border transition hover:bg-muted/30 ${
                    selectedRun.id === run.id ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  <td className="px-5 py-4 font-mono text-[10px]">
                    {run.id.length > 30
                      ? `${run.id.slice(0, 30)}...`
                      : run.id}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {run.startedAt}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="px-5 py-4">{run.tasksCompleted}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {run.duration}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {run.triggeredBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {runs.length > 4 && (
          <button
            onClick={() => setShowAllRuns((previous) => !previous)}
            className="flex w-full items-center justify-center gap-2 border-t border-border py-3 text-xs font-medium text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
          >
            {showAllRuns ? "Show less" : "Show all runs"}
            <ChevronDown
              size={13}
              className={showAllRuns ? "rotate-180" : ""}
            />
          </button>
        )}
      </section>

      {/* Enrichment information */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap size={17} className="text-primary" />
            <h2 className="text-sm font-semibold">AI review enrichment</h2>
          </div>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold text-violet-600">
            Groq · LLM processing
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Enriched reviews</p>
            <p className="mt-1 text-xl font-semibold">241</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Embedding model</p>
            <p className="mt-1 text-xl font-semibold">Gemini</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Batch size</p>
            <p className="mt-1 text-xl font-semibold">5</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold">Enrichment output</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Sentiment label · Sentiment score · Topic · Key issue · Model ·
            Provider · Latency · Token usage
          </p>
          <p className="mt-2 font-mono text-[10px] text-primary">
            workspace.ai.review_enriched
          </p>
        </div>
      </section>
    </div>
  )
}
