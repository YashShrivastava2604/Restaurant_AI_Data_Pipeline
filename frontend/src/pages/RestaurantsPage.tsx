
import { useMemo, useState } from "react"
import {
  ArrowUpDown,
  ArrowUpRight,
  ChevronDown,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  TrendingUp,
  Users,
  Utensils,
  X,
} from "lucide-react"

type Restaurant = {
  id: string
  name: string
  city: string
  cuisine: string
  rating: number
  orders: number
  revenue: number
  avgDelivery: number
  totalReviews: number
  onTimeRate: number
  status: "Active" | "Inactive"
}

const restaurants: Restaurant[] = [
  { id: "R001", name: "The Urban Kitchen", city: "Bangalore", cuisine: "North Indian · Chinese", rating: 4.8, orders: 12840, revenue: 1840000, avgDelivery: 28, totalReviews: 1240, onTimeRate: 94, status: "Active" },
  { id: "R002", name: "Spice Route", city: "Mumbai", cuisine: "Indian · Mughlai", rating: 4.7, orders: 11260, revenue: 1620000, avgDelivery: 32, totalReviews: 980, onTimeRate: 88, status: "Active" },
  { id: "R003", name: "Cafe Mocha", city: "Pune", cuisine: "Cafe · Continental", rating: 4.6, orders: 9840, revenue: 1480000, avgDelivery: 26, totalReviews: 860, onTimeRate: 96, status: "Active" },
  { id: "R004", name: "The Food Lab", city: "Delhi", cuisine: "Fast Food · Italian", rating: 4.5, orders: 9120, revenue: 1350000, avgDelivery: 35, totalReviews: 790, onTimeRate: 82, status: "Active" },
  { id: "R005", name: "Curry Culture", city: "Hyderabad", cuisine: "South Indian · Biryani", rating: 4.5, orders: 8760, revenue: 1290000, avgDelivery: 29, totalReviews: 720, onTimeRate: 91, status: "Active" },
  { id: "R006", name: "Green Bowl Co.", city: "Bangalore", cuisine: "Healthy Food · Salads", rating: 4.4, orders: 7650, revenue: 1120000, avgDelivery: 25, totalReviews: 640, onTimeRate: 97, status: "Active" },
  { id: "R007", name: "Wok This Way", city: "Mumbai", cuisine: "Chinese · Asian", rating: 4.3, orders: 6890, revenue: 980000, avgDelivery: 34, totalReviews: 590, onTimeRate: 86, status: "Active" },
  { id: "R008", name: "Dilli Darbar", city: "Delhi", cuisine: "North Indian · Kebab", rating: 4.2, orders: 6210, revenue: 910000, avgDelivery: 38, totalReviews: 510, onTimeRate: 79, status: "Inactive" },
  { id: "R009", name: "Deccan Spice", city: "Hyderabad", cuisine: "Biryani · Mughlai", rating: 4.1, orders: 5820, revenue: 840000, avgDelivery: 31, totalReviews: 470, onTimeRate: 89, status: "Active" },
  { id: "R010", name: "The Breakfast Club", city: "Pune", cuisine: "Breakfast · Cafe", rating: 4.0, orders: 4980, revenue: 720000, avgDelivery: 27, totalReviews: 390, onTimeRate: 93, status: "Active" },
  { id: "R011", name: "Chennai Express", city: "Chennai", cuisine: "South Indian", rating: 3.9, orders: 4320, revenue: 630000, avgDelivery: 36, totalReviews: 350, onTimeRate: 81, status: "Active" },
  { id: "R012", name: "Coastal Cravings", city: "Chennai", cuisine: "Seafood · Coastal", rating: 3.8, orders: 3850, revenue: 560000, avgDelivery: 39, totalReviews: 310, onTimeRate: 77, status: "Inactive" },
]

const cityOptions = ["All cities", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai"]

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`
  return `₹${value.toLocaleString("en-IN")}`
}

const formatNumber = (value: number) => value.toLocaleString("en-IN")

export function RestaurantsPage() {
  const [search, setSearch] = useState("")
  const [city, setCity] = useState("All cities")
  const [minimumRating, setMinimumRating] = useState("0")
  const [sortBy, setSortBy] = useState("revenue")
  const [status, setStatus] = useState("All")
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  const filteredRestaurants = useMemo(() => {
    const query = search.trim().toLowerCase()

    return restaurants
      .filter((restaurant) => {
        const matchesSearch =
          !query ||
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.city.toLowerCase().includes(query) ||
          restaurant.cuisine.toLowerCase().includes(query)

        const matchesCity = city === "All cities" || restaurant.city === city
        const matchesRating = restaurant.rating >= Number(minimumRating)
        const matchesStatus = status === "All" || restaurant.status === status

        return matchesSearch && matchesCity && matchesRating && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === "revenue") return b.revenue - a.revenue
        if (sortBy === "orders") return b.orders - a.orders
        if (sortBy === "rating") return b.rating - a.rating
        if (sortBy === "delivery") return a.avgDelivery - b.avgDelivery
        return a.name.localeCompare(b.name)
      })
  }, [search, city, minimumRating, sortBy, status])

  const activeCount = restaurants.filter((r) => r.status === "Active").length
  const averageRating = restaurants.reduce((sum, r) => sum + r.rating, 0) / restaurants.length
  const totalOrders = restaurants.reduce((sum, r) => sum + r.orders, 0)
  const totalRevenue = restaurants.reduce((sum, r) => sum + r.revenue, 0)

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium tracking-[0.15em] text-emerald-400">
            RESTAURANT DIRECTORY
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Restaurants
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Explore restaurant profiles and monitor business performance.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="size-2 rounded-full bg-emerald-400" />
          {activeCount} active restaurants in this demo dataset
        </div>
      </div>

      {/* Demo data notice */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-400/10 bg-amber-400/[0.04] px-3 py-2 text-[11px] text-amber-300/80">
        <Store size={14} />
        Demonstration data · Restaurant metrics will be connected to Databricks later.
      </div>

      {/* Summary metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Restaurants listed", value: formatNumber(restaurants.length), icon: Store },
          { label: "Total orders", value: formatNumber(totalOrders), icon: Utensils },
          { label: "Combined revenue", value: formatCurrency(totalRevenue), icon: TrendingUp },
          { label: "Average rating", value: `${averageRating.toFixed(1)} / 5`, icon: Star },
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
            </div>
          )
        })}
      </section>

      {/* Search and filters */}
      <section className="rounded-xl border border-white/[0.07] bg-[#111316] p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurant, city or cuisine..."
              className="w-full rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-10 pr-3 text-xs text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none focus:border-emerald-400/50"
              >
                {cityOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>

            <div className="relative">
              <select
                value={minimumRating}
                onChange={(event) => setMinimumRating(event.target.value)}
                className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none focus:border-emerald-400/50"
              >
                <option value="0">All ratings</option>
                <option value="4">4.0+ rating</option>
                <option value="4.5">4.5+ rating</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>

            <div className="relative">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none focus:border-emerald-400/50"
              >
                <option value="All">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="appearance-none rounded-lg border border-white/[0.08] bg-[#0d0f11] py-2.5 pl-3 pr-8 text-xs text-zinc-300 outline-none focus:border-emerald-400/50"
              >
                <option value="revenue">Highest revenue</option>
                <option value="orders">Most orders</option>
                <option value="rating">Highest rating</option>
                <option value="delivery">Fastest delivery</option>
                <option value="name">Name A–Z</option>
              </select>
              <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-zinc-600">
            <SlidersHorizontal size={12} className="mr-1 inline" />
            {filteredRestaurants.length} of {restaurants.length} restaurants
          </p>
          <button
            onClick={() => {
              setSearch("")
              setCity("All cities")
              setMinimumRating("0")
              setSortBy("revenue")
              setStatus("All")
            }}
            className="text-[11px] text-zinc-500 transition hover:text-emerald-400"
          >
            Reset filters
          </button>
        </div>
      </section>

      {/* Restaurant list */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">All restaurants</h3>
            <p className="mt-1 text-xs text-zinc-500">Select a restaurant to inspect its performance.</p>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] text-zinc-600 sm:flex">
            <ArrowUpDown size={13} />
            Sorted by {sortBy}
          </span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-[#111316] px-5 py-16 text-center">
            <Search size={25} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm font-medium text-zinc-300">No restaurants found</p>
            <p className="mt-1 text-xs text-zinc-600">Try changing your search or filters.</p>
            <button
              onClick={() => {
                setSearch("")
                setCity("All cities")
                setMinimumRating("0")
                setStatus("All")
              }}
              className="mt-4 text-xs text-emerald-400 hover:text-emerald-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {filteredRestaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => setSelectedRestaurant(restaurant)}
                className="group rounded-xl border border-white/[0.07] bg-[#111316] p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-[#14171a]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                      <Store size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-zinc-100 group-hover:text-emerald-300">
                        {restaurant.name}
                      </h4>
                      <p className="mt-1 truncate text-[11px] text-zinc-500">{restaurant.cuisine}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${restaurant.status === "Active" ? "bg-emerald-400/10 text-emerald-400" : "bg-zinc-700/40 text-zinc-500"}`}>
                    {restaurant.status}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Star size={13} fill="currentColor" />
                    {restaurant.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1 text-zinc-500">
                    <MapPin size={13} />
                    {restaurant.city}
                  </span>
                </div>

                <div className="my-4 h-px bg-white/[0.06]" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-600">Revenue</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">{formatCurrency(restaurant.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600">Total orders</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-200">{formatNumber(restaurant.orders)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-zinc-500">
                    <Clock3 size={13} />
                    {restaurant.avgDelivery} min avg. delivery
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 opacity-0 transition group-hover:opacity-100">
                    View details <ArrowUpRight size={13} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Restaurant detail drawer */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <button
            aria-label="Close restaurant details"
            onClick={() => setSelectedRestaurant(null)}
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
          />

          <aside className="relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-white/10 bg-[#111316] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] text-emerald-400">RESTAURANT PROFILE</p>
                <p className="mt-1 text-xs text-zinc-500">{selectedRestaurant.id}</p>
              </div>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-white"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-7 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400">
                  <Store size={26} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-white">{selectedRestaurant.name}</h2>
                  <p className="mt-1 text-xs text-zinc-500">{selectedRestaurant.cuisine}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
                    <MapPin size={13} /> {selectedRestaurant.city}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Revenue", value: formatCurrency(selectedRestaurant.revenue) },
                  { label: "Total orders", value: formatNumber(selectedRestaurant.orders) },
                  { label: "Customer rating", value: `${selectedRestaurant.rating} / 5` },
                  { label: "Total reviews", value: formatNumber(selectedRestaurant.totalReviews) },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                    <p className="text-[10px] text-zinc-500">{metric.label}</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-100">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Operational performance</h3>
                <div className="mt-4 space-y-5">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">On-time delivery rate</span>
                      <span className="font-medium text-emerald-400">{selectedRestaurant.onTimeRate}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]">
                      <div className="h-full rounded-full bg-emerald-400" style={{ width: `${selectedRestaurant.onTimeRate}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.07] p-4">
                    <span className="flex items-center gap-2 text-xs text-zinc-500"><Clock3 size={15} /> Average delivery time</span>
                    <span className="text-sm font-semibold text-zinc-200">{selectedRestaurant.avgDelivery} min</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.07] p-4">
                    <span className="flex items-center gap-2 text-xs text-zinc-500"><Users size={15} /> Customer reviews</span>
                    <span className="text-sm font-semibold text-zinc-200">{formatNumber(selectedRestaurant.totalReviews)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4">
                <p className="text-xs font-medium text-emerald-300">Restaurant status</p>
                <p className="mt-2 text-sm text-zinc-300">{selectedRestaurant.status}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  This profile currently uses illustrative data.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
