import { useState, useEffect, useRef } from 'react'
import {
  collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'

const LOGO_URL = 'https://www.indiraedu.com/wp-content/uploads/2021/03/Indira-Group-of-Institutes-Logo.png'

function fmtTime(t) {
  if (!t) return '—'
  const d = t.toDate ? t.toDate() : new Date(t)
  return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function AdminDashboard() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | verified | pending
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const prevCountRef = useRef(0)

  useEffect(() => {
    const q = query(collection(db, 'students'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setStudents(data)
      setLoading(false)
      prevCountRef.current = data.filter(s => s.verified).length
    })
    return unsub
  }, [])

  const verified = students.filter(s => s.verified)
  const pending = students.filter(s => !s.verified)

  const recent = [...verified]
    .sort((a, b) => {
      const at = a.verified_time?.toDate?.() || new Date(0)
      const bt = b.verified_time?.toDate?.() || new Date(0)
      return bt - at
    })
    .slice(0, 10)

  const filtered = students.filter(s => {
    const matchFilter =
      filter === 'all' ? true :
      filter === 'verified' ? s.verified :
      !s.verified

    const q = search.toLowerCase()
    const matchSearch = !q ||
      s.haptiq_id?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q)

    return matchFilter && matchSearch
  })

  async function toggleVerify(student) {
    const newVal = !student.verified
    await updateDoc(doc(db, 'students', student.id), {
      verified: newVal,
      verified_time: newVal ? Timestamp.now() : null,
    })
  }

  function exportCSV() {
    const rows = verified.map(s => ({
      'Haptiq ID': s.haptiq_id,
      Name: s.name,
      Email: s.email,
      College: s.college,
      'Verified At': fmtTime(s.verified_time),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Verified Students')
    XLSX.writeFile(wb, 'haptiq_verified_students.xlsx')
  }

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin-haptiq-2026-x9')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Indira" className="h-8 object-contain" onError={e => e.target.style.display='none'} />
          <div>
            <h1 className="font-display font-bold text-sm leading-tight">Haptiq Pool Drive 2026</h1>
            <p className="text-gray-500 text-[10px]">Admin Dashboard · Live</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            LIVE
          </span>
          <button onClick={handleLogout} className="text-gray-500 hover:text-white text-xs transition px-2 py-1">
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Registered" value={students.length} color="indigo" />
          <StatCard label="Verified" value={verified.length} color="emerald" />
          <StatCard label="Pending" value={pending.length} color="amber" />
          <StatCard label="Attendance %" value={students.length ? Math.round((verified.length / students.length) * 100) + '%' : '0%'} color="purple" />
        </div>

        {/* Recently Verified */}
        {recent.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Recently Verified</h2>
            <div className="space-y-2">
              {recent.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                    <span className="text-white font-medium">{s.name}</span>
                    <span className="text-gray-500 text-xs hidden sm:block">{s.college}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{fmtTime(s.verified_time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, Haptiq ID, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
          />
          <div className="flex gap-2">
            {['all', 'verified', 'pending'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v4m0 0l-3-3m3 3l3-3M12 4v8" />
            </svg>
            Export Excel
          </button>
        </div>

        {/* Student Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">Name</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Haptiq ID</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">College</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Verified At</th>
                  <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wide px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-600 py-8">No students found</td></tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden sm:table-cell">{s.haptiq_id}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{s.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{s.college}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.verified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {s.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{fmtTime(s.verified_time)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleVerify(s)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition ${s.verified ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                        {s.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-800 text-gray-600 text-xs">
            Showing {filtered.length} of {students.length} students
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="font-display text-3xl font-bold">{value}</p>
    </div>
  )
}
