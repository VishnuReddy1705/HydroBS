import { useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Building2, Users, Droplet, Gauge, Receipt, FileText,
  ShoppingCart, FileSpreadsheet, Bell, BarChart3, UserCircle, LogOut,
  Settings, History, CreditCard, Lightbulb, type LucideIcon,
} from "lucide-react"
import { clearSession } from "@/lib/auth"

interface NavItem {
  label: string
  icon: LucideIcon
  active?: boolean
}

const NAV_ITEMS: Record<"SUPER_ADMIN" | "ADMIN" | "RESIDENT", NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Communities", icon: Building2 },
    { label: "Users", icon: Users },
    { label: "Reports", icon: BarChart3 },
    { label: "Settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Residents", icon: Users },
    { label: "Water Usage", icon: Droplet },
    { label: "Meter Readings", icon: Gauge },
    { label: "Billing", icon: Receipt },
    { label: "Tariff Plans", icon: FileText },
    { label: "Water Purchase", icon: ShoppingCart },
    { label: "Invoices", icon: FileSpreadsheet },
    { label: "Alerts", icon: Bell },
    { label: "Reports", icon: BarChart3 },
    { label: "Profile", icon: UserCircle },
  ],
  RESIDENT: [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "My Usage", icon: Droplet },
    { label: "Usage History", icon: History },
    { label: "My Bills", icon: CreditCard },
    { label: "My Invoices", icon: FileText },
    { label: "Notifications", icon: Bell },
    { label: "Water Tips", icon: Lightbulb },
    { label: "Profile", icon: UserCircle },
  ],
}

interface SidebarProps {
  role: "SUPER_ADMIN" | "ADMIN" | "RESIDENT"
}

export default function Sidebar({ role }: SidebarProps) {
  const navigate = useNavigate()
  const items = NAV_ITEMS[role]

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 flex-col border-r border-white/10 bg-white/5 backdrop-blur-2xl lg:flex text-white">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 border border-white/20 shadow-md">
          <Droplet className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-xl font-extrabold tracking-wider text-white">HydroBS</span>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-250 cursor-pointer ${
              item.active
                ? "bg-white/15 border-l-2 border-white text-white font-bold shadow-lg shadow-white/5"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon className={`h-[18px] w-[18px] ${item.active ? "text-white" : "text-white/70"}`} />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4 bg-white/5">
        <button
          onClick={() => { clearSession(); navigate("/login") }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Logout
        </button>
      </div>
    </aside>
  )
}