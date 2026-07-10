import { Link } from "react-router-dom";
import { Droplet, BarChart3, ShieldCheck, Users, Zap, Bell, TrendingDown, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    title: "Real-Time Analytics",
    desc: "Visualize water consumption trends with beautiful charts and graphs. Track daily, weekly, and monthly patterns at a glance.",
  },
  {
    icon: Users,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    title: "Community Management",
    desc: "Manage residents, process join requests, approve new flats, and keep your entire housing community organized effortlessly.",
  },
  {
    icon: TrendingDown,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Smart Bill Generation",
    desc: "Automatically compute monthly water bills from meter readings. Generate invoices for every flat with one click.",
  },
  {
    icon: Bell,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    title: "Leak & Alert Detection",
    desc: "Automatically flag high-usage anomalies that may indicate leaks. Stay ahead of problems before they escalate.",
  },
  {
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    title: "CSV Meter Upload",
    desc: "Bulk-upload meter readings from any CSV format. Our smart parser handles variations in column names automatically.",
  },
  {
    icon: ShieldCheck,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    title: "Secure & Role-Based",
    desc: "Three-tier access control — Super Admin, Community Admin, and Resident. JWT-secured APIs with precise permission boundaries.",
  },
];

const roles = [
  {
    role: "Super Admin",
    desc: "Monitor all communities system-wide, track user growth, view cross-community consumption trends, and manage import errors.",
    color: "from-violet-600 to-indigo-700",
    border: "border-violet-500/30",
  },
  {
    role: "Community Admin",
    desc: "Upload meter readings, generate monthly bills, approve resident join requests, and track per-flat water consumption.",
    color: "from-sky-600 to-blue-700",
    border: "border-sky-500/30",
  },
  {
    role: "Resident",
    desc: "View your personal usage history, compare consumption against community averages, and track your current bill status.",
    color: "from-emerald-600 to-teal-700",
    border: "border-emerald-500/30",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050d1a] text-white selection:bg-sky-500/30 overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-600/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-60 h-[500px] w-[500px] rounded-full bg-blue-700/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/5 bg-black/30 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <Droplet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">HydroBS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-400/30"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold tracking-wider mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          Community Water Monitoring Platform
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
          <span className="block text-white">Smart Water</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-blue-300 to-cyan-300">
            Management
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 leading-relaxed mb-10">
          Empower your housing community with real-time insights, automated billing, and
          intelligent conservation tools — all in one seamless platform.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl hover:from-sky-400 hover:to-blue-500 transition-all shadow-2xl shadow-sky-500/30 hover:shadow-sky-400/40 hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/register/admin"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:border-white/20 rounded-xl transition-all hover:bg-white/10"
          >
            Create a Community
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          {[
            { val: "3", label: "User Roles" },
            { val: "₹5/L", label: "Tariff Rate" },
            { val: "100%", label: "Secure APIs" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-white">{s.val}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything you need</h2>
          <p className="text-slate-400 max-w-xl mx-auto">A complete toolkit for managing community water consumption, billing, and transparency.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className={`p-6 rounded-2xl border bg-white/3 hover:bg-white/6 transition-all group cursor-default ${f.border}`}
            >
              <div className={`inline-flex p-3 rounded-xl border ${f.bg} mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Built for every role</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Whether you're managing the whole system or just your flat, HydroBS gives you exactly what you need.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((r) => (
            <div key={r.role} className={`relative p-px rounded-2xl bg-gradient-to-br ${r.color} overflow-hidden`}>
              <div className="relative bg-[#080f1e] rounded-2xl p-6 h-full">
                <h3 className="text-lg font-bold text-white mb-3">{r.role}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How it works</h2>
        </div>
        <div className="space-y-6">
          {[
            { step: "1", title: "Admin registers & creates a community", desc: "Sign up as an admin and create your gated community or apartment block on HydroBS." },
            { step: "2", title: "Residents join the community", desc: "Residents register, search for their community, and send a join request with their flat number." },
            { step: "3", title: "Admin uploads meter readings via CSV", desc: "Each month, the admin uploads meter readings. Bills are automatically computed per resident." },
            { step: "4", title: "Everyone tracks usage in real time", desc: "Residents monitor daily usage, bills, and AI conservation tips. Admins see community-wide trends." },
          ].map((item) => (
            <div key={item.step} className="flex gap-5 items-start p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-white/15 transition-all">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-sm font-extrabold text-white shadow-lg shadow-sky-500/20">
                {item.step}
              </div>
              <div>
                <p className="font-bold text-white mb-1">{item.title}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="relative p-px rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-600 overflow-hidden shadow-2xl shadow-sky-500/20">
          <div className="relative bg-[#070e1c] rounded-3xl px-8 py-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">Join HydroBS today and bring transparent, data-driven water management to your community.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register/admin"
                className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-lg text-sm"
              >
                Create a Community
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 bg-white/10 border border-white/20 hover:bg-white/15 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Sign In
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
              {["Free to use", "No credit card needed", "Role-based access", "Secure JWT auth"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-slate-600 text-xs">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Droplet className="w-4 h-4 text-sky-600" />
          <span className="font-semibold text-slate-500">HydroBS</span>
        </div>
        <p>Community Water Management Platform</p>
      </footer>
    </div>
  );
}
