import { ReactNode } from "react"

import Sidebar from "./Sidebar"
import TopNavbar from "./TopNavbar"

type SidebarItem = {
  title: string
  href: string
  icon: any
}

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  sidebarItems: SidebarItem[]
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  sidebarItems,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-950">

      {/* Sidebar */}

      <Sidebar items={sidebarItems} />

      {/* Main Content */}

      <div className="flex flex-1 flex-col">

        <TopNavbar
          title={title}
          subtitle={subtitle}
        />

        {/* Page Content */}

        <main className="flex-1 overflow-y-auto bg-slate-950 p-8">

          {children}

        </main>

      </div>

    </div>
  )
}