import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  ListTodo,
  LogOut,
  RotateCw,
  Search,
  ShieldCheck,
} from 'lucide-react';

import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import TaskCard from './TaskCard';
import { apiUtils, authAPI, tasksAPI } from '../services/api';

const FILTERS = [
  { value: 'all', label: 'All tasks' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

function calculateFallbackStats(tasks) {
  const completed = tasks.filter((task) => task.status === 'completed').length;
  return {
    total_tasks: tasks.length,
    pending_tasks: tasks.filter((task) => task.status === 'pending').length,
    in_progress_tasks: tasks.filter((task) => task.status === 'in_progress').length,
    completed_tasks: completed,
    completion_rate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    overdue_tasks: tasks.filter((task) => task.is_overdue).length,
  };
}

const Dashboard = () => {
  const [user, setUser] = useState(() => apiUtils.getCurrentUser());
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadDashboardData = async ({ background = false } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const userResponse = await authAPI.getCurrentUser();
      if (userResponse.status === 'success') setUser(userResponse.user);

      const [tasksResponse, statsResponse] = await Promise.all([
        tasksAPI.getTasks({ per_page: 100 }),
        tasksAPI.getTaskStats(),
      ]);

      if (tasksResponse.status === 'success') setTasks(tasksResponse.tasks || []);
      if (statsResponse.status === 'success') setStats(statsResponse.stats || {});
    } catch (requestError) {
      setError(apiUtils.handleError(requestError).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const derivedStats = useMemo(
    () => ({ ...calculateFallbackStats(tasks), ...stats }),
    [stats, tasks],
  );

  const visibleTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesFilter = filter === 'all' || task.status === filter;
      const matchesSearch = !normalizedSearch
        || task.title?.toLowerCase().includes(normalizedSearch)
        || task.description?.toLowerCase().includes(normalizedSearch)
        || task.assignee_info?.username?.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [filter, searchTerm, tasks]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleTaskUpdate = async (taskId, updates) => {
    setError('');
    try {
      const response = await tasksAPI.updateTask(taskId, updates);
      if (response.status === 'success') {
        setTasks((current) => current.map((task) => (task.id === taskId ? response.task : task)));
        const statsResponse = await tasksAPI.getTaskStats();
        if (statsResponse.status === 'success') setStats(statsResponse.stats || {});
      }
    } catch (requestError) {
      const message = apiUtils.handleError(requestError).message;
      setError(message);
      throw requestError;
    }
  };

  const handleTaskDelete = async (taskId) => {
    setError('');
    try {
      await tasksAPI.deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      const statsResponse = await tasksAPI.getTaskStats();
      if (statsResponse.status === 'success') setStats(statsResponse.stats || {});
    } catch (requestError) {
      const message = apiUtils.handleError(requestError).message;
      setError(message);
      throw requestError;
    }
  };

  const summaryCards = [
    { label: 'Total tasks', value: derivedStats.total_tasks || 0, icon: ListTodo, className: 'text-slate-700 bg-slate-100' },
    { label: 'In progress', value: derivedStats.in_progress_tasks || 0, icon: Clock3, className: 'text-blue-700 bg-blue-100' },
    { label: 'Completed', value: derivedStats.completed_tasks || 0, icon: CheckCircle2, className: 'text-green-700 bg-green-100' },
    { label: 'Overdue', value: derivedStats.overdue_tasks || 0, icon: AlertCircle, className: 'text-red-700 bg-red-100' },
  ];

  const isAdmin = user?.role === 'admin';
  const displayName = user?.full_name || user?.username || 'Team member';

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6" aria-busy="true">
        <div className="text-center" role="status">
          <RotateCw className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />
          <p className="font-medium text-gray-900">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center">
            <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
              <Bot className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-gray-950">AI Agent System</h1>
              <p className="truncate text-xs text-gray-500">Task management dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => loadDashboardData({ background: true })} disabled={refreshing}>
              <RotateCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-gray-900">{displayName}</p>
              <p className="text-xs capitalize text-gray-500">{user?.role || 'member'}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-gray-950">Welcome, {displayName}</h2>
              {isAdmin && (
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                  <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" /> Admin
                </Badge>
              )}
            </div>
            <p className="mt-2 text-gray-600">Review priorities, update progress, and keep work moving.</p>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <BarChart3 className="h-4 w-4 text-blue-600" aria-hidden="true" />
              Completion rate
              <strong className="text-gray-950">{derivedStats.completion_rate || 0}%</strong>
            </div>
          </div>
        </section>

        {error && (
          <Alert variant="destructive" className="mb-6" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => loadDashboardData({ background: true })}>Retry</Button>
            </AlertDescription>
          </Alert>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Task summary">
          {summaryCards.map(({ label, value, icon: Icon, className }) => (
            <Card key={label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 text-3xl font-bold text-gray-950">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${className}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section aria-labelledby="tasks-heading">
          <Card>
            <CardHeader className="gap-4 border-b lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle id="tasks-heading">Tasks</CardTitle>
                <p className="mt-1 text-sm text-gray-500">{visibleTasks.length} of {tasks.length} shown</p>
              </div>
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search tasks or assignees"
                  className="pl-9"
                  aria-label="Search tasks"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter tasks by status">
                {FILTERS.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    size="sm"
                    variant={filter === item.value ? 'default' : 'outline'}
                    onClick={() => setFilter(item.value)}
                    aria-pressed={filter === item.value}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              {visibleTasks.length ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {visibleTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={handleTaskUpdate}
                      onDelete={handleTaskDelete}
                      canDelete={isAdmin || task.created_by === user?.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-gray-50 px-6 py-12 text-center">
                  <ListTodo className="mx-auto h-10 w-10 text-gray-400" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold text-gray-900">No matching tasks</h3>
                  <p className="mt-1 text-sm text-gray-500">Change the filter or search term, then try again.</p>
                  {(filter !== 'all' || searchTerm) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => { setFilter('all'); setSearchTerm(''); }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
