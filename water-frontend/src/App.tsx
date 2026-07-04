import { Routes, Route, Navigate } from "react-router-dom";

import Login from "@/pages/Login";
import RegisterCommunityAdmin from "@/pages/RegisterCommunityAdmin";
import RegisterResident from "@/pages/RegisterResident";

import AdminDashboard from "@/pages/AdminDashboard";
import ResidentDashboard from "@/pages/ResidentDashboard";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <Routes>

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Authentication */}
      <Route path="/login" element={<Login />} />
      <Route path="/register/admin" element={<RegisterCommunityAdmin />} />
      <Route path="/register/resident" element={<RegisterResident />} />

      {/* Admin Dashboard */}
      <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        />
      </Route>

      {/* Resident Dashboard */}
      <Route element={<ProtectedRoute allowedRole="RESIDENT" />}>
        <Route
          path="/resident-dashboard"
          element={<ResidentDashboard />}
        />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}