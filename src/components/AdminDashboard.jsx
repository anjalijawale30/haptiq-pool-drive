import { useState, useEffect, useRef } from 'react'
import {
  collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp, writeBatch
} from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../lib/firebase'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'

const LOGO_B64 = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADhAOEDASIAAhEBAxEB/8QAHQABAAIDAQEBAQAAAAAAAAAAAAEHBQYIBAIJA//EAE4QAAEDAwMCAwMGBg4JBQEAAAECAwQABREGBxIhMQgTQSJRYRQVMnGBsxYjN0JSchckMzZWY3WRkpShsdHSGCU0Q1Nic3SyCSaClcHT/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAEFAgQGAwf/xAA1EQACAQMCAwUGBgEFAAAAAAAAAQIDBBEFMRIhQRNRcYGRBhQiM2HBMjShsdHw8SM1coLh/9oADAMBAAIRAxEAPwDsulKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKjNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozU0ApSlAKipPaooBSlKAUpSgFKUoBSlKAUpSgFKUoBSlKAUpSgFKUoBSlKAUpSgFKwN+1REsswszYU7yUhoqkoCC2kOOBsE+3yABOSePQAmvfYLtFvdqbuUIOBhxS0p8xPEngtSCce4lJI+GKnheMmKmm8dT31IqKkVBkKUpQA9qipPaooBSlKAUry3W4QbVbZNzuctmHCitKdffeWEobQkZKlE9AAKqjxD7l2S07Jzrrp3XEOFcrnHHzJIhuoeckqCklSWwAroRlJXj2OWcg4oC3UPMrecZQ62pxrHmICgVIyMjI9MiqB3r8TMDb7WFz0jB0nLul0txaDrr0pLEclxpDo4kBajhLg7pHXP11ytpqXrzSATq5Wp7zpqJf30Q5VyQFPyJKFtB8PcFEeakJUk8wsLHMhOTyFZxrTOj/AJ81M1rvVpU6bda0wr3KmPv+bMlxg8ZKMJ5OspICcODAbOSpKuNZYIydqRN29CHbuy66ud+iWq1XdKQyZLntJdIPNogZ9pBSoKx0HE+lax4gN9bbtcixtw7c1f5d0y/5KJflJRFA/dQsJVnkogJGMHCuvSuWvD5I0ZqNi4bcbkPLcsUZ1662+ZFlKCYshtB89CVp/McbSVAepQSPaUK8VovGn9e7hamvGp2oEdhu2oi2KzzJCWS0gOtNsNpC5EfJbZS4SPOSSpZIz2MYB2tsduhbN1tLyr5bLZNtwiTDDeZlFBPMIQvKSknKcLHU4PfpW9MvsvKcSy824Wl8HAhQPBWAeJx2OCDj4iuDtM6c1Zp23QbloC/aj05cbkIkhtJkf6skfK3neDKUqCgpbMZKHVrJdwlLgPEpydR2u1LfNB7qWS83HVUyz268TUy504OKcTcYhkKQt5bZBUsLUhwBS0cuvIY70wMnfOrNWqstyiQmYCZBkSG4wWt7gnzXPop7E+oyceowD1xsVtltz7fHmtJWhD7aXAleOScjODjpmtTut129u91s7b+obUubemf9XIamo5TWsFWUYPUYJwpOD1IB61uL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"

function fmtTime(t) {
  if (!t) return '—'
  const d = t.toDate ? t.toDate() : new Date(t)
  return d.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
}

// Sort haptiq IDs naturally: HL-2026-03-100001 < HL-2026-03-100002
function sortByHaptiqId(a, b) {
  const normalize = s => (s?.haptiq_id || '').replace(/-/g, ' ').trim().toLowerCase()
  return normalize(a).localeCompare(normalize(b), undefined, { numeric: true, sensitivity: 'base' })
}

export default function AdminDashboard() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetInput, setResetInput] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const navigate = useNavigate()
  const prevCountRef = useRef(0)

  useEffect(() => {
    // Fetch all students, sort client-side by haptiq_id
    const q = query(collection(db, 'students'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort(sortByHaptiqId)
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
    const matchFilter = filter === 'all' ? true : filter === 'verified' ? s.verified : !s.verified
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

  async function handleResetAll() {
    if (resetInput !== 'RESET') return
    setResetting(true)
    try {
      const verifiedStudents = students.filter(s => s.verified)
      const CHUNK = 400
      for (let i = 0; i < verifiedStudents.length; i += CHUNK) {
        const batch = writeBatch(db)
        verifiedStudents.slice(i, i + CHUNK).forEach(s => {
          batch.update(doc(db, 'students', s.id), { verified: false, verified_time: null })
        })
        await batch.commit()
      }
      setResetDone(true)
      setResetInput('')
      setTimeout(() => { setShowResetModal(false); setResetDone(false) }, 2000)
    } catch (err) {
      console.error(err)
      alert('Reset failed. Please try again.')
    }
    setResetting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src={LOGO_B64} alt="Indira University" className="h-12 object-contain mx-auto mb-4 opacity-60" />
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100 text-gray-800">
      {/* Header */}
      <header className="bg-stone-50 border-b border-stone-300 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src={LOGO_B64} alt="Indira University" className="h-10 object-contain" />
          <div>
            <h1 className="font-display font-bold text-sm leading-tight text-gray-900">Haptiq Pool Drive 2026</h1>
            <p className="text-gray-600 text-[10px]">Indira University · Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            LIVE
          </span>
          <button
            onClick={() => { setShowResetModal(true); setResetInput(''); setResetDone(false) }}
            className="text-rose-500 hover:text-rose-600 text-xs font-semibold transition px-2 py-1 border border-rose-200 rounded-lg hover:bg-rose-50">
            Reset All
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-700 text-xs transition px-2 py-1">
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
          <div className="bg-stone-50 border border-stone-300 rounded-2xl p-4 shadow-sm">
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Recently Verified</h2>
            <div className="space-y-2">
              {recent.map(s => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0" />
                    <span className="text-gray-800 font-medium">{s.name}</span>
                    <span className="text-gray-400 text-xs hidden sm:block">{s.college}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{fmtTime(s.verified_time)}</span>
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
            className="flex-1 bg-stone-50 border border-stone-300 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-300 shadow-sm"
          />
          <div className="flex gap-2">
            {['all', 'verified', 'pending'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition ${filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v4m0 0l-3-3m3 3l3-3M12 4v8" />
            </svg>
            Export Excel
          </button>
        </div>

        {/* Student Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-gray-700 text-xs font-semibold uppercase tracking-wide px-4 py-3">Name</th>
                  <th className="text-left text-gray-700 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Haptiq ID</th>
                  <th className="text-left text-gray-700 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="text-left text-gray-700 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden md:table-cell">College</th>
                  <th className="text-left text-gray-700 text-xs font-semibold uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-gray-700 text-xs font-semibold uppercase tracking-wide px-4 py-3 hidden sm:table-cell">Verified At</th>
                  <th className="text-left text-gray-700 text-xs font-semibold uppercase tracking-wide px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-gray-300 py-10">No students found</td></tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-stone-100 transition">
                    <td className="px-4 py-3 text-gray-800 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{s.haptiq_id}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{s.email}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{s.college}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.verified ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.verified ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        {s.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{fmtTime(s.verified_time)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleVerify(s)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border ${s.verified ? 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}>
                        {s.verified ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-gray-400 text-xs">
            Showing {filtered.length} of {students.length} students · Sorted by Haptiq ID
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            {resetDone ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-800 font-semibold">All records reset!</p>
                <p className="text-gray-400 text-xs mt-1">All students are now pending.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-bold text-sm">Reset All Attendance?</h3>
                    <p className="text-gray-400 text-xs">This will unverify all {verified.length} verified students.</p>
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 mb-4">
                  <p className="text-rose-500 text-xs font-medium">⚠️ This cannot be undone. All verification timestamps will be cleared.</p>
                </div>
                <p className="text-gray-500 text-xs mb-2">Type <span className="font-mono font-bold text-gray-900">RESET</span> to confirm:</p>
                <input
                  type="text"
                  value={resetInput}
                  onChange={e => setResetInput(e.target.value.toUpperCase())}
                  placeholder="Type RESET here"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-400 mb-4 placeholder-gray-300"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowResetModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold transition">
                    Cancel
                  </button>
                  <button onClick={handleResetAll}
                    disabled={resetInput !== 'RESET' || resetting}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {resetting ? (
                      <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Resetting...</>
                    ) : 'Reset All'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-60 mb-1">{label}</p>
      <p className="font-display text-3xl font-bold">{value}</p>
    </div>
  )
}
