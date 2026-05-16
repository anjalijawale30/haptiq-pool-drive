// src/components/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  collection, query, onSnapshot, orderBy, doc, updateDoc,
  where, getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';

/* ─── helpers ─────────────────────────────────────── */
function fmt(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function fmtShort(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  return fmt(ts);
}

/* ─── sub-components ──────────────────────────────── */
function StatCard({ label, value, color, sub }) {
  const colors = {
    green:  'bg-green-500',
    blue:   'bg-blue-500',
    gray:   'bg-gray-700',
    amber:  'bg-amber-500',
  };
  return (
    <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
      <div className={`w-8 h-1.5 rounded-full mb-3 ${colors[color]}`} />
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-white text-3xl font-bold mt-1">{value ?? '—'}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ verified }) {
  return verified
    ? <span className="bg-green-900/60 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">Verified</span>
    : <span className="bg-gray-800 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">Pending</span>;
}

function StudentRow({ student, onToggle, toggling }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-800 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-medium text-sm">{student.name}</span>
          <Badge verified={student.verified} />
        </div>
        <p className="text-gray-500 text-xs mt-0.5 font-mono">{student.haptiq_id}</p>
        <p className="text-gray-600 text-xs truncate">{student.email}</p>
        <p className="text-gray-600 text-xs">{student.college}</p>
        {student.verified && (
          <p className="text-green-600 text-xs mt-0.5">
            Token #{String(student.token_number).padStart(4,'0')} · {fmt(student.verified_time)}
          </p>
        )}
      </div>
      <button
        onClick={() => onToggle(student)}
        disabled={toggling === student.id}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0 mt-0.5
          ${student.verified
            ? 'bg-red-900/40 text-red-400 hover:bg-red-900/70'
            : 'bg-green-900/40 text-green-400 hover:bg-green-900/70'}
          disabled:opacity-40`}
      >
        {toggling === student.id ? '…' : student.verified ? 'Unverify' : 'Verify'}
      </button>
    </div>
  );
}

/* ─── main component ──────────────────────────────── */
export default function AdminDashboard({ user, onSignOut }) {
  const [students,  setStudents]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [tab,       setTab]       = useState('all'); // 'all' | 'verified' | 'pending' | 'recent'
  const [total,     setTotal]     = useState(null);
  const [toggling,  setToggling]  = useState(null);
  const [exporting, setExporting] = useState(false);

  /* live listener */
  useEffect(() => {
    const q    = query(collection(db, 'students'), orderBy('name'));
    const unsub = onSnapshot(q, snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTotal(snap.size);
    });
    return unsub;
  }, []);

  /* derived counts */
  const verified  = students.filter(s => s.verified);
  const pending   = students.filter(s => !s.verified);
  const recent    = [...verified]
    .sort((a, b) => {
      const ta = a.verified_time?.toDate?.() ?? 0;
      const tb = b.verified_time?.toDate?.() ?? 0;
      return tb - ta;
    })
    .slice(0, 20);

  /* search */
  const lq = search.toLowerCase();
  const searchFilter = s =>
    !lq ||
    s.name?.toLowerCase().includes(lq) ||
    s.haptiq_id?.toLowerCase().includes(lq) ||
    s.email?.toLowerCase().includes(lq);

  const displayed = {
    all:      students.filter(searchFilter),
    verified: verified.filter(searchFilter),
    pending:  pending.filter(searchFilter),
    recent,
  }[tab];

  /* toggle verify */
  const toggleVerify = async (student) => {
    setToggling(student.id);
    try {
      await updateDoc(doc(db, 'students', student.id), {
        verified:      !student.verified,
        verified_time: !student.verified ? new Date() : null,
        token_number:  !student.verified ? (verified.length + 1) : null,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  };

  /* export */
  const exportExcel = () => {
    setExporting(true);
    try {
      const rows = verified.map(s => ({
        'Token #':       s.token_number ?? '',
        'Haptiq ID':     s.haptiq_id,
        'Name':          s.name,
        'Email':         s.email,
        'College':       s.college,
        'Verified Time': fmt(s.verified_time),
      }));
      const ws  = XLSX.utils.json_to_sheet(rows);
      const wb  = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Verified Students');
      XLSX.writeFile(wb, `haptiq-pool-drive-${new Date().toISOString().slice(0,10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  const pct = total ? Math.round((verified.length / total) * 100) : 0;

  /* ── render ── */
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* top bar */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm font-mono">H</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm leading-tight">Admin Panel</p>
          <p className="text-gray-500 text-xs leading-tight">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            disabled={exporting || verified.length === 0}
            className="bg-green-700 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5
              rounded-lg transition disabled:opacity-40"
          >
            {exporting ? 'Exporting…' : '↓ Export'}
          </button>
          <button
            onClick={onSignOut}
            className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1.5 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 max-w-2xl mx-auto">
        {/* stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Registered" value={total}           color="gray" />
          <StatCard label="Verified"         value={verified.length} color="green"
            sub={`${pct}% attendance`} />
          <StatCard label="Pending"          value={pending.length}  color="amber" />
          <StatCard label="Live Count"       value={verified.length} color="blue"
            sub="Updates in real-time" />
        </div>

        {/* progress bar */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Attendance Progress</span>
            <span className="text-green-400 text-xs font-bold">{pct}%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none"
            stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID or email…"
            className="w-full bg-gray-900 border border-gray-800 text-white placeholder-gray-600
              rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2
              focus:ring-green-600 focus:border-transparent transition"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* tabs */}
        <div className="flex gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800">
          {[
            { key: 'all',      label: 'All',      count: students.length },
            { key: 'verified', label: 'Verified',  count: verified.length },
            { key: 'pending',  label: 'Pending',   count: pending.length },
            { key: 'recent',   label: 'Recent',    count: null },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition
                ${tab === t.key ? 'bg-green-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {t.label}
              {t.count !== null && <span className="ml-1 opacity-70">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* list */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 px-4 py-1">
          {displayed.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-sm">No students found</p>
            </div>
          ) : (
            displayed.map(s => (
              <StudentRow
                key={s.id}
                student={s}
                onToggle={toggleVerify}
                toggling={toggling}
              />
            ))
          )}
        </div>

        <p className="text-center text-gray-700 text-xs pb-4">
          {displayed.length} student{displayed.length !== 1 ? 's' : ''} shown · Last updated live
        </p>
      </div>
    </div>
  );
}
