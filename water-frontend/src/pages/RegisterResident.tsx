import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  registerResidentSchema,
  type RegisterResidentFormValues,
} from "@/lib/validation";

import { api } from "@/lib/axios";

export default function RegisterResident() {
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterResidentFormValues>({
    resolver: zodResolver(registerResidentSchema),
  });

  const onSubmit = async (values: RegisterResidentFormValues) => {
    setServerError("");

    try {
      await api.post("/api/auth/register-resident", values);

      navigate("/login", {
        state: {
          registered: true,
        },
      });
    } catch (err: any) {
      setServerError(err.response?.data ?? "Registration failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-400 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/30 bg-white/15 backdrop-blur-xl shadow-2xl p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <UserPlus className="h-6 w-6 text-white" />
          </div>

          <h1 className="text-2xl font-semibold text-white">
            Join HydroBS
          </h1>

          <p className="text-sm text-white/70">
            Create your resident account
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Label className="text-white">
              Full Name
            </Label>

            <Input
              placeholder="Rahul Sharma"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              {...register("fullName")}
            />

            {errors.fullName && (
              <p className="text-xs text-red-200 mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <Label className="text-white">
              Email
            </Label>

            <Input
              type="email"
              placeholder="rahul@gmail.com"
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
            <Label className="text-white">
              Password
            </Label>

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

          {serverError && (
            <p className="text-center text-xs text-red-200">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-blue-700 hover:bg-white/90"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-white/70">
          Already have an account?{" "}
          <Link
            to="/login"
            className="underline hover:text-white"
          >
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}