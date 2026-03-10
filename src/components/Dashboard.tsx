import React, { useState, useMemo, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TaskItem } from './TaskItem';
import { QuickAdd } from './QuickAdd';
import { TaskModal } from './TaskModal';
import { Task, TaskStatus, CATEGORIES } from '../types';
import { Search, Filter, LayoutList, CheckCircle2, Clock, Sun, Moon } from 'lucide-react';
import { Input, Button, Badge, cn } from './ui';
import { format, parseISO, isToday, isThisWeek } from 'date-fns';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export function Dashboard() {
  const { tasks, loading, error, addTask, updateTask, deleteTask, reorderTasks } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'COMPLETED' | 'IN_PROGRESS' | string>('ALL');

  const [view, setView] = useState<'TASKS' | 'HISTORY'>('TASKS');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const allCategories = useMemo(() => {
    const customCats = tasks
      .map(t => t.category)
      .filter(c => c && !CATEGORIES.includes(c));
    return [...CATEGORIES, ...Array.from(new Set(customCats))];
  }, [tasks]);

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask(id, { status, completedDate: status === 'DONE' ? new Date().toISOString() : null });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          (t.description && t.description.toLowerCase().includes(lowerQuery))
      );
    }

    if (filter === 'TODAY') {
      filtered = filtered.filter((t) => t.workDate && isToday(parseISO(t.workDate)));
    } else if (filter === 'THIS_WEEK') {
      filtered = filtered.filter((t) => t.workDate && isThisWeek(parseISO(t.workDate)));
    } else if (filter === 'COMPLETED') {
      filtered = filtered.filter((t) => t.status === 'DONE');
    } else if (filter === 'IN_PROGRESS') {
      filtered = filtered.filter((t) => t.status === 'IN_PROGRESS');
    } else if (allCategories.includes(filter)) {
      filtered = filtered.filter((t) => t.category === filter);
    }

    return filtered;
  }, [tasks, searchQuery, filter, allCategories]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    return { total, done, inProgress };
  }, [tasks]);

  const historyGroups = useMemo(() => {
    const completed = tasks.filter((t) => t.status === 'DONE' && t.completedDate);
    const groups: Record<string, Task[]> = {};
    
    completed.forEach((task) => {
      const dateStr = format(parseISO(task.completedDate!), 'MMMM d, yyyy');
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(task);
    });
    
    // Sort groups by date descending
    return Object.entries(groups).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  }, [tasks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    // We only allow reordering when viewing ALL tasks without search
    // Otherwise the indices won't match the full list
    if (filter !== 'ALL' || searchQuery) {
      alert("Reordering is only available when viewing 'All' tasks without search filters.");
      return;
    }

    const newTasks = Array.from(filteredTasks) as Task[];
    const [reorderedItem] = newTasks.splice(sourceIndex, 1);
    newTasks.splice(destinationIndex, 0, reorderedItem);
    
    // Calculate new order indices
    // We can just assign 0 to N for simplicity, or use a more complex algorithm
    // For simplicity, we'll just re-index all visible tasks
    const updates = newTasks.map((task, index) => ({
      id: task.id,
      orderIndex: index
    }));
    
    reorderTasks(updates);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <LayoutList className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline-block">Work Tracker</span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <div className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-100 dark:bg-zinc-900 border-transparent focus-visible:ring-zinc-300 dark:focus-visible:ring-zinc-700"
              />
            </div>
            <Button variant="secondary" size="icon" className="sm:hidden">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
              ME
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Tasks</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Completed
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{stats.done}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <Clock className="h-4 w-4 text-amber-500" />
              In Progress
            </div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{stats.inProgress}</div>
          </div>
        </div>

        {/* Quick Add */}
        <div className="mb-8">
          <QuickAdd onAdd={addTask} />
        </div>

        <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="flex gap-4">
            <button
              onClick={() => setView('TASKS')}
              className={cn(
                'text-sm font-medium transition-colors',
                view === 'TASKS' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              )}
            >
              Tasks
            </button>
            <button
              onClick={() => setView('HISTORY')}
              className={cn(
                'text-sm font-medium transition-colors',
                view === 'HISTORY' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              )}
            >
              History
            </button>
          </div>
        </div>

        {view === 'TASKS' ? (
          <>
            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            variant={filter === 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('ALL')}
            className="rounded-full"
          >
            All
          </Button>
          <Button
            variant={filter === 'TODAY' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('TODAY')}
            className="rounded-full"
          >
            Today
          </Button>
          <Button
            variant={filter === 'THIS_WEEK' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('THIS_WEEK')}
            className="rounded-full"
          >
            This Week
          </Button>
          <Button
            variant={filter === 'IN_PROGRESS' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('IN_PROGRESS')}
            className="rounded-full"
          >
            In Progress
          </Button>
          <Button
            variant={filter === 'COMPLETED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('COMPLETED')}
            className="rounded-full"
          >
            Completed
          </Button>
          <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-2" />
          <select
            value={allCategories.includes(filter) ? filter : ''}
            onChange={(e) => setFilter(e.target.value || 'ALL')}
            className="h-9 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:focus:ring-zinc-300"
          >
            <option value="">Category...</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-800">
              <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-900">
                <CheckCircle2 className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">No tasks found</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                You're all caught up! Add a new task above.
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="task-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {filteredTasks.map((task, index) => (
                      // @ts-ignore
                      <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={filter !== 'ALL' || !!searchQuery}>
                        {(provided, snapshot) => (
                          <TaskItem
                            task={task}
                            onStatusChange={handleStatusChange}
                            onClick={handleTaskClick}
                            innerRef={provided.innerRef}
                            draggableProps={provided.draggableProps}
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
          </>
        ) : (
          <div className="space-y-8">
            {historyGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-800">
                <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-900">
                  <CheckCircle2 className="h-6 w-6 text-zinc-400" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">No history yet</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Completed tasks will appear here grouped by date.
                </p>
              </div>
            ) : (
              historyGroups.map(([date, groupTasks]) => (
                <div key={date} className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 sticky top-16 bg-zinc-50 dark:bg-zinc-950 py-2 z-10">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {groupTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onClick={handleTaskClick}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={updateTask}
        onDelete={deleteTask}
      />
    </div>
  );
}
