import { type ReactNode } from "react"
import Sidebar from "./layout/Sidebar"
import TopNavbar from "./layout/TopNavbar"

interface DashboardLayoutProps {
  role: "SUPER_ADMIN" | "ADMIN" | "RESIDENT"
  title: string
  subtitle?: string
  children: ReactNode
}

export default function DashboardLayout({
  role,
  title,
  subtitle,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 text-white antialiased">
      <Sidebar role={role} />
      <div className="lg:ml-72">
        <TopNavbar title={title} subtitle={subtitle} />
        <main className="p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}