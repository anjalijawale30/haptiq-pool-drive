import React, { useState } from 'react'
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Indira University logo embedded (works offline, no CORS issues)
const LOGO_URL = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADhAOEDASIAAhEBAxEB/8QAHQABAAIDAQEBAQAAAAAAAAAAAAEHBQYIBAIJA//EAE4QAAEDAwMCAwMGBg4JBQEAAAECAwQABREGBxIhMQgTQSJRYRQVMnGBsxYjN0JSchckMzZWY3WRkpShsdHSGCU0Q1Nic3SyCSaClcHT/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAEFAgQGAwf/xAA1EQACAQMCAwUGBgEFAAAAAAAAAQIDBBEFMRIhQRNRcYGRBhQiM2HBMjShsdHw8SM1coLh/9oADAMBAAIRAxEAPwDsulKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKUApSlAKUpQClKjNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozTNATSozU0ApSlAKipPaooBSlKAUpSgFKUoBSlKAUpSgFKUoBSlKAUpSgFKUoBSlKAUpSgFKwN+1REsswszYU7yUhoqkoCC2kOOBsE+3yABOSePQAmvfYLtFvdqbuUIOBhxS0p8xPEngtSCce4lJI+GKnheMmKmm8dT31IqKkVBkKUpQA9qipPaooBSlKAUry3W4QbVbZNzuctmHCitKdffeWEobQkZKlE9AAKqjxD7l2S07Jzrrp3XEOFcrnHHzJIhuoeckqCklSWwAroRlJXj2OWcg4oC3UPMrecZQ62pxrHmICgVIyMjI9MiqB3r8TMDb7WFz0jB0nLul0txaDrr0pLEclxpDo4kBajhLg7pHXP11ytpqXrzSATq5Wp7zpqJf30Q5VyQFPyJKFtB8PcFEeakJUk8wsLHMhOTyFZxrTOj/AJ81M1rvVpU6bda0wr3KmPv+bMlxg8ZKMJ5OspICcODAbOSpKuNZYIydqRN29CHbuy66ud+iWq1XdKQyZLntJdIPNogZ9pBSoKx0HE+lax4gN9bbtcixtw7c1f5d0y/5KJflJRFA/dQsJVnkogJGMHCuvSuWvD5I0ZqNi4bcbkPLcsUZ1662+ZFlKCYshtB89CVp/McbSVAepQSPaUK8VovGn9e7hamvGp2oEdhu2oi2KzzJCWS0gOtNsNpC5EfJbZS4SPOSSpZIz2MYB2tsduhbN1tLyr5bLZNtwiTDDeZlFBPMIQvKSknKcLHU4PfpW9MvsvKcSy824Wl8HAhQPBWAeJx2OCDj4iuDtM6c1Zp23QbloC/aj05cbkIkhtJkf6skfK3neDKUqCgpbMZKHVrJdwlLgPEpydR2u1LfNB7qWS83HVUyz268TUy504OKcTcYhkKQt5bZBUsLUhwBS0cuvIY70wMnfOrNWqstyiQmYCZBkSG4wWt7gnzXPop7E+oyceowD1xsVtltz7fHmtJWhD7aXAleOScjODjpmtTut129u91s7b+obUubemf9XIamo5TWsFWUYPUYJwpOD1IB61uL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"

function IndiraLogo() {
  return (
    <div className="flex flex-col items-center mb-6">
      <img
        src={LOGO_URL}
        alt="Indira University"
        className="h-20 object-contain mb-3"
      />
      <div className="text-center">
        <p className="text-[11px] font-semibold tracking-widest text-indigo-500 uppercase">Indira University</p>
        <h1 className="font-display text-lg font-bold text-gray-900 leading-tight mt-0.5">
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

    // Normalize entered ID
    const enteredId = haptiqId
      .trim()
      .toUpperCase()
      .replace(/-/g, '')

    // Get all students with same email
    const q = query(
      collection(db, 'students'),
      where('email', '==', email.trim().toLowerCase())
    )

    const snap = await getDocs(q)

    if (snap.empty) {
      setState('invalid')
      return
    }

    // Find matching Haptiq ID manually
    let matchedDoc = null

    snap.forEach((d) => {
      const data = d.data()

      const dbId = (data.haptiq_id || '')
        .toUpperCase()
        .replace(/-/g, '')

      if (dbId === enteredId) {
        matchedDoc = {
          id: d.id,
          data
        }
      }
    })

    if (!matchedDoc) {
      setState('invalid')
      return
    }

    const data = matchedDoc.data

    // Already verified
    if (data.verified) {
      setStudentData(data)
      setState('already')
      return
    }

    // Update verification
    await updateDoc(doc(db, 'students', matchedDoc.id), {
      verified: true,
      verified_time: Timestamp.now(),
    })

    setStudentData({
      ...data,
      verified_time: new Date()
    })

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
      <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 w-full max-w-sm p-8 text-center">
          <img src={LOGO_URL} alt="Indira University" className="h-14 object-contain mx-auto mb-5" />
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-emerald-700 mb-1">Verified!</h2>
          <p className="text-gray-500 text-sm mb-6">You're all set for the drive</p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-4 border border-gray-100">
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
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-xl border border-amber-100 w-full max-w-sm p-8 text-center">
          <img src={LOGO_URL} alt="Indira University" className="h-14 object-contain mx-auto mb-5" />
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-amber-700 mb-1">Already Verified</h2>
          <p className="text-gray-500 text-sm mb-6">Your entry has been recorded</p>
          <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2 mb-4 border border-gray-100">
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
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-xl border border-rose-100 w-full max-w-sm p-8 text-center">
          <img src={LOGO_URL} alt="Indira University" className="h-14 object-contain mx-auto mb-5" />
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
          <button onClick={reset} className="w-full mt-2 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ── ERROR ──
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-5">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center max-w-sm w-full">
          <p className="text-gray-700 font-semibold mb-2">Connection Error</p>
          <p className="text-gray-400 text-sm mb-4">Please check your internet and try again.</p>
          <button onClick={reset} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold">Retry</button>
        </div>
      </div>
    )
  }

  // ── MAIN FORM ──
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <IndiraLogo />

        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
          <p className="text-gray-400 text-xs text-center mb-5 tracking-wide uppercase font-medium">Student Verification Portal</p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1.5 tracking-wide uppercase">Haptiq ID</label>
              <input
                type="text"
                value={haptiqId}
                onChange={e => setHaptiqId(e.target.value)}
                placeholder="e.g. HL-2026-03-XXXXXX"
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                autoComplete="off"
                autoCapitalize="characters"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1.5 tracking-wide uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={state === 'loading'}
              className="w-full mt-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-display font-bold text-base tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
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

        <p className="text-gray-300 text-xs text-center mt-6">
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
