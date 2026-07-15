import { Navigate, Outlet } from "react-router-dom"
import { getRole, getToken } from "@/lib/auth"

export default function ProtectedRoute({ allowedRole }: { allowedRole: "SUPER_ADMIN" | "ADMIN" | "RESIDENT" }) {
  const token = getToken()
  const role = getRole()
  if (!token) return <Navigate to="/login" replace />
  if (role !== allowedRole && !(allowedRole === "ADMIN" && role === "SUPER_ADMIN")) return <Navigate to="/login" replace />
  return <Outlet />
}