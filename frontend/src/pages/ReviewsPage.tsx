
import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
  X,
  Sparkles,
  Clock3,
  BrainCircuit,
} from "lucide-react"

type Sentiment = "positive" | "negative" | "neutral"

type Review = {
  review_id: string
  customer: string
  restaurant: string
  city: string
  rating: number
  review_text: string
  sentiment_label: Sentiment
  sentiment_score: number
  topic: string
  key_issue: string | null
  provider: string
  model: string
  enriched_at: string
}

const reviews: Review[] = [
  {
    review_id: "REV-1001",
    customer: "Aarav Sharma",
    restaurant: "The Urban Kitchen",
    city: "Bangalore",
    rating: 5,
    review_text: "Absolutely loved the food! Everything was fresh, well packed and arrived earlier than expected.",
    sentiment_label: "positive",
    sentiment_score: 0.95,
    topic: "food quality",
    key_issue: "None",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:32",
  },
  {
    review_id: "REV-1002",
    customer: "Priya Mehta",
    restaurant: "Spice Route",
    city: "Mumbai",
    rating: 1,
    review_text: "The food arrived very late and was completely cold. The packaging was also damaged.",
    sentiment_label: "negative",
    sentiment_score: -0.88,
    topic: "delivery",
    key_issue: "Late delivery and damaged packaging",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:29",
  },
  {
    review_id: "REV-1003",
    customer: "Rohan Verma",
    restaurant: "Cafe Mocha",
    city: "Pune",
    rating: 4,
    review_text: "Good coffee and ambience. Prices are slightly high but the overall experience was nice.",
    sentiment_label: "positive",
    sentiment_score: 0.72,
    topic: "pricing",
    key_issue: "Prices perceived as slightly high",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:25",
  },
  {
    review_id: "REV-1004",
    customer: "Sneha Kapoor",
    restaurant: "The Food Lab",
    city: "Delhi",
    rating: 2,
    review_text: "The quantity was disappointing for the price. Taste was average.",
    sentiment_label: "negative",
    sentiment_score: -0.68,
    topic: "food quality",
    key_issue: "Poor portion size and average taste",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:20",
  },
  {
    review_id: "REV-1005",
    customer: "Kabir Singh",
    restaurant: "Curry Culture",
    city: "Hyderabad",
    rating: 3,
    review_text: "The order was as expected. Nothing particularly good or bad.",
    sentiment_label: "neutral",
    sentiment_score: 0.05,
    topic: "overall experience",
    key_issue: null,
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:17",
  },
  {
    review_id: "REV-1006",
    customer: "Ananya Rao",
    restaurant: "Green Bowl Co.",
    city: "Bangalore",
    rating: 5,
    review_text: "Fresh ingredients, generous portions and excellent packaging. Will definitely order again.",
    sentiment_label: "positive",
    sentiment_score: 0.97,
    topic: "food quality",
    key_issue: "None",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:12",
  },
  {
    review_id: "REV-1007",
    customer: "Vikram Patel",
    restaurant: "Wok This Way",
    city: "Mumbai",
    rating: 2,
    review_text: "The noodles were soggy and the order was missing one item.",
    sentiment_label: "negative",
    sentiment_score: -0.81,
    topic: "food quality",
    key_issue: "Poor food quality and missing item",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:08",
  },
  {
    review_id: "REV-1008",
    customer: "Ishita Das",
    restaurant: "Deccan Spice",
    city: "Hyderabad",
    rating: 4,
    review_text: "Great biryani and good portion size. Delivery was reasonably quick.",
    sentiment_label: "positive",
    sentiment_score: 0.86,
    topic: "food quality",
    key_issue: null,
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 10:02",
  },
  {
    review_id: "REV-1009",
    customer: "Neha Joshi",
    restaurant: "The Breakfast Club",
    city: "Pune",
    rating: 3,
    review_text: "The food was decent, although the delivery took longer than the estimated time.",
    sentiment_label: "neutral",
    sentiment_score: -0.08,
    topic: "delivery",
    key_issue: "Delivery took longer than estimated",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 09:58",
  },
  {
    review_id: "REV-1010",
    customer: "Arjun Malhotra",
    restaurant: "Dilli Darbar",
    city: "Delhi",
    rating: 1,
    review_text: "The packaging leaked and the food was cold. Very disappointing experience.",
    sentiment_label: "negative",
    sentiment_score: -0.94,
    topic: "packaging",
    key_issue: "Leaking packaging and cold food",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 09:51",
  },
  {
    review_id: "REV-1011",
    customer: "Meera Nair",
    restaurant: "Coastal Cravings",
    city: "Chennai",
    rating: 5,
    review_text: "Fresh seafood and authentic flavours. One of the best meals I've had recently.",
    sentiment_label: "positive",
    sentiment_score: 0.96,
    topic: "food quality",
    key_issue: null,
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 09:45",
  },
  {
    review_id: "REV-1012",
    customer: "Aditya Gupta",
    restaurant: "Spice Route",
    city: "Mumbai",
    rating: 2,
    review_text: "The meal was okay, but the price was too high for the quantity provided.",
    sentiment_label: "negative",
    sentiment_score: -0.62,
    topic: "pricing",
    key_issue: "Poor value for money",
    provider: "Groq",
    model: "openai/gpt-oss-120b",
    enriched_at: "2026-11-04 09:39",
  },
]

const sentimentSummary = [
  { label: "Positive", count: 154, percentage: 64, color: "#34d399" },
  { label: "Negative", count: 57, percentage: 24, color: "#f87171" },
  { label: "Neutral", count: 30, percentage: 12, color: "#fbbf24" },
]

const topicSummary = [
  { topic: "Food quality", count: 86, percentage: 36 },
  { topic: "Delivery", count: 58, percentage: 24 },
  { topic: "Pricing", count: 38, percentage: 16 },
  { topic: "Packaging", count: 29, percentage: 12 },
  { topic: "Overall experience", count: 30, percentage: 12 },
]

const sentimentStyles: Record<Sentiment, string> = {
  positive: "bg-emerald-400/10 text-emerald-400",
  negative: "bg-red-400/10 text-red-400",
  neutral: "bg-amber-400/10 text-amber-400",
}

const cities = [
  "All cities",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Pune",
  "Chennai",
]

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${sentimentStyles[sentiment]}`}>
      {sentiment}
    </span>
  )
}

export function ReviewsPage() {
  const [search, setSearch] = useState("")
  const [sentiment, setSentiment] = useState("All")
  const [topic, setTopic] = useState("All")
  const [city, setCity] = useState("All cities")
  const [sortBy, setSortBy] = useState("recent")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [page, setPage] = useState(1)

  const pageSize = 6

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase()

    return reviews
      .filter((review) => {
        const matchesSearch =
          !query ||
          review.review_id.toLowerCase().includes(query) ||
          review.customer.toLowerCase().includes(query) ||
          review.restaurant.toLowerCase().includes(query) ||
          review.review_text.toLowerCase().includes(query)

        const matchesSentiment =
          sentiment === "All" || review.sentiment_label === sentiment.toLowerCase()

        const matchesTopic =
          topic === "All" || review.topic === topic

        const matchesCity =
          city === "All cities" || review.city === city

        return matchesSearch && matchesSentiment && matchesTopic && matchesCity
      })
      .sort((a, b) => {
        if (sortBy === "rating") return b.rating - a.rating
        if (sortBy === "score") return b.sentiment_score - a.sentiment_score
        if (sortBy === "oldest") return a.enriched_at.localeCompare(b.enriched_at)
        return b.enriched_at.localeCompare(a.enriched_at)
      })
  }, [search, sentiment, topic, city, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const resetFilters = () => {
    setSearch("")
    setSentiment("All")
    setTopic("All")
    setCity("All cities")
    setSortBy("recent")
    setPage(1)
  }

  const updateFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.15em] text-emerald-400">
            CUSTOMER VOICE
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Review Intelligence
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Understand customer sentiment, identify recurring issues and explore AI-enriched feedback.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Sparkles size={15} className="text-emerald-400" />
          AI-powered analysis
        </div>
      </div>

      {/* Demo notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-400/10 bg-amber-400/[0.04] px-3 py-2 text-[11px] text-amber-300/80">
        <BrainCircuit size={14} />
        Review examples are illustrative. Summary metrics reflect the current demo dataset, not live database aggregates.
      </div>

      {/* Summary metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Enriched reviews",
            value: "241",
            note: "AI processed",
            icon: MessageSquareText,
          },
          {
            label: "Positive sentiment",
            value: "64%",
            note: "154 reviews",
            icon: TrendingUp,
          },
          {
            label: "Average rating",
            value: "4.2 / 5",
            note: "Customer feedback",
            icon: Star,
          },
          {
            label: "Insights generated",
            value: "230",
            note: "Aggregated records",
            icon: Sparkles,
          },
        ].map((metric) => {
          const Icon = metric.icon

          return (
            <div key={metric.label} className="rounded-xl border border-white/[0.07] bg-[#111316] p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">{metric.label}</p>
                <div className="rounded-lg bg-white/[0.04] p-2 text-zinc-400">
                  <Icon size={17} />
                </div>
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-tight text-white">{metric.value}</p>
              <p className="mt-3 text-[11px] text-zinc-600">{metric.note}</p>
            </div>
          )
        })}
      </section>

      {/* Sentiment and topic charts */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-[#111316] p-5">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-100">Sentiment distribution</h3>
            <p className="mt-1 text-xs text-zinc-500">Breakdown of AI-classified customer reviews</p>
          </div>

          <div className="space-y-6">
            {sentimentSummary.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-zinc-300">
                    <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                  <span className="text-zinc-400">
                    {item.count} <span className="ml-2 text-zinc-600">{item.percentage}%</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[11px] text-zinc-500">Overall sentiment</p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">Mostly positive</p>
            <p className="mt-1 text-[11px] text-zinc-600">
              Positive feedback accounts for the largest share of this illustrative distribution.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#111316] p-5">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-zinc-100">Topics customers discuss</h3>
            <p className="mt-1 text-xs text-zinc-500">AI-extracted topics across enriched reviews</p>
          </div>

          <div className="space-y-5">
            {topicSummary.map((item, index) => (
              <div key={item.topic}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-300">{item.topic}</span>
                  <span className="text-[11px] text-zinc-500">{item.count} reviews</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      opacity: 1 - index * 0.12,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <div>
              <p className="text-[11px] text-zinc-500">Most discussed topic</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">Food quality</p>
            </div>
            <span className="text-xl font-semibold text-emerald-400">36%</span>
          </div>
        </div>
      </section>

      {/* Review explorer */}
      <section>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-zinc-100">Review explorer</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Search, filter and inspect individual AI-enriched reviews.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#111316] p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => updateFilter(setSearch)(event.target.value)}
                placeholder="Search review, customer, restaurant or ID..."
                className="w-full rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-9 pr-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  value={sentiment}
                  onChange={(event) => updateFilter(setSentiment)(event.target.value)}
                  className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none"
                >
                  <option value="All">All sentiments</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                  <option value="Neutral">Neutral</option>
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>

              <div className="relative">
                <select
                  value={topic}
                  onChange={(event) => updateFilter(setTopic)(event.target.value)}
                  className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none"
                >
                  <option value="All">All topics</option>
                  {topicSummary.map((item) => (
                    <option key={item.topic} value={item.topic}>{item.topic}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>

              <div className="relative">
                <select
                  value={city}
                  onChange={(event) => updateFilter(setCity)(event.target.value)}
                  className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none"
                >
                  {cities.map((item) => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(event) => updateFilter(setSortBy)(event.target.value)}
                  className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none"
                >
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest</option>
                  <option value="rating">Highest rating</option>
                  <option value="score">Highest sentiment</option>
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-zinc-600">
              <SlidersHorizontal size={12} className="mr-1 inline" />
              {filteredReviews.length} matching reviews
            </p>
            <button onClick={resetFilters} className="text-[11px] text-zinc-500 hover:text-emerald-400">
              Reset filters
            </button>
          </div>
        </div>

        {/* Review cards */}
        <div className="mt-3 space-y-3">
          {paginatedReviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-[#111316] px-5 py-16 text-center">
              <Search size={25} className="mx-auto text-zinc-600" />
              <p className="mt-3 text-sm font-medium text-zinc-300">No reviews found</p>
              <p className="mt-1 text-xs text-zinc-600">Try changing your search or filters.</p>
            </div>
          ) : (
            paginatedReviews.map((review) => (
              <button
                key={review.review_id}
                onClick={() => setSelectedReview(review)}
                className="w-full rounded-xl border border-white/[0.07] bg-[#111316] p-5 text-left transition hover:border-emerald-400/25 hover:bg-[#14171a]"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{review.customer}</span>
                      <span className="text-[10px] text-zinc-600">·</span>
                      <span className="text-[10px] text-zinc-500">{review.review_id}</span>
                      <SentimentBadge sentiment={review.sentiment_label} />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {review.restaurant} · {review.city}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 text-amber-300">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={12}
                        fill={index < review.rating ? "currentColor" : "none"}
                        className={index < review.rating ? "" : "text-zinc-700"}
                      />
                    ))}
                    <span className="ml-1 text-xs">{review.rating}.0</span>
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  "{review.review_text}"
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] capitalize text-zinc-400">
                      {review.topic}
                    </span>
                    {review.key_issue && review.key_issue !== "None" && (
                      <span className="max-w-[220px] truncate text-[10px] text-zinc-500">
                        Issue: {review.key_issue}
                      </span>
                    )}
                  </div>

                  <span className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <Clock3 size={11} />
                    {review.enriched_at}
                    <ChevronRight size={13} />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredReviews.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#111316] px-4 py-3">
            <p className="text-[11px] text-zinc-500">
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredReviews.length)} of {filteredReviews.length}
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-white/[0.08] p-2 text-zinc-400 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs text-zinc-400">{currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="rounded-lg border border-white/[0.08] p-2 text-zinc-400 hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Review detail drawer */}
      {selectedReview && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <button
            aria-label="Close review details"
            onClick={() => setSelectedReview(null)}
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          />

          <aside className="relative flex h-full w-full max-w-[500px] flex-col overflow-y-auto border-l border-white/10 bg-[#111316] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] text-emerald-400">
                  REVIEW DETAILS
                </p>
                <p className="mt-1 text-xs text-zinc-500">{selectedReview.review_id}</p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-white"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-7 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">{selectedReview.customer}</h2>
                  <SentimentBadge sentiment={selectedReview.sentiment_label} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {selectedReview.restaurant} · {selectedReview.city}
                </p>
                <div className="mt-3 flex items-center gap-1 text-amber-300">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={14}
                      fill={index < selectedReview.rating ? "currentColor" : "none"}
                      className={index < selectedReview.rating ? "" : "text-zinc-700"}
                    />
                  ))}
                  <span className="ml-1 text-xs">{selectedReview.rating}.0 / 5</span>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[10px] font-medium tracking-wider text-zinc-500">CUSTOMER REVIEW</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                  "{selectedReview.review_text}"
                </p>
              </div>

              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                  <Sparkles size={15} className="text-emerald-400" />
                  AI analysis
                </h3>

                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-white/[0.07] p-4">
                    <p className="text-[10px] text-zinc-500">Detected topic</p>
                    <p className="mt-1 text-sm font-medium capitalize text-zinc-200">{selectedReview.topic}</p>
                  </div>

                  <div className="rounded-lg border border-white/[0.07] p-4">
                    <p className="text-[10px] text-zinc-500">Sentiment score</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-xl font-semibold ${selectedReview.sentiment_score >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {selectedReview.sentiment_score > 0 ? "+" : ""}
                        {selectedReview.sentiment_score.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-600">Range: -1 to +1</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                      <div
                        className={`h-full rounded-full ${selectedReview.sentiment_score >= 0 ? "bg-emerald-400" : "bg-red-400"}`}
                        style={{ width: `${Math.abs(selectedReview.sentiment_score) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/[0.07] p-4">
                    <p className="text-[10px] text-zinc-500">Key issue identified</p>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                      {selectedReview.key_issue || "No specific issue identified."}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Enrichment metadata</h3>
                <div className="mt-3 divide-y divide-white/[0.06] rounded-lg border border-white/[0.07] px-4">
                  {[
                    ["AI provider", selectedReview.provider],
                    ["Model", selectedReview.model],
                    ["Enriched at", selectedReview.enriched_at],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-wrap justify-between gap-2 py-3 text-xs">
                      <span className="text-zinc-500">{label}</span>
                      <span className="text-zinc-300">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
                <p className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                  <BrainCircuit size={14} />
                  AI enrichment complete
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                  This review has been classified and enriched with sentiment, topic and key issue metadata.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
