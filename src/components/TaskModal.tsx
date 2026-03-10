import React, { useState, useEffect } from 'react';
import { Task, CATEGORIES, TaskStatus } from '../types';
import { Button, Input, Select } from './ui';
import { X } from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (task) {
      const isCustom = task.category && !CATEGORIES.includes(task.category);
      setFormData({
        ...task,
        category: isCustom ? 'Other' : task.category
      });
      if (isCustom) {
        setCustomCategory(task.category);
      } else {
        setCustomCategory('');
      }
    } else {
      setFormData({});
      setCustomCategory('');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (finalData.category === 'Other' && customCategory.trim()) {
      finalData.category = customCategory.trim();
    }
    
    // Handle completedDate logic based on status
    if (finalData.status === 'DONE' && task.status !== 'DONE') {
      finalData.completedDate = new Date().toISOString();
    } else if (finalData.status !== 'DONE' && task.status === 'DONE') {
      finalData.completedDate = null;
    }
    
    onSave(task.id, finalData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Edit Task</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
            <Input name="title" value={formData.title || ''} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
              <Select name="category" value={formData.category || ''} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              {formData.category === 'Other' && (
                <Input
                  placeholder="Custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
              <Select name="status" value={formData.status || ''} onChange={handleChange}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
            <Input type="date" name="workDate" value={formData.workDate || ''} onChange={handleChange} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="danger" onClick={() => { onDelete(task.id); onClose(); }}>
              Delete
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
