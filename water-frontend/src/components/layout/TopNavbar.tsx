import { Search, Bell, LogOut, Check, MailOpen, AlertTriangle, FileText, CheckCircle2, RefreshCw, Sun, Moon } from "lucide-react";
import { getName, clearSession } from "@/lib/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "@/api";
import { motion, AnimatePresence } from "framer-motion";

interface TopNavbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function TopNavbar({ title, subtitle, onRefresh, isRefreshing }: TopNavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ fullName: string; role: string; flatNumber?: string } | null>(null);
  
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("hydrobs_theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("hydrobs_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const name = profile?.fullName || getName() || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/notifications");
      setNotifications(res.data);
      const countRes = await api.get("/api/notifications/unread-count");
      setUnreadCount(countRes.data.unreadCount);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/users/me");
      setProfile(res.data);
      localStorage.setItem("hydrobs_name", res.data.fullName);
      localStorage.setItem("hydrobs_role", res.data.role);
      if (res.data.communityId) {
        localStorage.setItem("hydrobs_community_id", res.data.communityId.toString());
      }
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s

    // Click outside handler to close dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const archiveNotification = async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/archive`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Re-fetch unread count
      const countRes = await api.get("/api/notifications/unread-count");
      setUnreadCount(countRes.data.unreadCount);
    } catch (err) {
      console.error("Failed to archive notification:", err);
    }
  };

  const archiveAllNotifications = async () => {
    try {
      await api.post("/api/notifications/archive-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to archive all notifications:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "HIGH_USAGE":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "BILL_GENERATED":
        return <FileText className="h-4 w-4 text-cyan-600" />;
      case "READING_UPLOADED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default:
        return <Bell className="h-4 w-4 text-[#0F4C81]" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + 
             " - " + date.toLocaleDateString([], { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <header className="h-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#08121e]/70 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40 text-slate-800 dark:text-slate-100 shadow-sm select-none">
      <div className="flex flex-col text-left">
        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
          {location.pathname.split("/").filter(Boolean).map((seg, idx, arr) => {
            const isLast = idx === arr.length - 1;
            const formattedSeg = seg.replace("-", " ").toUpperCase();
            if (seg === "dashboard" && idx === 1) return null;
            return (
              <div key={seg} className="flex items-center gap-1">
                {idx > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
                <span className={isLast ? "text-[#00B4D8] font-extrabold" : ""}>{formattedSeg}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F4C81] dark:text-[#00B4D8]">{title}</h1>
          {/* Hidden as requested - refresh buttons are now integrated within navigated panels */}
          {false && onRefresh && (
            <button
              onClick={() => {
                fetchProfile();
                fetchNotifications();
                onRefresh();
              }}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#0F4C81] hover:text-[#00B4D8] disabled:opacity-50 disabled:cursor-not-allowed bg-slate-50 border border-slate-200/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}
        </div>
        {subtitle && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
            {onRefresh && !isRefreshing && (
              <span className="text-[10px] text-slate-400 font-semibold">• Updated just now</span>
            )}
            {onRefresh && isRefreshing && (
              <span className="text-[10px] text-[#00B4D8] font-semibold animate-pulse">• Syncing...</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        
        {/* Modern styled Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search flats, bills, logs..."
            className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-transparent focus:border-slate-200 dark:focus:border-slate-800 focus:bg-white dark:focus:bg-slate-900 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/25 transition-all w-60 font-medium"
          />
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-600 hover:text-[#0F4C81] dark:text-slate-300 dark:hover:text-[#00B4D8] transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2.5 text-slate-600 hover:text-[#0F4C81] dark:text-slate-300 dark:hover:text-[#00B4D8] transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 ${isOpen ? 'bg-slate-100 dark:bg-slate-800 text-[#0F4C81] dark:text-[#00B4D8]' : ''}`}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4.5 w-4.5 rounded-full bg-[#00B4D8] border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_12px_30px_rgba(15,76,129,0.08)] overflow-hidden z-50 text-slate-800 dark:text-slate-100"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#0F4C81] dark:text-[#00B4D8]" />
                    <span className="font-bold text-sm text-[#0f4c81] dark:text-slate-200">Notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-bold text-[#00B4D8] hover:text-[#0F4C81] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Check className="h-3 w-3" /> Mark read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={archiveAllNotifications}
                        className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <MailOpen className="h-8 w-8 opacity-40 text-[#00B4D8]" />
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && markAsRead(n.id)}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all cursor-pointer flex gap-3 ${!n.isRead ? 'bg-[#00B4D8]/5' : ''}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotificationIcon(n.type)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-bold truncate ${!n.isRead ? 'text-[#0F4C81] dark:text-[#00B4D8]' : 'text-slate-700 dark:text-slate-300'}`}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {!n.isRead && (
                                <span className="h-1.5 w-1.5 bg-[#00B4D8] rounded-full flex-shrink-0"></span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveNotification(n.id);
                                }}
                                className="text-slate-400 hover:text-red-500 text-[10px] p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-all ml-1"
                                title="Archive Notification"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5">
                            {formatTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    onClick={fetchNotifications}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#0F4C81] dark:hover:text-[#00B4D8] flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer font-bold"
                  >
                    <RefreshCw className="h-3 w-3" /> Sync Inbox
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#00B4D8] border border-white/20 flex items-center justify-center font-bold text-white text-xs shadow-md">
            {initials}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
              {profile?.role === "SUPER_ADMIN" ? "Super Admin" : 
               profile?.role === "ADMIN" ? "Community Admin" : 
               profile?.role === "RESIDENT" ? `Resident • Flat ${profile?.flatNumber || "N/A"}` : 
               "User"}
            </p>
          </div>
        </div>

        {/* Quick LogOut Action */}
        <button
          onClick={() => { clearSession(); navigate("/login"); }}
          className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all rounded-xl cursor-pointer"
          title="Logout"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}