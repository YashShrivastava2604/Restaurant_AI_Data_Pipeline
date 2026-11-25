import { Bell, Menu, Moon, Search, Sun } from "lucide-react"
import { useTheme } from "next-themes"

interface AppHeaderProps {
  onMenuClick: () => void
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-white/[0.07] bg-[#101114]/90 px-5 backdrop-blur-xl lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-zinc-400 hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <div>
          <p className="text-[11px] text-zinc-500">Workspace / Overview</p>
          <h1 className="mt-0.5 text-sm font-semibold text-zinc-100">
            Dashboard
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="hidden items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-xs text-zinc-500 transition hover:border-white/20 sm:flex"
          aria-label="Search"
        >
          <Search size={15} />
          Search
          <span className="ml-5 rounded border border-white/10 px-1.5 py-0.5 text-[10px]">
            /
          </span>
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="relative rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-400" />
        </button>

        <div className="ml-1 flex size-8 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-xs font-semibold text-emerald-300">
          Y
        </div>
      </div>
    </header>
  )
}