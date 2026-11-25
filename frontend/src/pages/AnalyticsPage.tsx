
import { useMemo, useState } from "react"
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  IndianRupee,
  ShoppingBag,
  Store,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Illustrative data shaped around the Gold analytics marts.
const revenueData = [
  { month: "Jan", revenue: 2.1, orders: 120 },
  { month: "Feb", revenue: 2.4, orders: 138 },
  { month: "Mar", revenue: 2.2, orders: 131 },
  { month: "Apr", revenue: 2.8, orders: 156 },
  { month: "May", revenue: 2.6, orders: 149 },
  { month: "Jun", revenue: 3.1, orders: 178 },
  { month: "Jul", revenue: 2.9, orders: 169 },
  { month: "Aug", revenue: 3.5, orders: 195 },
  { month: "Sep", revenue: 3.3, orders: 188 },
  { month: "Oct", revenue: 3.8, orders: 216 },
  { month: "Nov", revenue: 3.6, orders: 207 },
  { month: "Dec", revenue: 4.2, orders: 241 },
]

const cityRevenue = [
  { city: "Bangalore", revenue: 420, orders: 182 },
  { city: "Mumbai", revenue: 385, orders: 165 },
  { city: "Delhi", revenue: 340, orders: 151 },
  { city: "Hyderabad", revenue: 290, orders: 128 },
  { city: "Pune", revenue: 245, orders: 109 },
  { city: "Chennai", revenue: 218, orders: 96 },
]

const restaurantData = [
  { name: "The Urban Kitchen", city: "Bangalore", orders: "12,840", revenue: "₹18.4L", rating: 4.8, delivery: "28 min" },
  { name: "Spice Route", city: "Mumbai", orders: "11,260", revenue: "₹16.2L", rating: 4.7, delivery: "32 min" },
  { name: "Cafe Mocha", city: "Pune", orders: "9,840", revenue: "₹14.8L", rating: 4.6, delivery: "26 min" },
  { name: "The Food Lab", city: "Delhi", orders: "9,120", revenue: "₹13.5L", rating: 4.5, delivery: "35 min" },
  { name: "Curry Culture", city: "Hyderabad", orders: "8,760", revenue: "₹12.9L", rating: 4.5, delivery: "29 min" },
]

const deliveryData = [
  { city: "Bangalore", onTime: 91, delayed: 9 },
  { city: "Mumbai", onTime: 86, delayed: 14 },
  { city: "Delhi", onTime: 82, delayed: 18 },
  { city: "Hyderabad", onTime: 89, delayed: 11 },
  { city: "Pune", onTime: 94, delayed: 6 },
]

const orderDistribution = [
  { name: "Completed", value: 78 },
  { name: "Cancelled", value: 12 },
  { name: "Pending", value: 10 },
]

const pieColors = ["#34d399", "#f87171", "#fbbf24"]

const tooltipStyle = {
  backgroundColor: "#191b20",
  border: "1px solid #303238",
  borderRadius: "10px",
  color: "#f4f4f5",
  fontSize: "12px",
}

const cities = ["All cities", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"]

function SectionCard({
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
    <section className={`rounded-xl border border-white/[0.07] bg-[#111316] p-5 ${className}`}>
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
      {children}
    </section>
  )
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  positive = true,
  note,
}: {
  title: string
  value: string
  change: string
  icon: typeof TrendingUp
  positive?: boolean
  note: string
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111316] p-5 transition hover:border-white/[0.14]">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{title}</p>
        <div className="rounded-lg bg-white/[0.04] p-2 text-zinc-400">
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-white">{value}</p>
      <div className="mt-3 flex items-center gap-1.5">
        <span className={`flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
        <span className="text-[11px] text-zinc-600">{note}</span>
      </div>
    </div>
  )
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState("12 months")
  const [selectedCity, setSelectedCity] = useState("All cities")

  const filteredCities = useMemo(
    () => selectedCity === "All cities"
      ? cityRevenue
      : cityRevenue.filter((item) => item.city === selectedCity),
    [selectedCity],
  )

  const filteredDelivery = useMemo(
    () => selectedCity === "All cities"
      ? deliveryData
      : deliveryData.filter((item) => item.city === selectedCity),
    [selectedCity],
  )

  return (
    <div className="space-y-7">
      {/* Heading and filters */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.15em] text-emerald-400">
            BUSINESS PERFORMANCE
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Analytics
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Explore revenue, orders, restaurant performance and delivery operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#15171a] px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-400/50"
          >
            <option>12 months</option>
            <option>6 months</option>
            <option>30 days</option>
            <option>7 days</option>
          </select>

          <select
            value={selectedCity}
            onChange={(event) => setSelectedCity(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#15171a] px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-400/50"
          >
            {cities.map((city) => <option key={city}>{city}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-amber-400/10 bg-amber-400/[0.04] px-3 py-2 text-[11px] text-amber-300/80">
        <Activity size={14} />
        Demonstration data · Filters update the visualizations, not the underlying date range yet.
      </div>

      {/* KPI cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Gross revenue" value="₹24.8M" change="+12.8%" icon={IndianRupee} note="vs previous period" />
        <MetricCard title="Total orders" value="10.0M" change="+8.2%" icon={ShoppingBag} note="vs previous period" />
        <MetricCard title="Avg. order value" value="₹248" change="+3.7%" icon={TrendingUp} note="vs previous period" />
        <MetricCard title="Avg. delivery time" value="31 min" change="-5.2%" icon={Clock3} positive note="vs previous period" />
      </section>

      {/* Revenue trend */}
      <SectionCard
        title="Revenue and order trends"
        description={`Monthly revenue and order volume · ${period} · Illustrative data`}
      >
        <div className="mb-5 flex flex-wrap gap-5">
          <div>
            <p className="text-[11px] text-zinc-500">Gross revenue</p>
            <p className="mt-1 text-xl font-semibold text-white">₹24.8M</p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Orders</p>
            <p className="mt-1 text-xl font-semibold text-white">10.0M</p>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27292e" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis yAxisId="revenue" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}M`} />
              <YAxis yAxisId="orders" orientation="right" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Revenue" stroke="#34d399" strokeWidth={2.5} fill="url(#analyticsRevenue)" />
              <Line yAxisId="orders" type="monotone" dataKey="orders" name="Orders (K)" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-5 text-[11px] text-zinc-500">
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" />Revenue</span>
          <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-blue-400" />Orders</span>
        </div>
      </SectionCard>

      {/* City revenue and delivery SLA */}
      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="City-wise revenue" description="Revenue contribution by city · ₹K">
          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredCities} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#27292e" strokeDasharray="3 5" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} width={85} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`₹${value}K`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#34d399" radius={[0, 5, 5, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Delivery SLA by city" description="On-time vs delayed deliveries · Illustrative percentages">
          <div className="mb-4 flex gap-5 text-[11px] text-zinc-500">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-400" />On time</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-amber-400" />Delayed</span>
          </div>
          <div className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDelivery} layout="vertical" stackOffset="expand" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                <CartesianGrid stroke="#27292e" strokeDasharray="3 5" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${value * 100}%`} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="city" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} width={85} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`${value}%`, name === "onTime" ? "On time" : "Delayed"]} />
                <Bar dataKey="onTime" name="On time" stackId="delivery" fill="#34d399" barSize={19} />
                <Bar dataKey="delayed" name="Delayed" stackId="delivery" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={19} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </section>

      {/* Restaurant ranking and order distribution */}
      <section className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Top restaurants" description="Ranked by revenue · Illustrative data" className="xl:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-zinc-600">
                  <th className="pb-3 font-medium">Restaurant</th>
                  <th className="pb-3 font-medium">City</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Rating</th>
                  <th className="pb-3 font-medium">Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {restaurantData.map((restaurant, index) => (
                  <tr key={restaurant.name} className="text-zinc-400 transition hover:bg-white/[0.02]">
                    <td className="py-4 font-medium text-zinc-200">
                      <span className="mr-2 text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
                      {restaurant.name}
                    </td>
                    <td className="py-4">{restaurant.city}</td>
                    <td className="py-4">{restaurant.orders}</td>
                    <td className="py-4 font-medium text-zinc-200">{restaurant.revenue}</td>
                    <td className="py-4 text-amber-300">★ {restaurant.rating}</td>
                    <td className="py-4">{restaurant.delivery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Order distribution" description="Illustrative order status breakdown">
          <div className="relative h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4} stroke="none">
                  {orderDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-white">100%</span>
              <span className="text-[10px] text-zinc-500">Orders</span>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {orderDistribution.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-zinc-400">
                  <span className="size-2 rounded-full" style={{ backgroundColor: pieColors[index] }} />
                  {item.name}
                </span>
                <span className="font-medium text-zinc-200">{item.value}%</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/[0.07] pt-4 text-[11px] text-zinc-600">
        <span>Restaurant Intelligence · Analytics workspace</span>
        <span className="flex items-center gap-1.5"><Store size={12} /> Demo dataset</span>
      </div>
    </div>
  )
}
