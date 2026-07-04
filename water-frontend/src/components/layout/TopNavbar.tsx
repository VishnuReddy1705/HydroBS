import {
  Bell,
  Search,
  Moon,
  CalendarDays,
} from "lucide-react"

import { getName } from "@/lib/auth"

interface TopNavbarProps {
  title: string
  subtitle?: string
}

export default function TopNavbar({
  title,
  subtitle,
}: TopNavbarProps) {
  return (
    <header className="h-20 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-8">

      {/* Left */}

      <div>

        <h1 className="text-3xl font-bold text-white">

          {title}

        </h1>

        {subtitle && (
          <p className="text-slate-400 mt-1">

            {subtitle}

          </p>
        )}

      </div>

      {/* Right */}

      <div className="flex items-center gap-5">

        {/* Search */}

        <div className="hidden lg:flex items-center bg-slate-900 rounded-xl px-4 h-11 w-80 border border-slate-800">

          <Search className="text-slate-500 h-4 w-4" />

          <input
            placeholder="Search..."
            className="ml-3 bg-transparent outline-none text-white w-full"
          />

        </div>

        {/* Billing Cycle */}

        <div className="hidden xl:flex items-center gap-2 rounded-xl border border-slate-800 px-4 py-2 bg-slate-900">

          <CalendarDays className="h-5 w-5 text-blue-400" />

          <span className="text-slate-300">

            Jul 2026

          </span>

        </div>

        {/* Dark Mode */}

        <button className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition">

          <Moon className="text-slate-300 h-5 w-5" />

        </button>

        {/* Notifications */}

        <button className="relative w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 transition">

          <Bell className="text-slate-300 h-5 w-5" />

          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>

        </button>

        {/* User */}

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">

            {getName()?.charAt(0)}

          </div>

          <div className="hidden md:block">

            <p className="text-white font-semibold">

              {getName()}

            </p>

            <p className="text-slate-400 text-xs">

              Logged In

            </p>

          </div>

        </div>

      </div>

    </header>
  )
}