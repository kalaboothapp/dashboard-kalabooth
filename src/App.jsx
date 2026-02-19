import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { AlertProvider } from './context/AlertContext';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import NotFound from './pages/NotFound';

// Lazy load admin pages
const FrameManager = lazy(() => import('./pages/admin/FrameManager'));
const CampaignManager = lazy(() => import('./pages/admin/CampaignManager'));
const FrameEditor = lazy(() => import('./pages/admin/FrameEditor'));
const LinkManager = lazy(() => import('./pages/admin/LinkManager'));
const FilterManager = lazy(() => import('./pages/admin/FilterManager'));
const LetterManager = lazy(() => import('./pages/admin/LetterManager'));
const Login = lazy(() => import('./pages/Login'));

// Simple Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center font-titan text-white text-xl animate-pulse bg-[#02124d]">
    Loading Admin Panel...
  </div>
);

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Main App Layout (Protected) */}
              <Route element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route path="/" element={<FrameManager />} />
                <Route path="/campaigns" element={<CampaignManager />} />
                <Route path="/frames/new" element={<FrameEditor />} />
                <Route path="/frames/edit/:id" element={<FrameEditor />} />
                <Route path="/links" element={<LinkManager />} />
                <Route path="/filters" element={<FilterManager />} />
                <Route path="/letters" element={<LetterManager />} />
              </Route>

              <Route path="/login" element={<Login />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
