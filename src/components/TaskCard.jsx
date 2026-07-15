import { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Pause,
  Play,
  Trash2,
  User,
} from 'lucide-react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { apiUtils } from '../services/api';

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
};

function dueDateLabel(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Invalid due date';

  const now = new Date();
  const dayDifference = Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
  if (dayDifference < 0) return `Overdue by ${Math.abs(dayDifference)} day${Math.abs(dayDifference) === 1 ? '' : 's'}`;
  if (dayDifference === 0) return 'Due today';
  if (dayDifference === 1) return 'Due tomorrow';
  return `Due in ${dayDifference} days`;
}

const TaskCard = ({ task, onUpdate, onDelete, canDelete = false }) => {
  const [action, setAction] = useState(null);
  const dueLabel = dueDateLabel(task.due_date);
  const overdue = Boolean(task.is_overdue) || (dueLabel?.startsWith('Overdue') && task.status !== 'completed');

  const runUpdate = async (status) => {
    if (action) return;
    setAction(status);
    try {
      await onUpdate(task.id, { status });
    } finally {
      setAction(null);
    }
  };

  const runDelete = async () => {
    if (action || !onDelete) return;
    const confirmed = window.confirm(`Delete “${task.title}”? This action cannot be undone.`);
    if (!confirmed) return;

    setAction('delete');
    try {
      await onDelete(task.id);
    } finally {
      setAction(null);
    }
  };

  const renderStatusAction = () => {
    if (task.status === 'pending') {
      return (
        <Button className="w-full" size="sm" disabled={Boolean(action)} onClick={() => runUpdate('in_progress')}>
          <Play className="mr-2 h-4 w-4" aria-hidden="true" /> Start task
        </Button>
      );
    }

    if (task.status === 'in_progress') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" disabled={Boolean(action)} onClick={() => runUpdate('pending')}>
            <Pause className="mr-2 h-4 w-4" aria-hidden="true" /> Pause
          </Button>
          <Button size="sm" disabled={Boolean(action)} onClick={() => runUpdate('completed')}>
            <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" /> Complete
          </Button>
        </div>
      );
    }

    if (task.status === 'completed') {
      return (
        <Button className="w-full" variant="outline" size="sm" disabled={Boolean(action)} onClick={() => runUpdate('in_progress')}>
          <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" /> Reopen task
        </Button>
      );
    }

    return null;
  };

  return (
    <Card className={`h-full transition-shadow hover:shadow-md ${task.status === 'completed' ? 'opacity-80' : ''} ${overdue ? 'border-red-200' : ''}`} aria-busy={Boolean(action)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="break-words text-lg leading-snug">{task.title}</CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className={PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}>
                {apiUtils.getPriorityEmoji(task.priority)} {task.priority || 'medium'}
              </Badge>
              <Badge className={STATUS_STYLES[task.status] || STATUS_STYLES.pending}>
                {apiUtils.getStatusEmoji(task.status)} {String(task.status || 'pending').replace('_', ' ')}
              </Badge>
              {task.is_ai_generated && (
                <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                  <Bot className="mr-1 h-3 w-3" aria-hidden="true" /> AI generated
                </Badge>
              )}
            </div>
          </div>
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-500 hover:bg-red-50 hover:text-red-700"
              onClick={runDelete}
              disabled={Boolean(action)}
              aria-label={`Delete ${task.title}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        {task.description && <CardDescription className="line-clamp-3 pt-2">{task.description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex flex-col justify-between gap-5">
        <div className="space-y-3 text-sm text-gray-600">
          {dueLabel && (
            <div className={`flex items-center gap-2 ${overdue ? 'font-medium text-red-700' : ''}`}>
              {overdue ? <AlertCircle className="h-4 w-4" aria-hidden="true" /> : <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />}
              <span>{dueLabel}</span>
            </div>
          )}
          {Number(task.estimated_hours) > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>Estimated {apiUtils.formatDuration(task.estimated_hours)}</span>
            </div>
          )}
          {task.assignee_info?.username && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
              <span>Assigned to {task.assignee_info.username}</span>
            </div>
          )}
          {task.is_ai_generated && task.ai_context && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-800">
              <div className="mb-1 flex items-center gap-2 font-medium">
                <Bot className="h-3.5 w-3.5" aria-hidden="true" /> AI context
              </div>
              <p className="line-clamp-3">{task.ai_context}</p>
            </div>
          )}
        </div>

        <div>
          {renderStatusAction()}
          <div className="mt-4 border-t pt-3 text-xs text-gray-500">
            Created {apiUtils.formatDate(task.created_at)}
          </div>
          {action && <span className="sr-only" role="status">Updating task…</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
