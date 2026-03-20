import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Splash from './pages/Splash';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Signup from './pages/Auth/Signup';
import AdminSignup from './pages/Auth/AdminSignup';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCameras from './pages/Admin/Cameras';
import AdminViolations from './pages/Admin/Violations';
import AdminChallans from './pages/Admin/Challans';
import AdminStatistics from './pages/Admin/Statistics';
import LiveStream from './pages/Admin/LiveStream';
import Reports from './pages/Admin/Reports';
import ReportDetails from './pages/Admin/ReportDetails';
import AdminProfile from './pages/Admin/Profile';
import UserDashboard from './pages/User/Dashboard';
import MyChallans from './pages/User/MyChallans';
import ChallanDetails from './pages/User/ChallanDetails';
import ReportChallan from './pages/User/ReportChallan';
import PaymentHistory from './pages/User/PaymentHistory';
import Payment from './pages/User/Payment';
import Profile from './pages/User/Profile';
import Support from './pages/User/Support';
import NotFound from './pages/NotFound';
import PlaceholderPage from './components/PlaceholderPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  return (
    <div className="app-container">
      <Routes>

        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin-signup" element={<AdminSignup />} />

        {/* Payment Route */}
        <Route path="/payment" element={
          <ProtectedRoute role="user">
            <DashboardLayout role="user" />
          </ProtectedRoute>
        }>
          <Route path=":challanId" element={<Payment />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="cameras" element={<AdminCameras />} />
          <Route path="camera/:id/stream" element={<LiveStream />} />
          <Route path="violations" element={<AdminViolations />} />
          <Route path="challans" element={<AdminChallans />} />
          <Route path="reports" element={<Reports />} />
          <Route path="report/:id" element={<ReportDetails />} />
          <Route path="stats" element={<AdminStatistics />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* User Routes */}
        <Route path="/user" element={
          <ProtectedRoute role="user">
            <DashboardLayout role="user" />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="challans" element={<MyChallans />} />
          <Route path="challan/:id" element={<ChallanDetails />} />
          <Route path="challan/:id/report" element={<ReportChallan />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="support" element={<Support />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
