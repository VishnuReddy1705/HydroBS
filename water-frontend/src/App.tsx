import { Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "@/pages/LandingPage"
import Login from "@/pages/Login"
import RegisterAdmin from "@/pages/RegisterAdmin"
import RegisterResident from "@/pages/RegisterResident"
import SuperAdminDashboard from "@/pages/SuperAdminDashboard"
import AdminDashboard from "@/pages/AdminDashboard"
import ResidentDashboard from "@/pages/ResidentDashboard"
import ProtectedRoute from "@/components/ProtectedRoute"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register/admin" element={<RegisterAdmin />} />
      <Route path="/register/resident" element={<RegisterResident />} />

      <Route element={<ProtectedRoute allowedRole="SUPER_ADMIN" />}>
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRole="RESIDENT" />}>
        <Route path="/resident/dashboard" element={<ResidentDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}