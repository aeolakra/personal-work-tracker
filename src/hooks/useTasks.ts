import { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever tasks change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, loading]);

  const addTask = useCallback((taskData: Partial<Task>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: uuidv4(),
      title: taskData.title || '',
      description: taskData.description || '',
      category: taskData.category || 'Other',
      status: taskData.status || 'NOT_STARTED',
      workDate: taskData.workDate || null,
      completedDate: taskData.completedDate || null,
      createdAt: now,
      updatedAt: now,
      orderIndex: tasks.length > 0 ? Math.min(...tasks.map(t => t.orderIndex || 0)) - 1 : 0,
      ...taskData,
    } as Task;

    setTasks((prev) => [newTask, ...prev]);
  }, [tasks]);

  const updateTask = useCallback((id: string, taskData: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...taskData, updatedAt: new Date().toISOString() }
          : t
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reorderTasks = useCallback((reorderedTasks: { id: string; orderIndex: number }[]) => {
    setTasks((prev) => {
      const newTasks = [...prev];
      reorderedTasks.forEach(({ id, orderIndex }) => {
        const taskIndex = newTasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
          newTasks[taskIndex] = { ...newTasks[taskIndex], orderIndex, updatedAt: new Date().toISOString() };
        }
      });
      return newTasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    });
  }, []);

  return { tasks, loading, error, addTask, updateTask, deleteTask, reorderTasks };
}
