'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { User } from '@/app/types';

export default function Nav() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('selectedUserId');
    if (stored) setSelectedUserId(stored);
  }, []);

  function handleUserChange(id: string) {
    setSelectedUserId(id);
    localStorage.setItem('selectedUserId', id);
    window.dispatchEvent(new StorageEvent('storage', { key: 'selectedUserId', newValue: id }));
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav className="bg-surface border-b border-muted/20 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="text-primary font-bold text-lg tracking-tight">
        Family Chores
      </Link>

      <div className="flex items-center gap-4">
        {/* User selector */}
        <select
          value={selectedUserId}
          onChange={e => handleUserChange(e.target.value)}
          className="bg-app-bg text-primary border border-muted/30 rounded px-2 py-1 text-sm"
        >
          <option value="">Who are you?</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>

        {/* Add dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="bg-accent text-app-bg font-semibold px-3 py-1.5 rounded text-sm flex items-center gap-1 hover:opacity-90"
          >
            + Add
            <span className="text-xs">{menuOpen ? '▲' : '▼'}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 bg-surface border border-muted/20 rounded shadow-lg z-50 min-w-[140px]">
              <Link
                href="/chores/new"
                className="block px-4 py-2 text-primary hover:bg-muted/10 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Add Chore
              </Link>
              <Link
                href="/users/new"
                className="block px-4 py-2 text-primary hover:bg-muted/10 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                Add User
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
