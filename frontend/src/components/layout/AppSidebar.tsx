
import {
  Activity,
  BarChart3,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Database,
  LayoutDashboard,
  MessageSquareText,
  Store,
  Workflow,
  X,
} from "lucide-react"
import { NavLink } from "react-router-dom"

interface AppSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onClose: () => void
}

const navigation = [
  {
    title: "WORKSPACE",
    items: [
      { label: "Overview", icon: LayoutDashboard, path: "/" },
      { label: "Analytics", icon: BarChart3, path: "/analytics" },
      { label: "Restaurants", icon: Store, path: "/restaurants" },
      { label: "Reviews", icon: MessageSquareText, path: "/reviews" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { label: "AI Review Assistant", icon: BrainCircuit, path: "/ai-chat" },
      { label: "Text to SQL", icon: Database, path: "/text-to-sql" },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { label: "Pipeline Monitor", icon: Workflow, path: "/pipeline" },
    ],
  },
]

export function AppSidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onClose,
}: AppSidebarProps) {
  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.07] bg-[#101114] transition-all duration-300 lg:translate-x-0 ${
          collapsed ? "w-[76px]" : "w-[260px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-white/[0.07] px-5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400 text-[#101114]">
              <Activity size={21} strokeWidth={2.5} />
            </div>

            {!collapsed && (
              <div className="whitespace-nowrap">
                <p className="text-sm font-semibold tracking-tight text-white">
                  RestaurantIQ
                </p>
                <p className="text-[10px] tracking-[0.16em] text-zinc-500">
                  INTELLIGENCE PLATFORM
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-7">
          {navigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-600">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/"}
                      title={collapsed ? item.label : undefined}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                          isActive
                            ? "bg-emerald-400/10 font-medium text-emerald-300"
                            : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={18} className="shrink-0" />
                          {!collapsed && (
                            <span className="whitespace-nowrap">
                              {item.label}
                            </span>
                          )}
                          {isActive && !collapsed && (
                            <span className="ml-auto size-1.5 rounded-full bg-emerald-400" />
                          )}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="mx-3 mb-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-medium text-zinc-300">
                Systems operational
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Databricks and AI services connected.
            </p>
          </div>
        )}

        <div className="hidden border-t border-white/[0.07] p-3 lg:block">
          <button
            onClick={onToggle}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-zinc-500 hover:bg-white/[0.04] hover:text-white"
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            {!collapsed && "Collapse sidebar"}
          </button>
        </div>
      </aside>
    </>
  )
}
