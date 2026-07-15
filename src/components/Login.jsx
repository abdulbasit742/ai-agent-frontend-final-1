import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CheckCircle2, Eye, EyeOff, Loader2, Lock, LogIn, Server, User, XCircle } from 'lucide-react';

import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { API_BASE_URL, apiUtils, authAPI, healthAPI } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [backendState, setBackendState] = useState('checking');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    healthAPI.check()
      .then(() => active && setBackendState('online'))
      .catch(() => active && setBackendState('offline'));
    return () => { active = false; };
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const username = formData.username.trim();
    if (!username || !formData.password) {
      setError('Enter both your username and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await authAPI.login(username, formData.password);
      if (response.status !== 'success') throw new Error(response.message || 'Sign in failed.');
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(apiUtils.handleError(requestError).message);
    } finally {
      setLoading(false);
    }
  };

  const statusCopy = {
    checking: { icon: Loader2, text: 'Checking backend', className: 'text-gray-600', spin: true },
    online: { icon: CheckCircle2, text: 'Backend online', className: 'text-green-700', spin: false },
    offline: { icon: XCircle, text: 'Backend unavailable', className: 'text-red-700', spin: false },
  }[backendState];
  const StatusIcon = statusCopy.icon;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <header className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <Bot className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950">AI Agent System</h1>
          <p className="mt-2 text-gray-600">Secure task management for your team</p>
        </header>

        <Card className="border-white/70 bg-white/95 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Use the account created by your system administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-800">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10"
                    disabled={loading}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-800">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="px-10"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" role="alert" aria-live="assertive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || backendState === 'offline'}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 rounded-xl border bg-gray-50 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className={`flex items-center gap-2 font-medium ${statusCopy.className}`}>
                  <StatusIcon className={`h-4 w-4 ${statusCopy.spin ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {statusCopy.text}
                </span>
                <Server className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <p className="mt-2 truncate text-xs text-gray-500" title={API_BASE_URL}>{API_BASE_URL}</p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-gray-500">
          Access and account roles are managed by the backend administrator.
        </p>
      </div>
    </main>
  );
};

export default Login;
