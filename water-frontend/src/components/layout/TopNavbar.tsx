import { Search, Bell, LogOut } from "lucide-react";
import { getName, clearSession } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
}

export default function TopNavbar({ title, subtitle }: TopNavbarProps) {
  const navigate = useNavigate();
  const name = getName() || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-20 border-b border-white/10 bg-white/5 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40 text-white">
      <div>
        <h1 className="text-2xl font-extrabold tracking-wide text-white drop-shadow-sm">{title}</h1>
        {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all w-52"
          />
        </div>

        <button className="relative p-2 text-white/80 hover:text-white transition-all rounded-full hover:bg-white/10">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-300 border border-white/20"></span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 border-2 border-white/20 flex items-center justify-center font-bold text-white text-xs shadow-lg">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-bold text-white leading-tight">{name}</p>
          </div>
        </div>

        <button
          onClick={() => { clearSession(); navigate("/login"); }}
          className="p-2 text-white/60 hover:text-rose-300 transition-all rounded-full hover:bg-white/10"
          title="Logout"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}