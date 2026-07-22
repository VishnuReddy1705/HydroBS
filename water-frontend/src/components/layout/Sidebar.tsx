import { useNavigate, useSearchParams, useLocation } from "react-router-dom"
import {
  LayoutDashboard, Building2, Users, Droplet, Gauge, Receipt, FileText,
  ShoppingCart, FileSpreadsheet, Bell, BarChart3, UserCircle, LogOut,
  Settings, History, CreditCard, Lightbulb, Calendar, type LucideIcon,
  TrendingUp, Layers, Volume2, Activity
} from "lucide-react"
import { clearSession } from "@/lib/auth"
import { motion } from "framer-motion"

interface NavItem {
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: Record<"SUPER_ADMIN" | "ADMIN" | "RESIDENT", NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Communities", icon: Building2 },
    { label: "Users", icon: Users },
    { label: "System Health", icon: Activity },
    { label: "Visualizations", icon: TrendingUp },
    { label: "Announcements", icon: Volume2 },
    { label: "Audit Logs", icon: History },
    { label: "Settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Meter Readings", icon: Gauge },
    { label: "Water Usage", icon: Droplet },
    { label: "Residents", icon: Users },
    { label: "Invoices", icon: FileSpreadsheet },
    { label: "Billing", icon: Receipt },
    { label: "Tariff Plans", icon: FileText },
    { label: "Water Purchase", icon: ShoppingCart },
    { label: "Alerts", icon: Bell },
    { label: "Reports", icon: BarChart3 },
    { label: "Visualizations", icon: TrendingUp },
    { label: "Billing Cycles", icon: Layers },
    { label: "Announcements", icon: Volume2 },
    { label: "Audit Logs", icon: History },
    { label: "Profile", icon: UserCircle },
  ],
  RESIDENT: [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "My Usage", icon: Droplet },
    { label: "Usage History", icon: History },
    { label: "My Bills", icon: CreditCard },
    { label: "My Invoices", icon: FileText },
    { label: "Notifications", icon: Bell },
    { label: "Reports", icon: BarChart3 },
    { label: "Visualizations", icon: TrendingUp },
    { label: "Announcements", icon: Volume2 },
    { label: "Water Tips", icon: Lightbulb },
    { label: "Profile", icon: UserCircle },
  ],
}

interface SidebarProps {
  role: "SUPER_ADMIN" | "ADMIN" | "RESIDENT"
}

export default function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const items = NAV_ITEMS[role]
  
  let currentTab = searchParams.get("tab") || "dashboard"
  
  if (location.pathname.includes("/residents/") || location.pathname.includes("/residents-detail")) {
    currentTab = role === "SUPER_ADMIN" ? "users" : "residents"
  } else if (location.pathname.includes("/billing/") && !location.pathname.endsWith("/billing")) {
    currentTab = role === "RESIDENT" ? "my-bills" : "billing"
  }
  
  const getTabKey = (label: string) => {
    return label.toLowerCase().replace(" ", "-")
  }

  const handleItemClick = (label: string) => {
    const tabKey = getTabKey(label)
    
    const targetPath = role === "SUPER_ADMIN" 
      ? "/super-admin/dashboard" 
      : role === "ADMIN" 
      ? "/admin/dashboard" 
      : "/resident/dashboard"

    navigate(`${targetPath}?tab=${tabKey}`)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col bg-gradient-to-b from-[#0F4C81] via-[#0B3A63] to-[#062038] text-white lg:flex shadow-[4px_0_24px_rgba(15,76,129,0.15)] border-r border-[#00B4D8]/10 select-none">
      
      {/* Sidebar Header Brand with flow element */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#00B4D8]/5 pointer-events-none" />
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#48CAE4] to-[#00B4D8] shadow-lg border border-white/20">
          <Droplet className="h-5 w-5 text-white fill-white/10" />
        </div>
        <div>
          <span className="text-2xl font-extrabold tracking-wider bg-clip-text bg-gradient-to-r from-white to-[#48CAE4]">
            HydroBS
          </span>
          <span className="block text-[10px] tracking-widest text-[#00B4D8]/80 font-bold uppercase mt-0.5 pl-0.5">
            Smart Utility
          </span>
        </div>
      </div>

      {/* Navigation Options list */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3.5 py-6 custom-scrollbar">
        {items.map((item) => {
          const tabKey = getTabKey(item.label)
          const isActive = currentTab === tabKey
          
          return (
            <button
              key={item.label}
              onClick={() => handleItemClick(item.label)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4.5 py-3.5 text-sm transition-all duration-200 cursor-pointer group relative ${
                isActive
                  ? "text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-gradient-to-r from-[#00B4D8]/15 to-transparent border-l-[3px] border-[#00B4D8] rounded-2xl pointer-events-none"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110 z-10 ${isActive ? "text-[#00B4D8]" : "text-slate-400 group-hover:text-white"}`} />
              <span className="z-10">{item.label}</span>
              
              {/* Subtle active pill dot */}
              {isActive && (
                <span className="absolute right-4 h-1.5 w-1.5 rounded-full bg-[#00B4D8] z-10" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Logout foot action */}
      <div className="border-t border-white/5 p-4 bg-black/10">
        <button
          onClick={() => { clearSession(); navigate("/login") }}
          className="flex w-full items-center gap-3 rounded-2xl px-4.5 py-3.5 text-sm text-slate-300 hover:bg-[#rose]/10 hover:text-rose-300 transition-all duration-200 cursor-pointer hover:bg-rose-500/10"
        >
          <LogOut className="h-[18px] w-[18px] text-slate-400 group-hover:text-rose-300" />
          Logout
        </button>
      </div>
    </aside>
  )
}