
import { useState } from "react"
import {
  ArrowDown,
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  Database,
  Download,
  History,
  Play,
  Sparkles,
  Table2,
  Terminal,
  AlertCircle,
} from "lucide-react"
import { api, getApiError } from "@/services/api"

type TextToSQLResponse = {
  question: string
  generated_sql: string
  columns: string[]
  rows: unknown[]
  row_count: number
  answer: string
}

const suggestedQueries = [
  {
    category: "Revenue",
    question: "What are the top 10 cities by total revenue?",
  },
  {
    category: "Restaurants",
    question: "Show the top 10 restaurants by total orders",
  },
  {
    category: "Customer sentiment",
    question: "What percentage of reviews are negative?",
  },
  {
    category: "Delivery",
    question: "Which cities have the highest average delivery time?",
  },
]

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "—"

  if (typeof value === "number") {
    return value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (typeof value === "object") {
    return JSON.stringify(value)
  }

  return String(value)
}
const normalizeRow = (
  row: unknown,
  columns: string[],
): unknown[] => {
  if (Array.isArray(row)) {
    return row
  }

  if (row && typeof row === "object") {
    const record = row as Record<string, unknown>

    return columns.map((column) => {
      if (column in record) return record[column]

      // Handle differences in column-name casing.
      const matchingKey = Object.keys(record).find(
        (key) => key.toLowerCase() === column.toLowerCase(),
      )

      return matchingKey ? record[matchingKey] : null
    })
  }

  return [row]
}

export function TextToSQLPage() {
  const [question, setQuestion] = useState("")
  const [sql, setSql] = useState("")
  const [result, setResult] = useState<TextToSQLResponse | null>(null)
  const [activeTab, setActiveTab] = useState<"results" | "sql">("results")
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<string[]>([])

  const runQuery = async (value?: string) => {
    const query = (value ?? question).trim()

    if (!query || isRunning) return

    setQuestion(query)
    setIsRunning(true)
    setHasRun(false)
    setError("")
    setResult(null)
    setSql("")

    try {
      const response = await api.post<TextToSQLResponse>(
        "/ai/text-to-sql",
        { question: query },
      )

      const data = response.data

      setResult(data)
      setSql(data.generated_sql)
      setActiveTab("results")
      setHasRun(true)

      setHistory((previous) => [
        query,
        ...previous.filter((item) => item !== query),
      ].slice(0, 10))
    } catch (err) {
      setError(getApiError(err))
      setResult(null)
      setSql("")
    } finally {
      setIsRunning(false)
    }
  }

  const copySQL = async () => {
    if (!sql) return

    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("Unable to copy SQL to clipboard.")
    }
  }

  const downloadCSV = () => {
    if (!result) return

    const escapeCSV = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`

    const csv = [
      result.columns.map(escapeCSV).join(","),
      ...result.rows.map((rawRow) =>
        normalizeRow(rawRow, result.columns)
          .map(escapeCSV)
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "restaurant-query-results.csv"
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Database size={14} />
            <span>Intelligence</span>
            <span>/</span>
            <span className="text-foreground">Text to SQL</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Text-to-SQL Playground
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Turn natural language questions into actionable business insights.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium">Databricks SQL</span>
          <ChevronDown size={13} className="text-muted-foreground" />
        </div>
      </div>

      {/* Query input */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold">Ask your data</h2>
            <p className="text-xs text-muted-foreground">
              Describe the analysis you want to perform.
            </p>
          </div>
        </div>

        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              runQuery()
            }
          }}
          placeholder="e.g. Show me the top 10 cities by total revenue..."
          rows={3}
          className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-muted-foreground">
            Enter to run · Shift + Enter for a new line
          </span>

          <button
            onClick={() => runQuery()}
            disabled={!question.trim() || isRunning}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRunning ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Play size={14} />
                Generate & Run
              </>
            )}
          </button>
        </div>
      </section>

      {/* Suggested questions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Try asking</h2>
          <span className="text-xs text-muted-foreground">
            Suggested questions
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {suggestedQueries.map((item) => (
            <button
              key={item.question}
              onClick={() => runQuery(item.question)}
              disabled={isRunning}
              className="rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:bg-primary/[0.03] disabled:opacity-50"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {item.category}
              </span>

              <p className="mt-2 text-xs font-medium leading-5">
                {item.question}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Query failed</p>
            <p className="mt-1 text-xs leading-5">{error}</p>
          </div>
        </div>
      )}

      {/* Query workspace */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-primary" />
            <h2 className="text-sm font-semibold">Query workspace</h2>

            {hasRun && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                Executed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory((previous) => !previous)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <History size={13} />
              History
            </button>

            <button
              onClick={copySQL}
              disabled={!sql}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy SQL"}
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="border-b border-border bg-muted/20 px-5 py-4">
            <p className="mb-2 text-xs font-semibold">Recent queries</p>

            {history.length > 0 ? (
              <div className="space-y-1">
                {history.map((item) => (
                  <button
                    key={item}
                    onClick={() => runQuery(item)}
                    disabled={isRunning}
                    className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <Clock3 size={13} />
                    {item}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Your recent queries will appear here.
              </p>
            )}
          </div>
        )}

        {/* Generated SQL */}
        <div className="border-b border-border">
          <div className="flex items-center justify-between bg-muted/30 px-5 py-3">
            <div className="flex items-center gap-2">
              <Code2 size={14} className="text-primary" />
              <span className="text-xs font-semibold">Generated SQL</span>
              <span className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground">
                DATABRICKS SQL
              </span>
            </div>

            <span className="text-[10px] text-muted-foreground">
              Read-only · Generated by AI
            </span>
          </div>

          <div className="min-h-36 bg-[#111827] p-4 sm:p-5">
            {sql ? (
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-slate-200">
                {sql}
              </pre>
            ) : (
              <p className="font-mono text-xs text-slate-500">
                Generated SQL will appear here after you run a question.
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("results")}
                className={`flex items-center gap-2 border-b-2 py-2 text-xs font-semibold transition ${activeTab === "results"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Table2 size={14} />
                Results
              </button>

              <button
                onClick={() => setActiveTab("sql")}
                className={`flex items-center gap-2 border-b-2 py-2 text-xs font-semibold transition ${activeTab === "sql"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Code2 size={14} />
                SQL
              </button>
            </div>

            {result && activeTab === "results" && (
              <button
                onClick={downloadCSV}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Download size={13} />
                Export CSV
              </button>
            )}
          </div>

          {activeTab === "sql" ? (
            <div className="min-h-36 bg-[#111827] p-5">
              {sql ? (
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-slate-200">
                  {sql}
                </pre>
              ) : (
                <p className="font-mono text-xs text-slate-500">
                  No SQL generated yet.
                </p>
              )}
            </div>
          ) : result ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="w-12 px-5 py-3 font-semibold text-muted-foreground">
                        #
                      </th>

                      {result.columns.map((column) => (
                        <th
                          key={column}
                          className="px-5 py-3 font-semibold text-muted-foreground"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {result.rows.map((rawRow, index) => {
                      const row = normalizeRow(rawRow, result.columns)

                      return (
                        <tr
                          key={index}
                          className="border-t border-border transition hover:bg-muted/30"
                        >
                          <td className="px-5 py-3 text-muted-foreground">
                            {index + 1}
                          </td>

                          {row.map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-5 py-3 font-mono text-foreground"
                            >
                              {formatValue(value)}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {result.rows.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  The query executed successfully but returned no rows.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>{result.row_count} rows returned</span>
                </div>

                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                  <Check size={12} />
                  Query successful
                </span>
              </div>
            </>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                {isRunning ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <BarChart3 size={21} />
                )}
              </div>

              <p className="mt-4 text-sm font-semibold">
                {isRunning ? "Running your query..." : "No query results yet"}
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                {isRunning
                  ? "Generating SQL and retrieving results from the backend."
                  : "Ask a question above and run it to see the generated SQL and query results here."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* AI explanation */}
      {hasRun && result && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles size={16} />
            </div>

            <div>
              <h2 className="text-sm font-semibold">AI interpretation</h2>
              <p className="text-xs text-muted-foreground">
                Explanation returned by the backend
              </p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {result.answer}
          </p>

          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-500/5 p-3 text-xs leading-5 text-amber-700 dark:text-amber-400">
            <ArrowDown size={14} className="mt-0.5 shrink-0" />
            AI-generated SQL and explanations should be reviewed before using
            them for business-critical decisions.
          </div>
        </section>
      )}
    </div>
  )
}
