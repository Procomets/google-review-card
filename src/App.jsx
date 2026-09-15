import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import AuthPage from './pages/AuthPage.jsx';
import PublicFeedbackPage from './pages/PublicFeedbackPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/" element={<AuthPage />} />
        
        {/* Public Feedback Route */}
        <Route path="/f/:slug" element={<PublicFeedbackPage />} />
        
        {/* Admin Dashboard Routes */}
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
