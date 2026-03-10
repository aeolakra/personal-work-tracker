import React from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle2, Circle, Clock, MoreHorizontal, GripVertical, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Badge, Button, cn } from './ui';

interface TaskItemProps {
  key?: React.Key;
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onClick: (task: Task) => void;
  dragHandleProps?: any;
  innerRef?: (element: HTMLElement | null) => void;
  draggableProps?: any;
  isDragging?: boolean;
}

const statusIcons = {
  NOT_STARTED: <Circle className="h-5 w-5 text-zinc-400" />,
  IN_PROGRESS: <Clock className="h-5 w-5 text-amber-500" />,
  DONE: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
};

const statusStyles = {
  NOT_STARTED: 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
  IN_PROGRESS: 'border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900/40 dark:bg-amber-900/10 dark:hover:border-amber-800/60',
  DONE: 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:hover:border-emerald-800/60',
};

const statusBadgeStyles = {
  NOT_STARTED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
};

const statusText = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  DONE: 'Completed',
};

export function TaskItem({ task, onStatusChange, onClick, dragHandleProps, innerRef, draggableProps, isDragging }: TaskItemProps) {
  const isDone = task.status === 'DONE';

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      NOT_STARTED: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'NOT_STARTED',
    };
    onStatusChange(task.id, nextStatus[task.status]);
  };

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      onClick={() => onClick(task)}
      className={cn(
        'group flex cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm transition-all hover:shadow-md',
        statusStyles[task.status],
        isDone && 'opacity-70',
        isDragging && 'shadow-lg border-zinc-400 dark:border-zinc-600 scale-[1.02] z-10'
      )}
    >
      <div 
        {...dragHandleProps} 
        className="flex h-8 w-6 items-center justify-center text-zinc-300 hover:text-zinc-500 dark:text-zinc-700 dark:hover:text-zinc-500 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <button
        onClick={handleStatusClick}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {statusIcons[task.status]}
      </button>

      <div className="flex flex-1 flex-col gap-1 min-w-0 ml-1">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              'truncate font-medium text-zinc-900 dark:text-zinc-100',
              isDone && 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            {task.title}
          </h3>
          {isDone && <Check className="h-4 w-4 text-emerald-500 shrink-0" />}
          <span className={cn('hidden sm:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium', statusBadgeStyles[task.status])}>
            {statusText[task.status]}
          </span>
          <Badge variant="neutral" className="hidden sm:inline-flex shrink-0">
            {task.category}
          </Badge>
        </div>
        {task.description && (
          <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        {task.workDate && (
          <div className="hidden sm:block">
            {format(parseISO(task.workDate), 'MMM d')}
          </div>
        )}
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
