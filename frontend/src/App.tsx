import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import StravaAuth from './components/StravaAuth';
import StravaCallback from './components/StravaCallback';
import SignIn from './components/SignIn';
import Settings from './components/Settings';
import DataManagement from './components/DataManagement';
import { Toaster } from 'react-hot-toast';
import { TooltipProvider } from './components/ui/tooltip';
import DataSources from './components/DataSources';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authInitialized) {
    return <div>Initializing...</div>;
  }

  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <TooltipProvider>
        <Router>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={<div>Dashboard error</div>}>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={<div>Dashboard error</div>}>
                    <Dashboard />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={<div>Settings error</div>}>
                    <Settings />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route path="/strava-auth" element={<StravaAuth />} />
            <Route path="/strava-callback" element={<StravaCallback />} />
            <Route
              path="/data-management"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={<div>Data Management Error</div>}>
                    <DataManagement />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-sources"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={<div>Data Sources error</div>}>
                    <DataSources />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-management/:dataSourceId"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={<div>Data Management error</div>}>
                    <DataManagement />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/connect/:dataSourceId"
              element={
                <ProtectedRoute>
                  <ErrorBoundary fallback={<div>Settings error</div>}>
                    <Settings />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </TooltipProvider>
    </ErrorBoundary>
  );
};

export default App;