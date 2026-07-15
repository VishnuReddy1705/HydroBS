import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Lenis from "lenis";
import { 
  Droplet, BarChart3, ShieldCheck, Users, Zap, Bell, 
  TrendingUp, ArrowRight, CheckCircle2, Waves, Activity, 
  DollarSign, Smartphone, Database, Award, Star, Quote, 
  Layers, RefreshCw, AlertTriangle, Shield, CheckCircle, Cpu,
  Sparkles, ArrowDown
} from "lucide-react";

// Feature list data
const features = [
  {
    icon: Activity,
    title: "Real-Time Telemetry",
    desc: "Monitor residential water distribution, flow velocities, and pipeline pressure metrics in real-time.",
    color: "from-[#1D82E0] to-[#39C6FC]"
  },
  {
    icon: TrendingUp,
    title: "Automated Billing",
    desc: "Seamlessly compute bills using customizable slab structures or fallback occupancy formulas.",
    color: "from-[#39C6FC] to-[#0A3B75]"
  },
  {
    icon: Zap,
    title: "CSV Ingestion Engine",
    desc: "Bulk import meter indices with an auto-aligning parser that resolves column header variances.",
    color: "from-[#1D82E0] to-[#FFFFFF]"
  },
  {
    icon: Users,
    title: "Resident Portal",
    desc: "Give tenants direct access to download bills, review leak warnings, and track historic usage.",
    color: "from-[#0A3B75] to-[#1D82E0]"
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Security",
    desc: "Granular access controls built for Super Admins, Community Admins, and Residents.",
    color: "from-[#1D82E0] to-[#0A3B75]"
  },
  {
    icon: Database,
    title: "Audit Ledger",
    desc: "Persistent logs for tanker deliveries, municipal bulk purchases, and shared community costs.",
    color: "from-[#39C6FC] to-[#0A3B75]"
  }
];

export default function LandingPage() {
  const [openingPhase, setOpeningPhase] = useState<"loading" | "ready" | "scrolled">("loading");
  const [activePreviewTab, setActivePreviewTab] = useState<"super" | "admin" | "resident">("admin");
  const [isConservationActive, setIsConservationActive] = useState(false);
  const [warpScale, setWarpScale] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const storytellingRef = useRef<HTMLDivElement>(null);

  // Scroll tracking for cinematic storytelling
  const { scrollYProgress } = useScroll();
  const textOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

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
    }, 1500);

    return () => lenis.destroy();
  }, []);

  // Water Particle Morphing & Fluid Physics Simulation (Vibrant Particle Colors)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const numParticles = 200;
    const particles: Array<{
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }> = [];

    // Initialize particles randomly
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        targetX: canvas.width / 2,
        targetY: canvas.height / 2,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 1.2,
        alpha: Math.random() * 0.6 + 0.3
      });
    }

    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const handleMouseLeave = () => {
      mouse.active = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scroll progress mapping
      const scrollPos = window.scrollY;
      let morphState: "droplet" | "river" | "pipeline" | "logo" = "droplet";

      if (scrollPos > 1200) {
        morphState = "logo";
      } else if (scrollPos > 700) {
        morphState = "pipeline";
      } else if (scrollPos > 250) {
        morphState = "river";
      }

      // Calculate particle morph target coordinates
      particles.forEach((p, idx) => {
        let tx = canvas.width / 2;
        let ty = canvas.height / 2;

        if (morphState === "droplet") {
          // Teardrop / Water Droplet shape formula
          const t = (idx / numParticles) * Math.PI * 2;
          const R = 80;
          tx = canvas.width / 2 + R * Math.sin(t) * (1 - Math.cos(t)) * 0.8;
          ty = canvas.height / 2 - R * Math.cos(t) - 20;
          // Wobble effect
          tx += Math.sin(time + idx) * 3;
          ty += Math.cos(time - idx) * 3;
        } else if (morphState === "river") {
          // River wave layout
          const ratio = idx / numParticles;
          tx = ratio * canvas.width;
          ty = canvas.height / 2 + Math.sin(ratio * Math.PI * 3 + time) * 40;
        } else if (morphState === "pipeline") {
          // Pipeline grid layout (branches)
          const row = idx % 4;
          const col = Math.floor(idx / 4);
          tx = 50 + col * 12;
          ty = 60 + row * 60 + Math.sin(time + col) * 10;
        } else if (morphState === "logo") {
          // Letter 'H' shape (for HydroBS)
          const ratio = idx / numParticles;
          if (ratio < 0.4) {
            // Left vertical leg
            tx = canvas.width / 2 - 60;
            ty = 80 + (ratio / 0.4) * 160;
          } else if (ratio < 0.8) {
            // Right vertical leg
            tx = canvas.width / 2 + 60;
            ty = 80 + ((ratio - 0.4) / 0.4) * 160;
          } else {
            // Horizontal bar
            tx = canvas.width / 2 - 60 + ((ratio - 0.8) / 0.2) * 120;
            ty = 160;
          }
        }

        p.targetX = tx;
        p.targetY = ty;

        // Physics-based tracking with spring inertia
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.vx += dx * 0.08;
        p.vy += dy * 0.08;
        p.vx *= 0.82;
        p.vy *= 0.82;

        // Repel force simulation when mouse is nearby
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const dist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (dist < 80) {
            const force = (80 - dist) / 80;
            p.vx += (mdx / dist) * force * 15;
            p.vy += (mdy / dist) * force * 15;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        // Draw particle with the new twilight sky palette
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        if (idx % 3 === 0) {
          ctx.fillStyle = `rgba(57, 198, 252, ${p.alpha})`; // Cyan Sky (#39C6FC)
        } else if (idx % 3 === 1) {
          ctx.fillStyle = `rgba(29, 130, 224, ${p.alpha})`; // Twilight Blue (#1D82E0)
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`; // Pure White
        }
        ctx.fill();

        // Trace subtle connecting threads between adjacent particles
        if (idx > 0 && idx < numParticles - 1 && morphState === "logo") {
          const dist = Math.sqrt(Math.pow(p.x - particles[idx - 1].x, 2) + Math.pow(p.y - particles[idx - 1].y, 2));
          if (dist < 40) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[idx - 1].x, particles[idx - 1].y);
            ctx.strokeStyle = `rgba(57, 198, 252, ${0.15 - dist / 300})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Background fluid wave effect with twilight sky gradient
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      time += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const amplitude = 40 + w * 20;
        const frequency = 0.001 - w * 0.0002;
        const offset = w * 3 + time;

        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 15) {
          const y = canvas.height - 300 + Math.sin(x * frequency + offset) * amplitude + Math.cos(x * 0.003 - offset) * 15;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, canvas.height - 400, 0, canvas.height);
        if (w === 0) {
          grad.addColorStop(0, "rgba(57, 198, 252, 0.04)"); // Cyan Sky
          grad.addColorStop(1, "rgba(10, 59, 117, 0.85)"); // Deep Sky Blue (#0A3B75)
        } else if (w === 1) {
          grad.addColorStop(0, "rgba(29, 130, 224, 0.06)"); // Twilight Blue
          grad.addColorStop(1, "rgba(7, 44, 86, 0.7)"); // Dark Navy Blue
        } else {
          grad.addColorStop(0, "rgba(255, 255, 255, 0.02)");
          grad.addColorStop(1, "rgba(10, 59, 117, 0.95)");
        }

        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E293B] selection:bg-[#39C6FC]/30 overflow-x-hidden relative font-sans">
      
      {/* 1. UPPER SECTION: Immersive Twilight Sky gradient zone */}
      <div className="relative bg-gradient-to-b from-[#0A3B75] via-[#105CA6] to-[#1E82E0] text-white pb-24">
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#FFFFFF] to-transparent pointer-events-none" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#39C6FC]/10 blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#1D82E0]/15 blur-[180px] pointer-events-none" />
        
        {/* Ambient backdrop canvas */}
        <canvas ref={backgroundCanvasRef} className="absolute inset-0 pointer-events-none -z-10" />

        {/* Premium Navbar */}
        <nav className="fixed top-0 inset-x-0 h-20 bg-[#0A3B75]/60 backdrop-blur-2xl border-b border-white/10 z-30 transition-all select-none">
          <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#39C6FC] to-[#1D82E0] flex items-center justify-center shadow-lg shadow-[#39C6FC]/20 border border-white/10">
                <Droplet className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-wider text-white">HydroBS</span>
                <span className="block text-[8px] tracking-widest text-[#39C6FC] uppercase font-bold">Smart Utility</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#39C6FC] to-[#1D82E0] text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-[#1D82E0]/20 transition-all hover:scale-105 border border-white/10"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero section */}
        <section className="relative pt-36 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <motion.div 
            style={{ opacity: textOpacity }}
            className="space-y-8 text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#39C6FC] text-xs font-semibold tracking-wider uppercase">
              <Waves className="w-3.5 h-3.5 animate-pulse" />
              Interactive Vector Mesh Ingestion
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-white uppercase">
              Smart Water Management <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39C6FC] via-[#F5FAFC] to-[#39C6FC]">
                for Smarter Communities.
              </span>
            </h1>

            <p className="max-w-xl text-md md:text-lg text-slate-200 leading-relaxed font-light">
              An intelligent enterprise utility dashboard. Monitor water telemetry in real-time, 
              detect leakages with statistical parameters, and automate community cost distribution.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#39C6FC] to-[#1D82E0] text-white font-bold rounded-xl shadow-xl shadow-[#1D82E0]/20 hover:shadow-[#39C6FC]/30 transition-all hover:scale-105 border border-white/10"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/register/admin"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/25 hover:border-[#39C6FC]/50 text-white rounded-xl transition-all"
              >
                Explore Platform
              </Link>
            </div>
          </motion.div>

          {/* 3D Morphing Canvas */}
          <div className="relative h-[400px] w-full flex items-center justify-center rounded-3xl bg-[#0A3B75]/40 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden">
            <div className="absolute top-4 left-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#39C6FC] animate-ping" />
              <span className="text-[10px] text-[#39C6FC] font-bold uppercase tracking-widest">Dynamic Particle Vector Grid</span>
            </div>
            <canvas ref={canvasRef} width={450} height={380} className="w-full h-full" />
            <div className="absolute bottom-6 flex justify-center w-full">
              <span className="text-[10px] text-slate-300 font-medium">Scroll down to morph particles</span>
            </div>
          </div>
        </section>

        {/* 2. Interactive Pipeline & Storytelling Section */}
        <section ref={storytellingRef} className="pt-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#39C6FC] text-xs font-bold uppercase border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> Interactive Scroll Story
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                One Water Droplet <br />
                Pulsing Through City Grids.
              </h2>
              <p className="text-slate-200 font-light leading-relaxed">
                As water flows from reservoir channels, HydroBS pipes monitor telemetry flow readings. 
                Data branches into apartment grids, enabling localized z-score computations to instantly notify flat residents.
              </p>

              <div className="space-y-4 pt-4 border-l border-white/15 pl-6">
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-white/10 text-[#39C6FC] flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <p className="text-xs text-slate-300 font-light"><strong className="text-white">Water Ingestion:</strong> Bulk municipal deliveries logged.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-white/10 text-[#39C6FC] flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <p className="text-xs text-slate-300 font-light"><strong className="text-white">Pipeline Branching:</strong> Telemetry flow parameters logged via CSV uploads.</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-6 w-6 rounded-full bg-white/10 text-[#39C6FC] flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <p className="text-xs text-slate-300 font-light"><strong className="text-white">Community Alert:</strong> High-usage anomalies trigger warnings.</p>
                </div>
              </div>
            </div>

            {/* Glowing Wireframe Pipeline simulation */}
            <div className="bg-[#0A3B75]/40 backdrop-blur-md border border-white/15 rounded-3xl p-8 shadow-2xl relative min-h-[380px] flex flex-col justify-between">
              <div className="absolute inset-0 bg-radial from-[#39C6FC]/5 via-transparent to-transparent -z-10" />
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Telemetry Pipe Grid</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase">
                  <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Telemetry
                </span>
              </div>

              {/* Glowing pipeline nodes */}
              <div className="grid grid-cols-4 gap-4 py-8">
                {[
                  { name: "Reservoir Node", color: "text-[#39C6FC] bg-white/10 border border-white/20" },
                  { name: "Main Feed", color: "text-[#39C6FC] bg-white/10 border border-[#39C6FC]/25" },
                  { name: "Slab Allocation", color: "text-slate-400 bg-white/5 border border-white/5" },
                  { name: "Flat Flow", color: "text-white bg-[#1D82E0]/40 border border-[#39C6FC]/20" }
                ].map((node, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-2xl text-center space-y-3 relative">
                    <div className="flex justify-center">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${node.color}`}>
                        <Cpu className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="block text-[9px] text-slate-300 font-bold uppercase">{node.name}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white/5 p-4 border border-white/10 rounded-2xl flex justify-between items-center text-xs">
                <span className="text-slate-300">Total Consumption:</span>
                <span className="font-mono text-[#39C6FC] font-bold">4,821,900 Litres</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. High-Fidelity Interface Review Carousel */}
        <section className="py-24 max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase border border-white/20">
              <Layers className="w-3.5 h-3.5" /> Unified Dashboard Layouts
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Integrated Console Views
            </h2>
            <p className="text-slate-200 font-light leading-relaxed">
              Explore tailored viewports that satisfy every stakeholder in the smart water ecosystem.
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex justify-center border-b border-white/10 max-w-lg mx-auto pb-px">
            {[
              { id: "super", label: "Super Admin" },
              { id: "admin", label: "Community Admin" },
              { id: "resident", label: "Resident" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePreviewTab(tab.id as any)}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all relative ${
                  activePreviewTab === tab.id 
                    ? "text-[#39C6FC] border-[#39C6FC]" 
                    : "text-slate-300 border-transparent hover:text-white"
                }`}
              >
                {tab.label}
                {activePreviewTab === tab.id && (
                  <motion.div 
                    layoutId="tabPreviewIndicator4"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-[#39C6FC]"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Dashboard View Panel */}
          <div className="max-w-5xl mx-auto bg-[#0A3B75]/40 backdrop-blur-md border border-white/15 rounded-3xl p-6 shadow-2xl relative min-h-[380px]">
            <div className="absolute inset-0 bg-radial from-[#39C6FC]/5 via-transparent to-transparent rounded-3xl pointer-events-none -z-10" />
            
            <AnimatePresence mode="wait">
              {activePreviewTab === "super" && (
                <motion.div
                  key="super"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white uppercase">Super Admin View</h4>
                      <p className="text-xs text-slate-300 font-light">Global community mappings and telemetry sync logs.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-white/10 text-[#39C6FC] text-xs font-bold rounded-full border border-white/20 uppercase">
                      Global Control
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Total Communities</span>
                      <p className="text-3xl font-black text-white">12 Registered</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Global Paid Bills</span>
                      <p className="text-3xl font-black text-emerald-400">₹8,42,000</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">System Health</span>
                      <p className="text-3xl font-black text-[#39C6FC]">100% Online</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === "admin" && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white uppercase">Community Admin Console</h4>
                      <p className="text-xs text-slate-300 font-light">Manage residents, upload indexes, audit pipelines.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-white/10 text-[#39C6FC] text-xs font-bold rounded-full border border-white/20 uppercase">
                      Estate Admin
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Active Billing Cycle</span>
                      <p className="text-2xl font-bold text-white">July 2026 Run</p>
                      <span className="inline-block text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">ACTIVE</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Pending Join Requests</span>
                      <p className="text-3xl font-black text-amber-500">3 Requests</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Bulk Tanks Logged</span>
                      <p className="text-3xl font-black text-white">4 Tankers</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activePreviewTab === "resident" && (
                <motion.div
                  key="resident"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6 text-left"
                >
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white uppercase">Resident Portal View</h4>
                      <p className="text-xs text-slate-300 font-light">Monitor household balance, download bills, review leak alerts.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20 uppercase">
                      Homeowner Flat 402
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Water Score Rank</span>
                      <p className="text-3xl font-black text-emerald-400">92 / 100</p>
                      <span className="text-[10px] text-slate-300">A+ Conservation Level</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Current Month Dues</span>
                      <p className="text-3xl font-black text-white">₹850.00</p>
                      <span className="text-[10px] text-slate-300">Invoice ready</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-2 shadow-inner">
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Consumption Today</span>
                      <p className="text-3xl font-black text-white">180 Litres</p>
                      <span className="text-[10px] text-slate-300">Community Avg: 210 L</span>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white">Z-Score Leak Alert Warning</p>
                      <p className="text-[11px] text-slate-200 leading-normal font-light">
                        We detected a statistical flow deviation (Z-score: 2.1) on your meter lines during night cycles. Please check internal pipes.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      {/* 2. LOWER SECTION: Clean Minimalist White Layout area */}
      <div className="bg-white text-[#1E293B] relative pb-28">
        
        {/* Subtle grid lines background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

        {/* 4. Water Conservation Scene */}
        <section className="py-24 relative text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1D82E0]/10 text-[#1D82E0] text-xs font-bold uppercase border border-[#1D82E0]/20">
              <Sparkles className="w-3.5 h-3.5" /> Ecological Action
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#0A3B75] uppercase leading-tight">
              Making Communities Greener, <br />
              One Drop at a Time.
            </h2>
            <p className="text-[#475569] font-light leading-relaxed max-w-2xl mx-auto">
              Toggle conservation mode to simulate leak detection. See how reducing water waste stabilized localized water levels and restored ecological balance.
            </p>

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setIsConservationActive(!isConservationActive)}
                className={`px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:scale-105 ${
                  isConservationActive 
                    ? "bg-[#1D82E0] text-white shadow-[#1D82E0]/20" 
                    : "bg-[#F8FAFC] text-[#475569] border border-slate-200"
                }`}
              >
                {isConservationActive ? "Leak Detection: ON (Stabilized)" : "Leak Detection: OFF (Unmitigated)"}
              </button>
            </div>

            {/* Simulated environmental layout */}
            <div className="mt-12 bg-[#F8FAFC] border border-slate-200 rounded-3xl p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-center items-center shadow-md">
              <div className="absolute inset-0 bg-radial from-[#39C6FC]/5 via-transparent to-transparent -z-10" />
              
              <AnimatePresence mode="wait">
                {isConservationActive ? (
                  <motion.div
                    key="active-conserve"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4 text-center"
                  >
                    <div className="flex justify-center">
                      <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/25">
                        <CheckCircle2 className="w-8 h-8 animate-pulse" />
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-[#0A3B75] uppercase">System Restored</h4>
                    <p className="text-xs text-emerald-600 font-light">Underground leakage fixed. Water table stabilized. Grid telemetry safe.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inactive-conserve"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-4 text-center"
                  >
                    <div className="flex justify-center">
                      <div className="h-14 w-14 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 border border-amber-500/25">
                        <AlertTriangle className="w-8 h-8 animate-bounce" />
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-[#0A3B75] uppercase">Wastage Detected</h4>
                    <p className="text-xs text-amber-600 font-light">Unresolved night flows indicating pipeline leakages on Flat 402 lines.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 5. Feature Grid */}
        <section className="py-24 max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1D82E0]/10 text-[#0A3B75] text-xs font-bold uppercase border border-[#1D82E0]/25">
              <Award className="w-3.5 h-3.5" /> Built for smart cities
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#0A3B75] uppercase leading-tight">
              Designed for smart communities
            </h2>
            <p className="text-[#475569] font-light leading-relaxed">
              HydroBS brings transparency, data consistency, and advanced metrics to modern estate management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, idx) => (
              <div 
                key={f.title}
                className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-[#1D82E0]/40 transition-all hover:-translate-y-1 duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-lg shadow-slate-200/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC]/50 via-transparent to-transparent pointer-events-none -z-10" />
                
                <div className="space-y-4 text-left">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-lg shadow-[#1D82E0]/10`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0A3B75] group-hover:text-[#1D82E0] transition-colors uppercase">{f.title}</h3>
                  <p className="text-xs text-[#475569] leading-relaxed font-light">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Action CTA Section */}
        <section className="py-12 max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#0A3B75] to-[#1E82E0] border border-[#1D82E0]/20 p-8 md:p-16 rounded-3xl text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#39C6FC]/40 to-transparent" />
            <div className="absolute inset-0 bg-[#39C6FC]/5 blur-3xl -z-10 pointer-events-none" />
            
            <div className="max-w-2xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase leading-tight">
                Transform Water Management <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39C6FC] to-[#FFFFFF]">
                  into Smart Management.
                </span>
              </h2>
              <p className="text-slate-100 font-light leading-relaxed">
                Experience transparent utility, cost allocation, and water conservation in one unified console.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#39C6FC] to-[#1D82E0] text-white font-bold rounded-xl shadow-lg shadow-[#1D82E0]/20 hover:scale-105 transition-all"
                >
                  Launch Platform
                </Link>
                <Link
                  to="/register/admin"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/20 hover:border-[#39C6FC]/45 text-white rounded-xl transition hover:bg-white/20"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-[#F8FAFC] py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#1D82E0] to-[#0A3B75] flex items-center justify-center border border-white/10">
              <Droplet className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="text-md font-bold tracking-wider text-[#0A3B75]">HydroBS</span>
              <span className="block text-[8px] tracking-widest text-[#1D82E0] uppercase font-bold">Smart Utility</span>
            </div>
          </div>

          <div className="flex justify-center gap-8 text-xs font-semibold text-[#1D82E0]">
            <Link to="/login" className="hover:text-[#0A3B75] transition">Sign In</Link>
            <Link to="/register/resident" className="hover:text-[#0A3B75] transition">Join Community</Link>
            <Link to="/register/admin" className="hover:text-[#0A3B75] transition">Create Community</Link>
          </div>

          <div className="text-center md:text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            © 2026 HydroBS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
