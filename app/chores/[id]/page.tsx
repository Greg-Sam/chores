'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Chore, User } from '@/app/types';

const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'] as const;

export default function ManageChorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [chore, setChore] = useState<Chore | null>(null);
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
    Promise.all([
      fetch('/api/chores').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([chores, fetchedUsers]: [Chore[], User[]]) => {
      const found = chores.find(c => c._id === id);
      if (found) {
        setChore(found);
        setForm({
          name: found.name,
          description: found.description,
          frequency: found.frequency,
          dueDate: found.dueDate.slice(0, 10),
          assignedTo: found.assignedTo?._id ?? '',
        });
      }
      setUsers(fetchedUsers);
    });
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const editRes = await fetch(`/api/chores/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edit',
        name: form.name,
        description: form.description,
        frequency: form.frequency,
        dueDate: form.dueDate,
      }),
    });

    if (!editRes.ok) {
      const data = await editRes.json();
      setError(data.error ?? 'Failed to save changes.');
      setSubmitting(false);
      return;
    }

    // Fire assign separately if assignedTo changed
    const originalAssignedId = chore?.assignedTo?._id ?? '';
    if (form.assignedTo !== originalAssignedId) {
      await fetch(`/api/chores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          assignedTo: form.assignedTo || null,
        }),
      });
    }

    router.push('/');
  }

  async function handleDelete() {
    if (!confirm(`Delete "${chore?.name}"? This cannot be undone.`)) return;
    await fetch(`/api/chores/${id}`, { method: 'DELETE' });
    router.push('/');
  }

  if (!chore) return <p className="text-muted py-16 text-center">Loading...</p>;

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted hover:text-primary text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-primary">Edit Chore</h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Name *</span>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
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
          <span className="text-muted text-sm">Assigned To</span>
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

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-accent text-app-bg font-semibold py-2 rounded hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 border border-red-500/50 text-red-400 rounded hover:bg-red-500/10 text-sm"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
