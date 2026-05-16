import React, { useState } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

const LOGO_URL = 'https://www.indiraedu.com/wp-content/uploads/2021/03/Indira-Group-of-Institutes-Logo.png'

function IndiraLogo() {
  return (
    <div className="flex flex-col items-center mb-6">
      <img
        src={LOGO_URL}
        alt="Indira University"
        className="h-16 object-contain mb-3"
        onError={e => { e.target.style.display = 'none' }}
      />
      <div className="text-center">
        <p className="text-[11px] font-semibold tracking-widest text-indigo-400 uppercase">Indira University</p>
        <h1 className="font-display text-lg font-bold text-white leading-tight mt-0.5">
          Haptiq Pool Campus Drive 2026
        </h1>
      </div>
    </div>
  )
}

export default function StudentPage() {
  const [haptiqId, setHaptiqId] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | loading | success | already | invalid | error
  const [studentData, setStudentData] = useState(null)

  async function handleVerify(e) {
    e.preventDefault()
    if (!haptiqId.trim() || !email.trim()) return
    setState('loading')

    try {
      const q = query(
        collection(db, 'students'),
        where('haptiq_id', '==', haptiqId.trim().toUpperCase()),
        where('email', '==', email.trim().toLowerCase())
      )
      const snap = await getDocs(q)

      if (snap.empty) {
        setState('invalid')
        return
      }

      const docSnap = snap.docs[0]
      const data = docSnap.data()

      if (data.verified) {
        setStudentData(data)
        setState('already')
        return
      }

      // Mark verified
      await updateDoc(doc(db, 'students', docSnap.id), {
        verified: true,
        verified_time: Timestamp.now(),
      })

      setStudentData({ ...data, verified_time: new Date() })
      setState('success')
    } catch (err) {
      console.error(err)
      setState('error')
    }
  }

  function reset() {
    setState('idle')
    setHaptiqId('')
    setEmail('')
    setStudentData(null)
  }

  const fmtTime = (t) => {
    if (!t) return ''
    const d = t.toDate ? t.toDate() : new Date(t)
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  }

  // ── SUCCESS ──
  if (state === 'success') {
    return (
      <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-emerald-700 mb-1">Verified!</h2>
          <p className="text-gray-500 text-sm mb-6">You're all set for the drive</p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-4">
            <Row label="Name" value={studentData?.name} />
            <Row label="College" value={studentData?.college} />
            <Row label="Haptiq ID" value={studentData?.haptiq_id} />
            <Row label="Time" value={fmtTime(studentData?.verified_time)} />
          </div>
          <div className="bg-emerald-600 text-white rounded-xl py-3 px-4 text-center">
            <p className="text-xs font-medium tracking-widest uppercase opacity-80">Status</p>
            <p className="font-display font-bold text-lg">VERIFIED SUCCESSFULLY</p>
          </div>
          <p className="text-gray-400 text-xs mt-4">Please proceed to the venue. Show this screen to the coordinator.</p>
        </div>
      </div>
    )
  }

  // ── ALREADY VERIFIED ──
  if (state === 'already') {
    return (
      <div className="min-h-screen bg-amber-500 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-amber-700 mb-1">Already Verified</h2>
          <p className="text-gray-500 text-sm mb-6">Your entry has been recorded</p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-4">
            <Row label="Name" value={studentData?.name} />
            <Row label="College" value={studentData?.college} />
            <Row label="Verified At" value={fmtTime(studentData?.verified_time)} />
          </div>
          <div className="bg-amber-500 text-white rounded-xl py-3 px-4 text-center">
            <p className="font-display font-bold text-lg">ALREADY VERIFIED</p>
          </div>
          <p className="text-gray-400 text-xs mt-4">If you think this is a mistake, visit the help desk.</p>
        </div>
      </div>
    )
  }

  // ── INVALID ──
  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-rose-600 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-rose-700 mb-1">Invalid Details</h2>
          <p className="text-gray-500 text-sm mb-6">We couldn't find your registration</p>
          <div className="bg-rose-600 text-white rounded-xl py-4 px-4 text-center mb-4">
            <p className="font-display font-bold text-lg">INVALID DETAILS</p>
            <p className="text-sm opacity-90 mt-1">PLEASE VISIT HELP DESK</p>
          </div>
          <button onClick={reset} className="w-full mt-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── ERROR ──
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl p-8 text-center max-w-sm w-full">
          <p className="text-gray-700 font-semibold mb-2">Connection Error</p>
          <p className="text-gray-400 text-sm mb-4">Please check your internet and try again.</p>
          <button onClick={reset} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold">Retry</button>
        </div>
      </div>
    )
  }

  // ── MAIN FORM ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#1a1560] to-[#24243e] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <IndiraLogo />

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 shadow-2xl">
          <p className="text-white/60 text-xs text-center mb-5 tracking-wide uppercase">Student Verification Portal</p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-white/80 text-xs font-semibold mb-1.5 tracking-wide uppercase">Haptiq ID</label>
              <input
                type="text"
                value={haptiqId}
                onChange={e => setHaptiqId(e.target.value)}
                placeholder="e.g. HQ2026XXXX"
                className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                autoComplete="off"
                autoCapitalize="characters"
                required
              />
            </div>

            <div>
              <label className="block text-white/80 text-xs font-semibold mb-1.5 tracking-wide uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={state === 'loading'}
              className="w-full mt-2 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-display font-bold text-base tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
            >
              {state === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Verifying...
                </span>
              ) : 'Verify My Entry'}
            </button>
          </form>
        </div>

        <p className="text-white/30 text-xs text-center mt-6">
          Indira University · Haptiq Pool Campus Drive 2026
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-gray-400 text-xs font-medium whitespace-nowrap">{label}</span>
      <span className="text-gray-800 text-xs font-semibold text-right">{value || '—'}</span>
    </div>
  )
}
