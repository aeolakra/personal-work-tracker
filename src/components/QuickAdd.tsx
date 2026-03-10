import React, { useState } from 'react';
import { CATEGORIES, Task } from '../types';
import { Button, Input, Select } from './ui';
import { Plus } from 'lucide-react';

import { format } from 'date-fns';

interface QuickAddProps {
  onAdd: (task: Partial<Task>) => void;
}

export function QuickAdd({ onAdd }: QuickAddProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [workDate, setWorkDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

    onAdd({
      title,
      category: finalCategory,
      workDate,
      status: 'NOT_STARTED',
      description: '',
    });

    setTitle('');
    setCustomCategory('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white p-4 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <Input
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1 border-none shadow-none focus-visible:ring-0 px-0 text-lg bg-transparent dark:bg-transparent"
        autoFocus
      />
      <div className="flex items-center gap-2 shrink-0">
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-[140px] border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
        {category === 'Other' && (
          <Input
            placeholder="Custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className="w-[140px] border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
          />
        )}
        <Input
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          className="w-[140px] border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
        />
        <Button type="submit" size="icon" disabled={!title.trim()}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
