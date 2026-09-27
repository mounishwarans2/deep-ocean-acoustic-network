import { Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './pages/ProtectedRoute';
import SystemFailurePage from './pages/SystemFailurePage';
import { DashboardSettingsProvider } from './hooks/useDashboardSettings';
import './App.css';

export default function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard/*" element={<ProtectedRoute><DashboardSettingsProvider><Dashboard onNavigate={(path) => navigate(path)} /></DashboardSettingsProvider></ProtectedRoute>} />
      <Route path="/system-failure" element={<ProtectedRoute><SystemFailurePage /></ProtectedRoute>} />
    </Routes>
  );
}
