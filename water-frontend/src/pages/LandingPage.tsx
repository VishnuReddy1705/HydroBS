import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { 
  Droplet, ShieldCheck, Users, Zap, TrendingUp, ArrowRight, Activity, 
  Database, Layers, Cpu, Sparkles, ShoppingCart, BarChart3, CheckCircle2, ChevronRight, X
} from "lucide-react";

export default function LandingPage() {
  const [openingPhase, setOpeningPhase] = useState<"loading" | "ready">("loading");
  const [activePreviewTab, setActivePreviewTab] = useState<"super" | "admin" | "resident">("admin");
  const [demoRequested, setDemoRequested] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Lenis smooth scroll initialization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    setTimeout(() => {
      setOpeningPhase("ready");
    }, 800);

    return () => lenis.destroy();
  }, []);

  // WebGL / Canvas Water Caustics Particle Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const numParticles = 160;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.6 + 0.3
      });
    }

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.3;
        p.y += p.vy + Math.cos(time + p.x * 0.01) * 0.3;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 180, 216, ${p.alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#00B4D8";
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoEmail.trim()) return;
    setDemoRequested(true);
  };

  return (
    <div className="bg-[#04101E] text-[#F0F9FF] font-sans antialiased selection:bg-[#00B4D8] selection:text-white min-h-screen">
      
      {/* Loader */}
      <AnimatePresence>
        {openingPhase === "loading" && (
          <motion.div 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 bg-[#04101E] flex items-center justify-center"
          >
            <div className="text-center space-y-3">
              <span className="font-serif text-3xl tracking-[0.4em] text-[#E0F7FA] block uppercase">HYDROBS</span>
              <div className="h-0.5 w-32 bg-[#00B4D8]/30 mx-auto overflow-hidden rounded-full">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="h-full w-full bg-[#00B4D8]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Luxury Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-16 py-6 bg-gradient-to-b from-[#04101E]/95 to-transparent backdrop-blur-md border-b border-[#00B4D8]/15">
        <Link to="/" className="font-serif font-bold text-xl md:text-2xl tracking-[0.3em] text-[#E0F7FA] flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-[#00B4D8]/30">
            <Droplet className="h-4.5 w-4.5 text-white" />
          </div>
          HYDROBS
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-[11px] font-semibold tracking-[0.2em] uppercase text-sky-200">
          <a href="#features" className="hover:text-[#00B4D8] transition-colors">Platform</a>
          <a href="#tariff" className="hover:text-[#00B4D8] transition-colors">Tiered Tariff</a>
          <a href="#procurement" className="hover:text-[#00B4D8] transition-colors">Bulk Procurement</a>
          <a href="#portals" className="hover:text-[#00B4D8] transition-colors">Stakeholders</a>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/login"
            className="text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full border border-[#00B4D8]/50 hover:border-[#00B4D8] text-[#00B4D8] hover:bg-[#00B4D8] hover:text-[#04101E] transition-all shadow-sm"
          >
            Sign In
          </Link>
          <Link 
            to="/register"
            className="hidden sm:inline-flex text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full bg-gradient-to-r from-[#0077B6] to-[#00B4D8] text-white hover:shadow-lg hover:shadow-[#00B4D8]/30 transition-all cursor-pointer"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* COLD OPEN HERO SECTION */}
      <header className="relative min-h-screen flex items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden bg-radial from-[#023E8A]/30 via-[#04101E] to-[#04101E]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=2000&q=80" 
            alt="HydroBS Smart Water Grid" 
            className="w-full h-full object-cover opacity-20 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#04101E]/60 via-[#04101E]/80 to-[#04101E]" />
        </div>

        <canvas ref={canvasRef} width={1200} height={800} className="absolute inset-0 z-0 pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#c79a52]/40 text-[#c79a52] text-xs uppercase tracking-[0.3em] font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" /> Residential Water Governance Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="font-serif font-normal text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none text-[#f5f0e6]"
          >
            Water Intelligence, <br />
            <em className="italic text-[#00B4D8] font-serif">Perfected.</em>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-slate-300 font-light text-base sm:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Automated sub-meter telemetry, 2-tier progressive tariff engines, and bulk tanker procurement tracking engineered for modern apartments & residential communities.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link 
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white font-extrabold text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#00B4D8]/20 hover:scale-105 transition-all"
            >
              Onboard Community <ArrowRight className="h-4 w-4" />
            </Link>
            <a 
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold text-xs uppercase tracking-[0.2em] border border-white/10 transition-all"
            >
              Explore Telemetry
            </a>
          </motion.div>

          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10 max-w-3xl mx-auto text-left">
            <div>
              <span className="block font-serif text-3xl text-[#00B4D8] font-bold">12,400+</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Active Meters</span>
            </div>
            <div>
              <span className="block font-serif text-3xl text-[#c79a52] font-bold">99.9%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Billing Accuracy</span>
            </div>
            <div>
              <span className="block font-serif text-3xl text-emerald-400 font-bold">47+</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Estates Onboarded</span>
            </div>
            <div>
              <span className="block font-serif text-3xl text-purple-400 font-bold">Instant</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Razorpay Checkout</span>
            </div>
          </div>
        </div>
      </header>

      {/* PLATFORM OVERVIEW INTRO */}
      <section id="features" className="py-24 px-6 md:px-16 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#00B4D8]">The Core Architecture</span>
          <h2 className="font-serif text-3xl md:text-5xl font-normal leading-tight text-[#f5f0e6]">
            Complete Water Control for <br />
            <em className="italic text-[#00B4D8]">Every Estate Stakeholder</em>
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light">
            HydroBS bridges smart sub-metering hardware, progressive tariff billing, and resident portals into a single real-time console.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Activity,
              title: "Sub-Second Telemetry",
              desc: "Automated flow rate measurement, index tracking, and leak alert algorithms for individual apartment lines.",
              tag: "Real-Time Hardware Sync"
            },
            {
              icon: TrendingUp,
              title: "Tiered Tariff Billing Engine",
              desc: "Progressive 2-tier slab pricing (Base rate for first 10 kL + Higher Rate for excess usage) calculated automatically per flat.",
              tag: "Automated Invoicing"
            },
            {
              icon: ShoppingCart,
              title: "Bulk Procurement Module",
              desc: "Log water tanker deliveries & municipal supply invoices, computing per-cycle volume and unit cost analytics.",
              tag: "Procurement Ledger"
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 hover:border-[#00B4D8]/50 transition-all group"
            >
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#00B4D8]/20 to-[#0F4C81]/20 border border-[#00B4D8]/30 flex items-center justify-center text-[#00B4D8] group-hover:scale-110 transition-transform">
                <item.icon className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c79a52]">{item.tag}</span>
                <h3 className="font-serif text-xl font-bold text-[#f5f0e6]">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TIERED TARIFF ENGINE SHOWCASE */}
      <section id="tariff" className="py-24 bg-[#0B192C]/60 border-y border-[#00B4D8]/15 px-6 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#c79a52]">Progressive Billing Rules</span>
            <h2 className="font-serif text-3xl md:text-5xl font-normal leading-tight text-[#f5f0e6]">
              Tiered Tariff Engine & <br />
              <em className="italic text-[#00B4D8]">Fair Water Allocation</em>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-light">
              Eliminate flat-rate water wastage with automated 2-tier slab tariffs stored per community. Encourage conservation while maintaining guaranteed floor charges.
            </p>

            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/20 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-white block">Tier 1: Base Consumption Slab</span>
                  <span className="text-[10px] text-slate-400">First 0 - 10 kL (10,000 Litres)</span>
                </div>
                <span className="text-sm font-extrabold text-[#00B4D8]">₹5.00 / Litre</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-white block">Tier 2: Excess Usage Penalty Slab</span>
                  <span className="text-[10px] text-slate-400">Beyond 10 kL (&gt; 10,000 Litres)</span>
                </div>
                <span className="text-sm font-extrabold text-purple-400">₹8.00 / Litre</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0B192C] border border-[#00B4D8]/20 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Live Tariff Simulator</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Recalculating...</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-400">
                <span>Sample Household Usage:</span>
                <span className="font-bold text-white font-mono">12,450 Litres (12.45 kL)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-400">
                <span>Tier 1 Charge (10,000 L @ ₹5/L):</span>
                <span className="font-bold text-[#00B4D8]">₹50,000.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-400">
                <span>Tier 2 Charge (2,450 L @ ₹8/L):</span>
                <span className="font-bold text-purple-400">₹19,600.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5 text-slate-400">
                <span>Fixed Infrastructure Service Charge:</span>
                <span className="font-bold text-emerald-400">₹50.00</span>
              </div>
              <div className="flex justify-between pt-3 text-sm font-extrabold text-white">
                <span>Calculated Net Bill Amount:</span>
                <span className="text-[#00B4D8] font-mono">₹69,650.00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BULK WATER PROCUREMENT MODULE */}
      <section id="procurement" className="py-24 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="bg-[#0B192C] border border-[#00B4D8]/20 rounded-3xl p-8 shadow-2xl space-y-6 order-2 lg:order-1">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Procurement Delivery Ledger</span>
              <span className="text-[10px] text-[#00B4D8] font-bold">Tanker & Municipal</span>
            </div>
            
            <div className="space-y-3">
              {[
                { date: "2026-07-22", type: "Tanker Delivery", volume: "12,000 L", cost: "₹6,000.00", unitCost: "₹0.50/L (₹500/kL)" },
                { date: "2026-07-20", type: "Municipal Supply", volume: "55,000 L", cost: "₹22,000.00", unitCost: "₹0.40/L (₹400/kL)" },
                { date: "2026-07-18", type: "Tanker Delivery", volume: "10,000 L", cost: "₹5,200.00", unitCost: "₹0.52/L (₹520/kL)" }
              ].map((p, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{p.type}</span>
                    <span className="text-[10px] text-slate-400">{p.date} &bull; {p.volume}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-[#00B4D8] block">{p.cost}</span>
                    <span className="text-[10px] text-purple-400">{p.unitCost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#00B4D8]">Procurement Analytics</span>
            <h2 className="font-serif text-3xl md:text-5xl font-normal leading-tight text-[#f5f0e6]">
              Bulk Water Procurement & <br />
              <em className="italic text-[#00B4D8]">Supplier Delivery Audits</em>
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-light">
              Track apartment water inflow from tanker suppliers, municipal bulk connections, and groundwater sources. Audit unit costs per cycle to minimize community operational overhead.
            </p>
          </div>
        </div>
      </section>

      {/* PORTALS & STAKEHOLDERS */}
      <section id="portals" className="py-24 bg-[#143230]/40 border-t border-white/5 px-6 md:px-16">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#c79a52]">Role-Based Architecture</span>
            <h2 className="font-serif text-3xl md:text-5xl font-normal text-[#f5f0e6]">Unified Portals</h2>
          </div>

          <div className="flex justify-center border-b border-white/10 max-w-md mx-auto">
            {[
              { id: "super", label: "Super Admin" },
              { id: "admin", label: "Community Admin" },
              { id: "resident", label: "Resident" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePreviewTab(tab.id as any)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                  activePreviewTab === tab.id 
                    ? "text-[#00B4D8] border-[#00B4D8]" 
                    : "text-slate-400 border-transparent hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl mx-auto bg-[#0c2422] border border-white/10 rounded-3xl p-8 shadow-2xl">
            {activePreviewTab === "super" && (
              <div className="space-y-4 text-xs">
                <h3 className="font-serif text-2xl text-white">Super Admin Global Control</h3>
                <p className="text-slate-300">Oversee all registered estate communities, system-wide meter telemetry ingestion, and global billing engine runs.</p>
              </div>
            )}
            {activePreviewTab === "admin" && (
              <div className="space-y-4 text-xs">
                <h3 className="font-serif text-2xl text-[#00B4D8]">Community Admin Dashboard</h3>
                <p className="text-slate-300">Manage resident meter readings, configure 2-tier slab tariffs, issue monthly bills, and log bulk water procurement deliveries.</p>
              </div>
            )}
            {activePreviewTab === "resident" && (
              <div className="space-y-4 text-xs">
                <h3 className="font-serif text-2xl text-purple-400">Resident Self-Service Console</h3>
                <p className="text-slate-300">View real-time meter usage graphs, inspect itemized invoice breakdowns, and complete instant online payments via Razorpay.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* DEMO / RESERVE CTA */}
      <section className="py-24 px-6 md:px-16 text-center max-w-4xl mx-auto space-y-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#00B4D8]">Onboard Your Estate</span>
        <h2 className="font-serif text-4xl md:text-6xl font-normal text-[#f5f0e6]">
          Ready to Modernize Your <br />
          <em className="italic text-[#00B4D8]">Community Water Utility?</em>
        </h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto font-light">
          Join leading residential communities automating water distribution, progressive tariff calculation, and online billing.
        </p>

        {demoRequested ? (
          <div className="p-6 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm max-w-md mx-auto font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Request received! Our onboarding team will contact you shortly.
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter community email" 
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              className="flex-1 bg-white/5 border border-white/15 rounded-full px-6 py-3.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00B4D8]"
              required
            />
            <button 
              type="submit"
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#00B4D8]/20 hover:scale-105 transition-all cursor-pointer"
            >
              Request Demo
            </button>
          </form>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 px-6 md:px-16 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-md bg-[#00B4D8] flex items-center justify-center text-[#0c2422] font-bold text-xs">H</div>
            <span className="font-serif font-bold text-sm tracking-widest text-white">HYDROBS</span>
          </div>
          <div>© 2026 HydroBS Smart Water Utility Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
