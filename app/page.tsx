'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Chore } from '@/app/types';

async function fetchWithRetry(url: string, options?: RequestInit, retries = 1): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 500));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

async function loadChores(): Promise<Chore[]> {
  const res = await fetchWithRetry('/api/chores');
  return res.json();
}

export default function ChoreListPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('selectedUserId') ?? '') : ''
  );
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  async function fetchChores() {
    const data = await loadChores();
    setChores(data);
  }

  useEffect(() => {
    // Load chores on mount. loadChores is a module-level function with no
    // setState calls, so it does not trigger the set-state-in-effect rule.
    loadChores().then(data => {
      setChores(data);
      setLoading(false);
    });

    // Poll every 30 seconds to pick up changes made by other users.
    const interval = setInterval(() => {
      loadChores().then(setChores);
    }, 30000);

    // On iOS, tabs can go dormant and the first action after waking fails.
    // Re-fetch when the page becomes visible again to warm the connection.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        loadChores().then(setChores);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  async function handleClaim(choreId: string, assignTo: string | null) {
    setClaimingId(choreId);
    await fetchWithRetry(`/api/chores/${choreId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign', assignedTo: assignTo }),
    });
    await new Promise(r => setTimeout(r, 600));
    setClaimingId(null);
    fetchChores();
  }

  async function handleComplete(choreId: string) {
    if (!selectedUserId) return;
    setCompletingId(choreId);
    await fetchWithRetry(`/api/chores/${choreId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', userId: selectedUserId }),
    });
    await new Promise(r => setTimeout(r, 600));
    setCompletingId(null);
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
      {[...chores].sort((a, b) => {
        const dateA = new Date(a.dueDate).toISOString().slice(0, 10);
        const dateB = new Date(b.dueDate).toISOString().slice(0, 10);
        if (dateA !== dateB) return dateA < dateB ? -1 : 1;

        const rank = (chore: Chore) => {
          if (chore.assignedTo?._id === selectedUserId) return 0;
          if (!chore.assignedTo) return 1;
          return 2;
        };
        return rank(a) - rank(b);
      }).map(chore => {
        const dueDateUTC = new Date(chore.dueDate).toISOString().slice(0, 10);
        const todayUTC = new Date().toISOString().slice(0, 10);
        const isActive = dueDateUTC <= todayUTC;
        const isOverdue = dueDateUTC < todayUTC && isActive;
        const assignedUser = chore.assignedTo;
        const isAssignedToMe = assignedUser?._id === selectedUserId;
        const dueLabel = new Date(dueDateUTC + 'T12:00:00').toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric',
        });

        const isCompleting = completingId === chore._id;
        const isClaiming = claimingId === chore._id;

        return (
          <div
            key={chore._id}
            className={`rounded-lg px-4 py-3 flex items-center justify-between gap-3 transition-all duration-500 ${
              isCompleting
                ? 'bg-green-700/60 scale-95 opacity-0'
                : isClaiming
                ? 'bg-accent/30 border-l-4 border-accent'
                : isOverdue
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
