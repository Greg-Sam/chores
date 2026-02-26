'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Chore, User } from '@/app/types';

export default function ChoreHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [chore, setChore] = useState<Chore | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/chores').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]).then(([chores, users]: [Chore[], User[]]) => {
      const found = chores.find(c => c._id === id);
      setChore(found ?? null);
      setUserMap(Object.fromEntries(users.map(u => [u._id, u.name])));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-muted py-16 text-center">Loading...</p>;

  if (!chore) {
    return (
      <div>
        <Link href="/" className="text-muted hover:text-primary text-sm">← Back</Link>
        <p className="text-muted mt-6">Chore not found.</p>
      </div>
    );
  }

  const sorted = [...chore.history].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/chores/${id}`, { method: 'DELETE' });
    router.push('/');
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-muted hover:text-primary text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-primary">{chore.name} — History</h1>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted">No history yet. Complete this chore to start tracking.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((entry, i) => {
            const completedById =
              typeof entry.completedBy === 'string'
                ? entry.completedBy
                : (entry.completedBy as User)._id;
            const userName = userMap[completedById] ?? 'Unknown';
            const dateStr = new Date(entry.completedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            return (
              <li key={i} className="bg-surface rounded px-4 py-3 flex justify-between text-sm">
                <span className="text-primary">{dateStr}</span>
                <span className="text-muted">{userName}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 pt-6 border-t border-muted/20">
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-red-400 hover:text-red-300 border border-red-400/40 hover:border-red-300 px-3 py-1.5 rounded transition-colors"
          >
            Delete this chore
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting...' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-sm text-muted hover:text-primary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
