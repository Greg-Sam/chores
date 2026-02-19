'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/app/types';

const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'] as const;

export default function NewChorePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    frequency: 'weekly',
    dueDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.dueDate) {
      setError('Name and due date are required.');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/chores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim(),
        frequency: form.frequency,
        dueDate: form.dueDate,
        assignedTo: form.assignedTo || undefined,
      }),
    });
    if (res.ok) {
      router.push('/');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to create chore.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-primary mb-6">Add Chore</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Name *</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Vacuum living room"
            className="bg-surface border border-muted/30 text-primary rounded px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="bg-surface border border-muted/30 text-primary rounded px-3 py-2 text-base resize-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Frequency *</span>
          <select
            name="frequency"
            value={form.frequency}
            onChange={handleChange}
            className="bg-surface border border-muted/30 text-primary rounded px-3 py-2 text-base"
          >
            {FREQUENCIES.map(f => (
              <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Due Date *</span>
          <input
            type="date"
            name="dueDate"
            value={form.dueDate}
            onChange={handleChange}
            className="bg-surface border border-muted/30 text-primary rounded px-3 py-2 text-base"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Assign To (optional)</span>
          <select
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
            className="bg-surface border border-muted/30 text-primary rounded px-3 py-2 text-base"
          >
            <option value="">Unassigned</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-app-bg font-semibold py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Chore'}
        </button>
      </form>
    </div>
  );
}
