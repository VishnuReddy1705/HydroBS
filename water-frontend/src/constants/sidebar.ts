import {
  LayoutDashboard,
  Users,
  Droplets,
  FileSpreadsheet,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Building2,
  BarChart3,
  Shield,
  Upload,
  UserCircle,
  Lightbulb,
} from "lucide-react"

export const adminSidebar = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin-dashboard",
  },
  {
    title: "Residents",
    icon: Users,
    href: "/admin/residents",
  },
  {
    title: "Water Usage",
    icon: Droplets,
    href: "/admin/usage",
  },
  {
    title: "Upload Readings",
    icon: Upload,
    href: "/admin/upload",
  },
  {
    title: "Billing",
    icon: Receipt,
    href: "/admin/billing",
  },
  {
    title: "Reports",
    icon: FileSpreadsheet,
    href: "/admin/reports",
  },
  {
    title: "Alerts",
    icon: Bell,
    href: "/admin/alerts",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
  {
    title: "Logout",
    icon: LogOut,
    href: "/logout",
  },
]

export const residentSidebar = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/resident-dashboard",
  },
  {
    title: "My Usage",
    icon: Droplets,
    href: "/resident/usage",
  },
  {
    title: "Usage History",
    icon: BarChart3,
    href: "/resident/history",
  },
  {
    title: "Bills",
    icon: Receipt,
    href: "/resident/bills",
  },
  {
    title: "Notifications",
    icon: Bell,
    href: "/resident/notifications",
  },
  {
    title: "Water Tips",
    icon: Lightbulb,
    href: "/resident/tips",
  },
  {
    title: "Profile",
    icon: UserCircle,
    href: "/resident/profile",
  },
  {
    title: "Logout",
    icon: LogOut,
    href: "/logout",
  },
]

export const superAdminSidebar = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/super-admin-dashboard",
  },
  {
    title: "Communities",
    icon: Building2,
    href: "/superadmin/communities",
  },
  {
    title: "Community Admins",
    icon: Shield,
    href: "/superadmin/admins",
  },
  {
    title: "Residents",
    icon: Users,
    href: "/superadmin/residents",
  },
  {
    title: "Platform Analytics",
    icon: BarChart3,
    href: "/superadmin/analytics",
  },
  {
    title: "Reports",
    icon: FileSpreadsheet,
    href: "/superadmin/reports",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/superadmin/settings",
  },
  {
    title: "Logout",
    icon: LogOut,
    href: "/logout",
  },
]