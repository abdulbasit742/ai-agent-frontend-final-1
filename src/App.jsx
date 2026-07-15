import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Bot, Home, Loader2 } from 'lucide-react';

import { Button } from './components/ui/button';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { authAPI, apiUtils, tokenManager } from './services/api';
import './App.css';

function FullPageLoader() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6" aria-busy="true">
      <div className="text-center" role="status" aria-live="polite">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" aria-hidden="true" />
        <p className="font-medium text-gray-900">Loading AI Agent System</p>
        <p className="text-sm text-gray-500 mt-1">Checking your session securely…</p>
      </div>
    </main>
  );
}

function ProtectedRoute({ authState, children }) {
  if (authState === 'loading') return <FullPageLoader />;
  if (authState !== 'authenticated') return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ authState, children }) {
  if (authState === 'loading') return <FullPageLoader />;
  if (authState === 'authenticated') return <Navigate to="/dashboard" replace />;
  return children;
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Bot className="h-6 w-6 text-blue-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-600">The page may have moved or the address may be incorrect.</p>
        <Button className="mt-6" onClick={() => navigate(apiUtils.isAuthenticated() ? '/dashboard' : '/login')}>
          <Home className="mr-2 h-4 w-4" aria-hidden="true" />
          Return to the app
        </Button>
      </section>
    </main>
  );
}

function App() {
  const [authState, setAuthState] = useState('loading');

  const validateSession = useCallback(async () => {
    if (!apiUtils.isAuthenticated()) {
      setAuthState('anonymous');
      return;
    }

    setAuthState('loading');
    try {
      await authAPI.getCurrentUser();
      setAuthState('authenticated');
    } catch {
      tokenManager.clearAll({ notify: false });
      setAuthState('anonymous');
    }
  }, []);

  useEffect(() => {
    validateSession();

    const handleAuthenticated = () => setAuthState('authenticated');
    const handleExpired = () => setAuthState('anonymous');
    window.addEventListener('auth:changed', handleAuthenticated);
    window.addEventListener('auth:expired', handleExpired);

    return () => {
      window.removeEventListener('auth:changed', handleAuthenticated);
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, [validateSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={(
            <PublicRoute authState={authState}>
              <Login />
            </PublicRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute authState={authState}>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/"
          element={<Navigate to={authState === 'authenticated' ? '/dashboard' : '/login'} replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
