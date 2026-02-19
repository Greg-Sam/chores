'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Chore } from '@/app/types';

export default function ChoreListPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [selectedUserId] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('selectedUserId') ?? '') : ''
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chores')
      .then(r => r.json())
      .then((data: Chore[]) => {
        setChores(data);
        setLoading(false);
      });
  }, []);

  async function fetchChores() {
    const res = await fetch('/api/chores');
    const data = await res.json();
    setChores(data);
  }

  async function handleClaim(choreId: string, assignTo: string | null) {
    await fetch(`/api/chores/${choreId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', assignedTo: assignTo }),
    });
    fetchChores();
  }

  async function handleComplete(choreId: string) {
    if (!selectedUserId) return;
    await fetch(`/api/chores/${choreId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', userId: selectedUserId }),
    });
    fetchChores();
  }

  if (loading) {
    return <p className="text-muted text-center py-16">Loading chores...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold text-primary mb-4">Chores</h1>
      {chores.length === 0 && (
        <p className="text-muted">No chores yet. Use the &quot;+ Add&quot; menu above to create one.</p>
      )}
      {chores.map(chore => {
        const isActive = chore.status === 'active';
        const dueDateUTC = new Date(chore.dueDate).toISOString().slice(0, 10);
        const todayUTC = new Date().toISOString().slice(0, 10);
        const isOverdue = dueDateUTC < todayUTC && isActive;
        const assignedUser = chore.assignedTo;
        const isAssignedToMe = assignedUser?._id === selectedUserId;
        const dueLabel = new Date(dueDateUTC + 'T12:00:00').toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric',
        });

        return (
          <div
            key={chore._id}
            className={`rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${
              isOverdue
                ? 'bg-red-950/60 border-l-4 border-red-500'
                : 'bg-surface'
            } ${isActive ? 'opacity-100' : 'opacity-60'}`}
          >
            {/* Left: chore info */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <Link
                href={`/chores/${chore._id}`}
                className={`text-base truncate hover:underline ${
                  isActive ? 'text-primary font-bold' : 'text-muted font-normal'
                }`}
              >
                {chore.name}
              </Link>
              <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-muted'}`}>
                {chore.frequency} · due {dueLabel} ·{' '}
                {assignedUser ? assignedUser.name : 'Unassigned'}
              </p>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Claim / Unclaim */}
              {isAssignedToMe ? (
                <button
                  onClick={() => handleClaim(chore._id, null)}
                  className="text-xs border border-muted/40 text-muted px-2 py-1 rounded hover:border-accent hover:text-accent"
                >
                  Unclaim
                </button>
              ) : !assignedUser ? (
                <button
                  onClick={() => handleClaim(chore._id, selectedUserId || null)}
                  disabled={!selectedUserId}
                  className="text-xs border border-accent text-accent px-2 py-1 rounded hover:bg-accent/10 disabled:opacity-40"
                >
                  Claim
                </button>
              ) : (
                <span className="text-xs text-muted px-2">Claimed</span>
              )}

              {/* Complete */}
              <button
                onClick={() => handleComplete(chore._id)}
                disabled={!selectedUserId}
                className="text-xs bg-accent text-app-bg font-semibold px-2 py-1 rounded hover:opacity-90 disabled:opacity-40"
              >
                Done
              </button>

              {/* History icon */}
              <Link
                href={`/chores/${chore._id}/history`}
                className="text-muted hover:text-accent"
                title="View history"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="8" strokeLinecap="round" strokeWidth="3" />
                  <line x1="12" y1="12" x2="12" y2="16" />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
