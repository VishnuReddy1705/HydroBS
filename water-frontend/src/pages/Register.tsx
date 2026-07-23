import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, Loader2, ArrowLeft, Droplet, User, Mail, Lock, 
  Building, ChevronRight, Search, X, ChevronDown, Check
} from "lucide-react"
import axios from "axios"
import { api } from "@/lib/axios"
import { saveSession } from "@/lib/auth"
import { getErrorMessage } from "../utils/error"
import { toast } from "sonner"

interface CommunityItem {
  id: number
  name: string
}

export default function Register() {
  const navigate = useNavigate()
  
  // Steps: 1 = Choose Role, 2 = Info details
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<"RESIDENT" | "ADMIN" | null>(null)
  
  // Registration States
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Admin specific
  const [communityName, setCommunityName] = useState("")

  // Resident specific
  const [communities, setCommunities] = useState<CommunityItem[]>([])
  const [selectedCommunityId, setSelectedCommunityId] = useState<number | "">("")
  const [flatNumber, setFlatNumber] = useState("")
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")

  // Fetch real-time communities created by Super Admin / Community Admins from database
  const fetchCommunities = async () => {
    try {
      const res = await api.get("/api/communities/public")
      if (res.data && Array.isArray(res.data)) {
        setCommunities(res.data)
      }
    } catch (err) {
      console.error("Failed to load real-time communities from database:", err)
    }
  }

  useEffect(() => {
    fetchCommunities()
  }, [role, step])

  const handleNextStep = () => {
    if (!role) {
      toast.error("Please select your account role to proceed.")
      return
    }
    setStep(2)
  }

  const handleBackStep = () => {
    setStep(1)
    setServerError("")
  }

  const validateForm = () => {
    if (!fullName.trim() || fullName.length < 2) return "Please enter your full name (minimum 2 characters)."
    if (!email.trim() || !email.includes("@")) return "Please enter a valid email address."
    if (password.length < 8) return "Password must be at least 8 characters long."
    if (password !== confirmPassword) return "Passwords do not match."
    
    if (role === "ADMIN") {
      if (!communityName.trim()) return "Community name is required."
    } else {
      if (!selectedCommunityId) return "Please select your community."
      if (!flatNumber.trim()) return "Flat number is required."
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    
    const errorMsg = validateForm()
    if (errorMsg) {
      setServerError(errorMsg)
      toast.error(errorMsg)
      return
    }

    setLoading(true)
    try {
      if (role === "ADMIN") {
        const payload = {
          fullName,
          email,
          password,
          communityName
        }
        const res = await api.post("/api/auth/register-admin", payload)
        saveSession(res.data.token, res.data.refreshToken, res.data.role, res.data.fullName || 'User')
        toast.success("Community & Admin registered successfully!")
        navigate("/admin/dashboard")
      } else {
        const payload = {
          fullName,
          email,
          password,
          flatNumber,
          communityId: Number(selectedCommunityId)
        }
        const res = await api.post("/api/auth/register-resident", payload)
        saveSession(res.data.token, res.data.refreshToken, res.data.role, res.data.fullName || 'User')
        toast.success("Resident account created successfully!")
        navigate("/resident/dashboard")
      }
    } catch (err: any) {
      const msg = getErrorMessage(err)
      setServerError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const bubbles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 40 + 10,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 8,
    duration: Math.random() * 6 + 6,
  }))

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-tr from-[#0b1b3d] via-[#0f2954] to-[#173e75] flex items-center justify-center px-4 py-8 select-none font-sans">
      
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

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="h-14 w-14 bg-gradient-to-br from-[#48CAE4] to-[#00B4D8] rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
            <Droplet className="h-7 w-7 text-white fill-white/10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-3">HydroBS</h1>
        </div>

        <div className={`rounded-[28px] p-8 md:p-10 shadow-2xl backdrop-blur-2xl border transition-all ${
          step === 2 ? "bg-white border-slate-200" : "bg-white/10 border-white/20 glass-morphic"
        }`}>
          
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex flex-col mb-4">
                  <h2 className="text-2xl font-bold text-white">Create Account</h2>
                  <p className="text-sm text-slate-300">Step 1: Choose your user dashboard role</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Resident Option */}
                  <div 
                    onClick={() => setRole("RESIDENT")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                      role === "RESIDENT" 
                        ? "bg-[#00B4D8]/20 border-[#00B4D8] text-white" 
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#48CAE4] to-[#00B4D8] flex items-center justify-center text-white shrink-0 shadow-md">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="font-bold text-white uppercase text-sm">Join as Resident</h4>
                      <p className="text-xs text-slate-300 font-light leading-relaxed">Join your apartment community, monitor household flow rates, and pay monthly bills.</p>
                    </div>
                  </div>

                  {/* Admin Option */}
                  <div 
                    onClick={() => setRole("ADMIN")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 ${
                      role === "ADMIN" 
                        ? "bg-[#00B4D8]/20 border-[#00B4D8] text-white" 
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#0B3A63] flex items-center justify-center text-white shrink-0 shadow-md">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="font-bold text-white uppercase text-sm">Create Community Admin</h4>
                      <p className="text-xs text-slate-300 font-light leading-relaxed">Register a new community, configure water tariffs, and handle resident bill allocations.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] text-white font-bold py-3.5 rounded-2xl transition-all text-sm tracking-wide mt-4 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-slate-900"
              >
                <div className="flex items-center gap-2 mb-4">
                  <button 
                    onClick={handleBackStep}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">Enter Details</h2>
                    <p className="text-xs font-semibold text-slate-500">Step 2: Complete profile credentials</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                  
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-900 tracking-wider uppercase pl-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                      <input 
                        type="text" 
                        placeholder="Ravi Kumar"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-900 tracking-wider uppercase pl-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                      <input 
                        type="email" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* ADMIN Specific: Community details */}
                  {role === "ADMIN" && (
                    <>
                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-900 tracking-wider uppercase pl-1">Community Name</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Green Glen Apartments"
                            value={communityName}
                            onChange={(e) => setCommunityName(e.target.value)}
                            className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition-all font-bold"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* RESIDENT Specific: Searchable Community Select & Flat Number */}
                  {role === "RESIDENT" && (
                    <>
                      <div className="space-y-1 relative">
                        <label className="block text-xs font-extrabold text-slate-900 tracking-wider uppercase pl-1">Select Community</label>
                        <div 
                          onClick={() => setIsCommunityModalOpen(true)}
                          className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl pl-11 pr-10 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition-all font-bold cursor-pointer flex items-center justify-between relative"
                        >
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                          <span className={selectedCommunityId ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                            {communities.find(c => c.id === selectedCommunityId)?.name || "Choose Community..."}
                          </span>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-extrabold text-slate-900 tracking-wider uppercase pl-1">Flat Number</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="Flat 402"
                            value={flatNumber}
                            onChange={(e) => setFlatNumber(e.target.value)}
                            className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition-all font-bold"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Password field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-900 tracking-wider uppercase pl-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Password field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-900 tracking-wider uppercase pl-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-100 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-2xl pl-11 pr-4 py-2.5 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Server error feedback */}
                  <AnimatePresence>
                    {serverError && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-rose-600 font-bold text-center pl-1 pt-1"
                      >
                        ⚠️ {serverError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#00B4D8] to-[#0F4C81] hover:from-[#48CAE4] hover:to-[#00B4D8] text-white font-bold py-3.5 rounded-2xl shadow-[0_8px_25px_rgba(0,180,216,0.35)] transition-all text-sm tracking-wide mt-4 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Complete Registration"}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-xs text-slate-600 mt-6 font-medium">
            Already have an account? <Link to="/login" className="underline text-[#00B4D8] hover:text-[#0F4C81] font-extrabold">Log in</Link>
          </p>
        </div>
      </motion.div>

      {/* Community Search Popup Modal */}
      <AnimatePresence>
        {isCommunityModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsCommunityModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#00B4D8]" />
                  <h3 className="text-lg font-extrabold text-slate-900">Select Community</h3>
                </div>
                <button 
                  onClick={() => setIsCommunityModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search community name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8] font-medium"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Community List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {communities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                  communities
                    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCommunityId(c.id);
                          setIsCommunityModalOpen(false);
                          setSearchQuery("");
                        }}
                        className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                          selectedCommunityId === c.id 
                            ? "bg-[#00B4D8]/10 text-[#0F4C81] font-bold border border-[#00B4D8]/30" 
                            : "hover:bg-slate-100 text-slate-800 font-medium"
                        }`}
                      >
                        <span>{c.name}</span>
                        {selectedCommunityId === c.id && <Check className="h-4 w-4 text-[#00B4D8]" />}
                      </div>
                    ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No matching communities found
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
