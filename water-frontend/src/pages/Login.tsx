import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplet, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginSchema, type LoginFormValues } from "@/lib/validation";
import { api } from "@/lib/axios";
import { getMe } from "@/lib/community";
import { saveSession } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("");

    try {
      // Login
      const { data } = await api.post("/api/auth/login", values);

      // Save JWT properly
      saveSession(data.token, data.role, data.fullName);

      // Get logged-in user
      const me = await getMe();

      // Redirect
      switch (me.role) {
        case "ADMIN":
          navigate("/admin-dashboard");
          break;

        case "RESIDENT":
          navigate("/resident-dashboard");
          break;

        case "SUPER_ADMIN":
          // Temporary until we build the Super Admin dashboard
          navigate("/admin-dashboard");
          break;

        default:
          navigate("/login");
      }
    } catch (err: any) {
      setServerError(err.response?.data ?? "Invalid email or password");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-400 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/30 bg-white/15 backdrop-blur-xl shadow-2xl p-8"
      >
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Droplet className="h-6 w-6 text-white" />
          </div>

          <h1 className="text-2xl font-semibold text-white">
            HydroBS
          </h1>

          <p className="text-xs text-white/70 mt-1">
            Smart Water Intelligence Platform
          </p>
        </div>

        {location.state?.registered && (
          <div className="mb-4 rounded-lg border border-green-400/40 bg-green-500/20 p-3 text-center text-sm text-green-100">
            Account created successfully. Please log in.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div>
            <Label className="text-white">Email</Label>

            <Input
              type="email"
              placeholder="you@example.com"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              {...register("email")}
            />

            {errors.email && (
              <p className="text-xs text-red-200 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-white">Password</Label>

            <Input
              type="password"
              placeholder="••••••••"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              {...register("password")}
            />

            {errors.password && (
              <p className="text-xs text-red-200 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-white/70 hover:text-white"
            >
              Forgot Password?
            </button>
          </div>

          {serverError && (
            <p className="text-center text-xs text-red-200">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-blue-700 hover:bg-white/90 h-10"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>

          <div className="relative flex justify-center">
            <span className="bg-transparent px-2 text-xs uppercase text-white/60">
              or
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Link to="/register/admin">
              Create Community
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
          >
            <Link to="/register/resident">
              Join Community
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}