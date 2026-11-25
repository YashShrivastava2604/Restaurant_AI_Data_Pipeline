
import {
  ArrowUpRight,
  CalendarDays,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  Utensils,
  ArrowRight,
  Activity,
} from "lucide-react"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Illustrative data. Replace with API responses later.
const revenueData = [
  { month: "Jan", revenue: 2.1, orders: 1.2 },
  { month: "Feb", revenue: 2.4, orders: 1.4 },
  { month: "Mar", revenue: 2.2, orders: 1.3 },
  { month: "Apr", revenue: 2.8, orders: 1.6 },
  { month: "May", revenue: 2.6, orders: 1.5 },
  { month: "Jun", revenue: 3.1, orders: 1.8 },
  { month: "Jul", revenue: 2.9, orders: 1.7 },
  { month: "Aug", revenue: 3.5, orders: 2.0 },
  { month: "Sep", revenue: 3.3, orders: 1.9 },
  { month: "Oct", revenue: 3.8, orders: 2.2 },
  { month: "Nov", revenue: 3.6, orders: 2.1 },
  { month: "Dec", revenue: 4.2, orders: 2.4 },
]

const cityData = [
  { city: "Bangalore", revenue: 420 },
  { city: "Mumbai", revenue: 385 },
  { city: "Delhi", revenue: 340 },
  { city: "Hyderabad", revenue: 290 },
  { city: "Pune", revenue: 245 },
]

const orderData = [
  { day: "Mon", orders: 125 },
  { day: "Tue", orders: 145 },
  { day: "Wed", orders: 132 },
  { day: "Thu", orders: 178 },
  { day: "Fri", orders: 210 },
  { day: "Sat", orders: 265 },
  { day: "Sun", orders: 238 },
]

const metrics = [
  {
    label: "Total Revenue",
    value: "₹24.8M",
    change: "+12.8%",
    icon: TrendingUp,
  },
  {
    label: "Total Orders",
    value: "10.0M",
    change: "+8.2%",
    icon: ShoppingBag,
  },
  {
    label: "Restaurants",
    value: "148.5K",
    change: "+4.6%",
    icon: Store,
  },
  {
    label: "Customers",
    value: "100K",
    change: "+2.4%",
    icon: Users,
  },
]

const activity = [
  {
    name: "Restaurant performance mart",
    type: "dbt model",
    time: "2 min ago",
  },
  {
    name: "Review enrichment batch",
    type: "AI processing",
    time: "8 min ago",
  },
  {
    name: "Daily revenue aggregation",
    type: "dbt model",
    time: "15 min ago",
  },
  {
    name: "Customer dimension refresh",
    type: "dbt model",
    time: "22 min ago",
  },
]

const tooltipStyle = {
  backgroundColor: "#191b20",
  border: "1px solid #303238",
  borderRadius: "10px",
  color: "#f4f4f5",
  fontSize: "12px",
}

function ChartCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.07] bg-[#111316] p-5 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
      {children}
    </div>
  )
}

export function OverviewPage() {
  return (
    <div className="space-y-7">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.15em] text-emerald-400">
            BUSINESS INTELLIGENCE
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Good morning.
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Here's what's happening across your restaurant ecosystem.
          </p>
        </div>

        <button className="flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.07]">
          <CalendarDays size={15} />
          All time
        </button>
      </div>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon

          return (
            <div
              key={metric.label}
              className="rounded-xl border border-white/[0.07] bg-[#111316] p-5 transition hover:border-white/[0.14]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500">{metric.label}</p>
                <div className="rounded-lg bg-white/[0.04] p-2 text-zinc-400">
                  <Icon size={17} />
                </div>
              </div>

              <p className="mt-5 text-2xl font-semibold tracking-tight text-white">
                {metric.value}
              </p>

              <div className="mt-3 flex items-center gap-1.5">
                <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
                  <ArrowUpRight size={14} />
                  {metric.change}
                </span>
                <span className="text-[11px] text-zinc-600">
                  vs previous period
                </span>
              </div>
            </div>
          )
        })}
      </section>

      {/* Revenue chart + AI summary */}
      <section className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Revenue overview"
          description="Monthly revenue performance · Illustrative data"
          className="xl:col-span-2"
        >
          <div className="mb-5 flex items-center gap-5">
            <div>
              <p className="text-[11px] text-zinc-500">Total revenue</p>
              <p className="mt-1 text-xl font-semibold text-white">₹24.8M</p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">Growth</p>
              <p className="mt-1 text-sm font-medium text-emerald-400">
                +12.8%
              </p>
            </div>
          </div>

          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#27292e"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}M`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`₹${value}M`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#34d399"
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  activeDot={{ r: 5, fill: "#34d399", stroke: "#111316" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="rounded-xl border border-white/[0.07] bg-[#111316] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                AI intelligence
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Customer review processing
              </p>
            </div>
            <div className="rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
              <Utensils size={17} />
            </div>
          </div>

          <div className="mt-8">
            <p className="text-4xl font-semibold tracking-tight text-white">
              241
            </p>
            <p className="mt-1 text-xs text-zinc-500">Enriched reviews</p>
          </div>

          <div className="my-6 h-px bg-white/[0.07]" />

          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Aggregated insights</span>
            <span className="font-medium text-zinc-200">230</span>
          </div>

          <div className="mt-5 flex justify-between text-xs">
            <span className="text-zinc-500">Enrichment coverage</span>
            <span className="font-medium text-emerald-400">100%</span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full w-full rounded-full bg-emerald-400" />
          </div>

          <div className="mt-6 rounded-lg border border-emerald-400/10 bg-emerald-400/[0.04] p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
              <Activity size={14} />
              AI processing operational
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
              241 reviews enriched and accounted for in the insights mart.
            </p>
          </div>
        </div>
      </section>

      {/* City performance + orders chart */}
      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Revenue by city"
          description="Top performing cities · Illustrative data · ₹K"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cityData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#27292e"
                  strokeDasharray="3 5"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="city"
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={85}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`₹${value}K`, "Revenue"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#34d399"
                  radius={[0, 5, 5, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Weekly order volume"
          description="Orders by day · Illustrative data · Thousands"
        >
          <div className="mb-4">
            <p className="text-xl font-semibold text-white">1,293K</p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Orders across the selected week
            </p>
          </div>

          <div className="h-[225px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={orderData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#27292e"
                  strokeDasharray="3 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value}K`, "Orders"]}
                />
                <Bar
                  dataKey="orders"
                  fill="#60a5fa"
                  radius={[5, 5, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </section>

      {/* Pipeline activity */}
      <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#111316]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">
              Recent pipeline activity
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Illustrative activity feed
            </p>
          </div>
          <span className="flex items-center gap-2 text-[11px] text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Operational
          </span>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {activity.map((item) => (
            <div
              key={item.name}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="text-xs font-medium text-zinc-300">
                  {item.name}
                </p>
                <p className="mt-1 text-[11px] text-zinc-600">
                  {item.type} · {item.time}
                </p>
              </div>

              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                <span className="size-1 rounded-full bg-emerald-400" />
                Success
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-white/[0.07] px-5 py-3">
          <button className="flex items-center gap-2 text-xs text-zinc-400 transition hover:text-emerald-400">
            View pipeline <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  )
}
