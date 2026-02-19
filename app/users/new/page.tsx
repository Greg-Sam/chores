'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      router.push('/');
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to create user.');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-sm">
      <h1 className="text-2xl font-bold text-primary mb-6">Add Family Member</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">Name *</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Alice"
            autoFocus
            className="bg-surface border border-muted/30 text-primary rounded px-3 py-2 text-base"
          />
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-app-bg font-semibold py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Member'}
        </button>
      </form>
    </div>
  );
}
