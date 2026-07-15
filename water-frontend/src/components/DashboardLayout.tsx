import { type ReactNode } from "react"
import Sidebar from "./layout/Sidebar"
import TopNavbar from "./layout/TopNavbar"

interface DashboardLayoutProps {
  role: "SUPER_ADMIN" | "ADMIN" | "RESIDENT"
  title: string
  subtitle?: string
  onRefresh?: () => Promise<void> | void
  isRefreshing?: boolean
  children: ReactNode
}

export default function DashboardLayout({
  role,
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5FAFC] text-[#1F2937] antialiased font-sans">
      <Sidebar role={role} />
      <div className="lg:ml-72">
        <TopNavbar 
          title={title} 
          subtitle={subtitle} 
          onRefresh={onRefresh} 
          isRefreshing={isRefreshing} 
        />
        <main className="p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}