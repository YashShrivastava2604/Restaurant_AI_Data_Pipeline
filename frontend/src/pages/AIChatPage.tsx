
import { useState } from "react"
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Utensils,
  User,
} from "lucide-react"
import { api, getApiError } from "@/services/api"

type ReviewSource = {
  id: string
  restaurant: string
  city: string
  rating: string | number
  sentiment: "Positive" | "Negative" | "Neutral"
  similarity: number
  review: string
  topic?: string
  keyIssue?: string
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  sources?: ReviewSource[]
  retrievedCount?: number
}

type RAGApiSource = {
  similarity: number
  restaurant_name?: string | null
  city?: string | null
  rating?: string | number | null
  sentiment_label?: string | null
  topic?: string | null
  key_issue?: string | null
  review_text?: string | null
}

type RAGResponse = {
  answer: string
  sources: RAGApiSource[]
  retrieved_count: number
  corpus_size: number
}

const suggestedQuestions = [
  {
    category: "Customer experience",
    question: "What are customers saying about restaurant service?",
    icon: MessageSquare,
  },
  {
    category: "Food quality",
    question: "What are the most common complaints about food quality?",
    icon: Utensils,
  },
  {
    category: "Sentiment analysis",
    question: "Why are customers leaving negative reviews?",
    icon: ThumbsDown,
  },
  {
    category: "Restaurant insights",
    question: "What makes highly rated restaurants stand out?",
    icon: Sparkles,
  },
]

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hello! I'm your Restaurant Review Assistant. I can analyze customer feedback, identify recurring complaints, explore sentiment patterns, and help you understand what customers really think.\n\nWhat would you like to investigate?",
    timestamp: "Just now",
  },
]

function formatAnswer(content: string) {
  return content.split("\n").map((line, index) => {
    const parts = line.split(/(\*\*.*?\*\*)/g)

    return (
      <p key={index} className={line.trim() === "" ? "h-3" : "leading-7"}>
        {parts.map((part, partIndex) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={partIndex} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={partIndex}>{part}</span>
          ),
        )}
      </p>
    )
  })
}

function normalizeSentiment(value?: string | null): ReviewSource["sentiment"] {
  const sentiment = value?.toLowerCase()

  if (sentiment === "positive") return "Positive"
  if (sentiment === "negative") return "Negative"

  return "Neutral"
}

function mapSources(sources: RAGApiSource[]): ReviewSource[] {
  return sources.map((source, index) => ({
    id: `source-${index}`,
    restaurant: source.restaurant_name || "Unknown restaurant",
    city: source.city || "Unknown city",
    rating: source.rating ?? "N/A",
    sentiment: normalizeSentiment(source.sentiment_label),
    similarity:
      source.similarity <= 1
        ? Math.round(source.similarity * 100)
        : Math.round(source.similarity),
    review: source.review_text || "Review text unavailable.",
    topic: source.topic || undefined,
    keyIssue: source.key_issue || undefined,
  }))
}

function SourceCard({ source }: { source: ReviewSource }) {
  const sentimentStyle = {
    Positive: "bg-emerald-500/10 text-emerald-600",
    Negative: "bg-rose-500/10 text-rose-600",
    Neutral: "bg-amber-500/10 text-amber-600",
  }

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{source.restaurant}</p>
          <p className="text-xs text-muted-foreground">
            {source.city} · Source {source.id.replace("source-", "")}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${sentimentStyle[source.sentiment]}`}
        >
          {source.sentiment}
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        "{source.review}"
      </p>

      {(source.topic || source.keyIssue) && (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {source.topic && (
            <p>
              Topic: <strong className="text-foreground">{source.topic}</strong>
            </p>
          )}
          {source.keyIssue && (
            <p>
              Key issue:{" "}
              <strong className="text-foreground">{source.keyIssue}</strong>
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          Rating: <strong className="text-foreground">{source.rating}/5</strong>
        </span>
        <span className="text-xs font-semibold text-primary">
          {source.similarity}% match
        </span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
    </div>
  )
}

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [expandedSources, setExpandedSources] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [corpusSize, setCorpusSize] = useState<number | null>(null)

  const sendMessage = async (question?: string) => {
    const content = (question ?? input).trim()

    if (!content || isTyping) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }

    setMessages((previous) => [...previous, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const response = await api.post<RAGResponse>("/ai/rag-chat", {
        question: content,
      })

      const data = response.data
      const assistantMessageId = crypto.randomUUID()

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sources: mapSources(data.sources || []),
        retrievedCount: data.retrieved_count,
      }

      setCorpusSize(data.corpus_size)
      setMessages((previous) => [...previous, assistantMessage])

      if (data.sources?.length) {
        setExpandedSources((previous) => [...previous, assistantMessageId])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `I couldn't process your question. ${getApiError(error)}`,
        timestamp: "Just now",
      }

      setMessages((previous) => [...previous, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    if (isTyping) return

    setMessages(initialMessages)
    setInput("")
    setExpandedSources([])
  }

  const toggleSources = (id: string) => {
    setExpandedSources((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    )
  }

  const copyAnswer = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // Clipboard access may be unavailable in some browser contexts.
    }
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-[620px] flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles size={19} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              AI Review Assistant
            </h1>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">
                Connected to RAG API
              </span>
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                LIVE
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={clearChat}
          disabled={isTyping}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <Plus size={14} />
          New conversation
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    message.role === "assistant"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Bot size={17} />
                  ) : (
                    <User size={16} />
                  )}
                </div>

                <div
                  className={`min-w-0 max-w-3xl ${
                    message.role === "user" ? "text-right" : "flex-1"
                  }`}
                >
                  <div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {message.role === "assistant"
                        ? "Review Assistant"
                        : "You"}
                    </span>
                    <span>·</span>
                    <span>{message.timestamp}</span>
                  </div>

                  <div
                    className={`inline-block rounded-2xl px-4 py-3 text-left text-sm ${
                      message.role === "user"
                        ? "rounded-tr-sm bg-primary text-primary-foreground"
                        : "w-full rounded-tl-sm bg-muted/60 text-foreground"
                    }`}
                  >
                    {message.role === "assistant"
                      ? formatAnswer(message.content)
                      : message.content}
                  </div>

                  {message.sources && (
                    <div className="mt-3">
                      <button
                        onClick={() => toggleSources(message.id)}
                        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted"
                      >
                        <Search size={13} className="text-primary" />
                        {message.retrievedCount ?? message.sources.length} retrieved review sources
                        <ChevronDown
                          size={13}
                          className={`transition-transform ${
                            expandedSources.includes(message.id)
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {expandedSources.includes(message.id) && (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {message.sources.map((source) => (
                            <SourceCard key={source.id} source={source} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {message.role === "assistant" && message.id !== "welcome" && (
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        onClick={() => copyAnswer(message.id, message.content)}
                        className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Copy answer"
                      >
                        {copiedId === message.id ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Helpful"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Not helpful"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Bot size={17} />
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-semibold">
                    Review Assistant
                  </p>
                  <div className="rounded-xl bg-muted/60 px-4">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="mx-auto mt-10 max-w-3xl">
                <div className="mb-5 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles size={22} />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Explore your customer reviews
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ask questions in natural language. Get answers grounded in
                    your restaurant review data.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {suggestedQuestions.map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.question}
                        onClick={() => sendMessage(item.question)}
                        disabled={isTyping}
                        className="group rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-primary/[0.03] disabled:opacity-50"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {item.category}
                          </span>
                          <Icon
                            size={16}
                            className="text-muted-foreground transition group-hover:text-primary"
                          />
                        </div>
                        <p className="text-sm font-medium leading-6">
                          {item.question}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-background px-4 py-4 sm:px-8">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                sendMessage()
              }}
              className="mx-auto max-w-4xl"
            >
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm transition focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Ask something about your restaurant reviews..."
                  rows={1}
                  className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1">
                <span className="text-[10px] text-muted-foreground">
                  Enter to send · Shift + Enter for a new line
                </span>
                <span className="text-[10px] text-muted-foreground">
                  <Clock3 size={10} className="mr-1 inline" />
                  Responses may take a few seconds
                </span>
              </div>
            </form>
          </div>
        </main>

        <aside className="hidden w-64 shrink-0 flex-col border-l border-border bg-muted/20 p-5 xl:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About this assistant
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Uses Retrieval-Augmented Generation (RAG) to find relevant
              customer reviews and generate context-grounded answers.
            </p>
          </div>

          <div className="my-5 border-t border-border" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Knowledge base
            </p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Embedding corpus
                </span>
                <span className="text-sm font-semibold">
                  {corpusSize ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Embedding model
                </span>
                <span className="text-xs font-medium">Gemini</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Retrieval strategy
                </span>
                <span className="text-xs font-medium">Cosine similarity</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Results per query
                </span>
                <span className="text-xs font-medium">Top 5</span>
              </div>
            </div>
          </div>

          <div className="my-5 border-t border-border" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Capabilities
            </p>
            <div className="mt-3 space-y-3">
              {[
                "Review semantic search",
                "Sentiment exploration",
                "Customer complaint analysis",
                "Evidence-backed answers",
              ].map((capability) => (
                <div key={capability} className="flex items-center gap-2">
                  <Check size={13} className="shrink-0 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">
                    {capability}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-primary" />
              <span className="text-xs font-semibold">RAG pipeline</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Question → Embeddings → Retrieval → LLM → Answer with sources
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
