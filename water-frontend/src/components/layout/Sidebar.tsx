import { NavLink, useNavigate } from "react-router-dom"
import { LogOut, Droplets } from "lucide-react"
import { clearSession, getName } from "@/lib/auth"
import { Button } from "@/components/ui/button"

type SidebarItem = {
  title: string
  href: string
  icon: any
}

interface SidebarProps {
  items: SidebarItem[]
}

export default function Sidebar({ items }: SidebarProps) {
  const navigate = useNavigate()

  function logout() {
    clearSession()
    navigate("/login")
  }

  return (
    <aside className="w-72 h-screen bg-slate-950 border-r border-slate-800 flex flex-col">

      {/* Logo */}

      <div className="h-20 flex items-center px-7 border-b border-slate-800">

        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">

          <Droplets className="text-white h-6 w-6" />

        </div>

        <div className="ml-4">

          <h1 className="text-white font-bold text-2xl">
            HydroBS
          </h1>

          <p className="text-slate-400 text-xs">
            Smart Water Platform
          </p>

        </div>

      </div>

      {/* Navigation */}

      <nav className="flex-1 py-6 overflow-y-auto">

        {items.map((item) => {

          const Icon = item.icon

          if (item.title === "Logout") return null

          return (

            <NavLink
              key={item.title}
              to={item.href}
              className={({ isActive }) =>
                `mx-4 mb-2 flex items-center gap-4 rounded-xl px-5 py-4 transition-all
                ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`
              }
            >

              <Icon size={22} />

              <span className="font-medium">

                {item.title}

              </span>

            </NavLink>

          )

        })}

      </nav>

      {/* Bottom */}

      <div className="border-t border-slate-800 p-5">

        <div className="mb-5">

          <p className="text-white font-semibold">

            {getName()}

          </p>

          <p className="text-slate-400 text-sm">

            Logged In

          </p>

        </div>

        <Button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 flex items-center gap-2"
        >

          <LogOut size={18} />

          Logout

        </Button>

      </div>

    </aside>
  )
}