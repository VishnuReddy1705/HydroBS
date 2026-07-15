import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Building2, Loader2, ArrowLeft, Droplet, User, Mail, Lock } from "lucide-react"
import { registerAdminSchema, type RegisterAdminFormValues } from "@/lib/validation"
import { api } from "@/lib/axios"
import { getErrorMessage } from "../utils/error"

export default function RegisterAdmin() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<RegisterAdminFormValues>({ resolver: zodResolver(registerAdminSchema) })

  const onSubmit = async (values: RegisterAdminFormValues) => {
    setServerError("")
    try {
      await api.post("/api/auth/register-admin", values)
      navigate("/login", { state: { registered: true } })
    } catch (err: any) {
      setServerError(getErrorMessage(err, "Registration failed"))
    }
  }

  const bubbles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 20 + 8,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 6,
  }));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-tr from-[#0b1b3d] via-[#0f2954] to-[#173e75] flex items-center justify-center px-4 py-8 select-none">
      
      {/* Floating Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="water-bubble"
            style={{
              left: b.left,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animation: `riseUp ${b.duration}s infinite linear`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Overlapping Waves at bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 pointer-events-none opacity-30">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-[200%] h-[140px] fill-[#00B4D8] animate-[waveFlow_25s_linear_infinite]">
          <path d="M0,50 C300,90 600,30 900,80 C1200,120 1500,40 1800,60 L1800,120 L0,120 Z" />
        </svg>
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 block w-[200%] h-[110px] fill-[#0F4C81] animate-[waveFlow_15s_linear_infinite_reverse]">
          <path d="M0,30 C300,70 600,10 900,60 C1200,100 1500,20 1800,40 L1800,120 L0,120 Z" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[460px]"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 bg-gradient-to-br from-[#48CAE4] to-[#00B4D8] rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
            <Droplet className="h-7 w-7 text-white fill-white/10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-3">HydroBS</h1>
        </div>

        <div className="glass-morphic bg-white/10 border border-white/20 rounded-[28px] p-8 md:p-10 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col mb-6">
            <h2 className="text-2xl font-bold text-white">Create Community</h2>
            <p className="text-sm text-slate-300">Set yourself up as the community admin</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
            <div className="space-y-1">
              <label htmlFor="fullName" className="block text-xs font-bold text-slate-300 tracking-wider uppercase pl-1">Your Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input id="fullName" placeholder="Priya Sharma" autoComplete="off"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:bg-[#0b1b3d]/50 transition-all font-medium"
                  {...register("fullName")} />
              </div>
              {errors.fullName && <p className="text-xs text-rose-300 font-semibold pl-1">⚠️ {errors.fullName.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="block text-xs font-bold text-slate-300 tracking-wider uppercase pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input id="email" type="email" placeholder="you@example.com" autoComplete="off"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:bg-[#0b1b3d]/50 transition-all font-medium"
                  {...register("email")} />
              </div>
              {errors.email && <p className="text-xs text-rose-300 font-semibold pl-1">⚠️ {errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 tracking-wider uppercase pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input id="password" type="password" placeholder="••••••••" autoComplete="new-password"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:bg-[#0b1b3d]/50 transition-all font-medium"
                  {...register("password")} />
              </div>
              {errors.password && <p className="text-xs text-rose-300 font-semibold pl-1">⚠️ {errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label htmlFor="communityName" className="block text-xs font-bold text-slate-300 tracking-wider uppercase pl-1">Community Name</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input id="communityName" placeholder="Golden Treasure Apartments" autoComplete="off"
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl pl-11 pr-4 py-3 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:bg-[#0b1b3d]/50 transition-all font-medium"
                  {...register("communityName")} />
              </div>
              {errors.communityName && <p className="text-xs text-rose-300 font-semibold pl-1">⚠️ {errors.communityName.message}</p>}
            </div>

            <AnimatePresence>
              {serverError && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-rose-300 font-bold text-center pl-1 pt-1"
                >
                  ⚠️ {serverError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] text-white font-bold py-3.5 rounded-2xl shadow-[0_8px_25px_rgba(0,180,216,0.35)] transition-all text-sm tracking-wide mt-4 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Community"}
            </motion.button>
          </form>

          <p className="text-center text-xs text-slate-300 mt-6 font-medium">
            Already have an admin account? <Link to="/login" className="underline text-[#48CAE4] hover:text-[#00B4D8] font-bold">Log in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}