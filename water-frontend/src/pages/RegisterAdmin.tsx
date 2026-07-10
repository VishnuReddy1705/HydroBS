import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerAdminSchema, type RegisterAdminFormValues } from "@/lib/validation"
import { api } from "@/lib/axios"

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
      setServerError(err.response?.data ?? "Registration failed")
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/30 bg-white/15 backdrop-blur-xl shadow-2xl p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Create Community</h1>
          <p className="text-sm text-white/70">Set yourself up as the community admin</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div className="space-y-1.5">
            <Label htmlFor="fullName" className="text-white/90">Your Name</Label>
            <Input id="fullName" placeholder="Priya Sharma" autoComplete="off"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-red-200">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/90">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="off"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              {...register("email")} />
            {errors.email && <p className="text-xs text-red-200">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/90">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" autoComplete="new-password"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              {...register("password")} />
            {errors.password && <p className="text-xs text-red-200">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="communityName" className="text-white/90">Community Name</Label>
            <Input id="communityName" placeholder="Green Valley Apartments" autoComplete="off"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              {...register("communityName")} />
            {errors.communityName && <p className="text-xs text-red-200">{errors.communityName.message}</p>}
          </div>

          {serverError && <p className="text-xs text-red-200 text-center">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting}
            className="w-full bg-white text-blue-700 hover:bg-white/90 font-medium">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Community"}
          </Button>
        </form>

        <p className="text-center text-xs text-white/70 mt-5">
          Already have an account? <Link to="/login" className="underline hover:text-white">Log in</Link>
        </p>
      </motion.div>
    </div>
  )
}