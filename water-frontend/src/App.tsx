import { Routes, Route, Navigate } from "react-router-dom"
import LandingPage from "@/pages/LandingPage"
import Login from "@/pages/Login"
import RegisterAdmin from "@/pages/RegisterAdmin"
import RegisterResident from "@/pages/RegisterResident"
import SuperAdminDashboard from "@/pages/SuperAdminDashboard"
import AdminDashboard from "@/pages/AdminDashboard"
import ResidentDashboard from "@/pages/ResidentDashboard"
import ProtectedRoute from "@/components/ProtectedRoute"

import ForgotPassword from "@/pages/ForgotPassword"
import ResetPassword from "@/pages/ResetPassword"
import ResidentProfilePage from "@/pages/ResidentProfilePage"
import ResidentDetails from "@/pages/ResidentDetails"
import MeterManagementPage from "@/pages/MeterManagementPage"
import MeterReadingsPage from "@/pages/MeterReadingsPage"
import WaterAnalyticsPage from "@/pages/WaterAnalyticsPage"
import TariffSettingsPage from "@/pages/TariffSettingsPage"
import BillManagementPage from "@/pages/BillManagementPage"
import BillPreviewPage from "@/pages/BillPreviewPage"
import BillingDashboard from "@/pages/BillingDashboard"
import BulkPurchasePage from "@/pages/BulkPurchasePage"
import BillingCycleManager from "@/pages/BillingCycleManager"
import { Toaster } from "sonner"

export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" closeButton />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/register/admin" element={<RegisterAdmin />} />
        <Route path="/register/resident" element={<RegisterResident />} />

        <Route element={<ProtectedRoute allowedRole="SUPER_ADMIN" />}>
          <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/super-admin/residents/:id" element={<ResidentDetails />} />
          <Route path="/super-admin/billing-dashboard" element={<BillingDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/residents/:id" element={<ResidentDetails />} />
          <Route path="/admin/meters" element={<MeterManagementPage />} />
          <Route path="/admin/readings" element={<MeterReadingsPage />} />
          <Route path="/admin/water-analytics" element={<WaterAnalyticsPage />} />
          <Route path="/admin/billing-settings" element={<TariffSettingsPage />} />
          <Route path="/admin/billing" element={<BillManagementPage />} />
          <Route path="/admin/billing/:id" element={<BillPreviewPage />} />
          <Route path="/admin/billing-dashboard" element={<BillingDashboard />} />
          <Route path="/admin/bulk-purchases" element={<BulkPurchasePage />} />
          <Route path="/admin/billing-cycles" element={<BillingCycleManager />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="RESIDENT" />}>
          <Route path="/resident/dashboard" element={<ResidentDashboard />} />
          <Route path="/resident/profile" element={<ResidentProfilePage />} />
          <Route path="/resident/billing/:id" element={<BillPreviewPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}