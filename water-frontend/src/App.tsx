import { Routes, Route, Navigate, useParams } from "react-router-dom"
import LandingPage from "@/pages/LandingPage"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import SuperAdminDashboard from "@/pages/SuperAdminDashboard"
import AdminDashboard from "@/pages/AdminDashboard"
import ResidentDashboard from "@/pages/ResidentDashboard"
import ProtectedRoute from "@/components/ProtectedRoute"

import ForgotPassword from "@/pages/ForgotPassword"
import ResetPassword from "@/pages/ResetPassword"
import ResidentDetails from "@/pages/ResidentDetails"
import MeterReadingsPage from "@/pages/MeterReadingsPage"
import TariffSettingsPage from "@/pages/TariffSettingsPage"
import BillPreviewPage from "@/pages/BillPreviewPage"
import BillingDashboard from "@/pages/BillingDashboard"
import BillingCycleManager from "@/pages/BillingCycleManager"
import { Toaster } from "sonner"

const SuperAdminResidentRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/super-admin/dashboard?tab=residents&id=${id}`} replace />;
};

const AdminResidentRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/admin/dashboard?tab=residents&id=${id}`} replace />;
};

export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/admin" element={<Navigate to="/register" replace />} />
        <Route path="/register/resident" element={<Navigate to="/register" replace />} />

        <Route element={<ProtectedRoute allowedRole="SUPER_ADMIN" />}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/dashboard/*" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/residents/:id" element={<SuperAdminResidentRedirect />} />
          <Route path="/super-admin/billing-dashboard" element={<BillingDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/dashboard/*" element={<AdminDashboard />} />

          {/* Redirects for legacy standalone routes to avoid breaking bookmarks or hardcoded navs */}
          <Route path="/admin/residents/:id" element={<AdminResidentRedirect />} />
          <Route path="/admin/billing/:id" element={<Navigate to="/admin/dashboard/billing/:id" replace />} />
          <Route path="/admin/meters" element={<Navigate to="/admin/dashboard/water-usage" replace />} />
          <Route path="/admin/readings" element={<Navigate to="/admin/dashboard/meter-readings" replace />} />
          <Route path="/admin/water-analytics" element={<Navigate to="/admin/dashboard/visualizations" replace />} />
          <Route path="/admin/billing-settings" element={<Navigate to="/admin/dashboard/tariff-plans" replace />} />
          <Route path="/admin/billing" element={<Navigate to="/admin/dashboard/billing" replace />} />
          <Route path="/admin/billing-dashboard" element={<BillingDashboard />} />
          <Route path="/admin/bulk-purchases" element={<Navigate to="/admin/dashboard/water-purchase" replace />} />
          <Route path="/admin/billing-cycles" element={<Navigate to="/admin/dashboard/billing-cycles" replace />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="RESIDENT" />}>
          <Route path="/resident/dashboard" element={<ResidentDashboard />} />
          <Route path="/resident/dashboard/*" element={<ResidentDashboard />} />
          <Route path="/resident/profile" element={<Navigate to="/resident/dashboard/profile" replace />} />
          <Route path="/resident/billing/:id" element={<Navigate to="/resident/dashboard/billing/:id" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}