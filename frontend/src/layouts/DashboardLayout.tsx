import { useState } from "react"
import { Outlet } from "react-router-dom"
import { AppHeader } from "@/components/layout/AppHeader"
import { AppSidebar } from "@/components/layout/AppSidebar"

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-zinc-100">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((value) => !value)}
        onClose={() => setMobileOpen(false)}
      />

      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-[260px]"
        }`}
      >
        <AppHeader onMenuClick={() => setMobileOpen(true)} />

        <main className="mx-auto w-full max-w-[1600px] p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}