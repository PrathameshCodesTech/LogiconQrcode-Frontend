import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import AdminLayout from './components/admin/AdminLayout';
import ApplyPage from './pages/ApplyPage';
import CampaignsPage from './pages/admin/CampaignsPage';
import LoginPage from './pages/admin/LoginPage';
import SubmissionDetailPage from './pages/admin/SubmissionDetailPage';
import SubmissionsPage from './pages/admin/SubmissionsPage';
import { isAuthenticated } from './utils/auth';

function InvalidLink() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="fixed right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="max-w-sm text-center">
        <h1 className="mb-2 text-xl font-bold">Invalid Application Link</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This URL is not a valid job application link. Please scan the QR code provided at your
          hiring location.
        </p>
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/horizon-admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/apply/:token" element={<ApplyPage />} />
        <Route path="/" element={<InvalidLink />} />

        {/* Admin auth */}
        <Route path="/admin/login" element={<Navigate to="/horizon-admin/login" replace />} />
        <Route path="/horizon-admin/login" element={<LoginPage />} />

        {/* Protected admin */}
        <Route
          path="/horizon-admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="submissions" replace />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="submissions/:id" element={<SubmissionDetailPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
        </Route>

        <Route path="/admin/*" element={<Navigate to="/horizon-admin" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
