// src/components/AdminLogin.jsx
import React, { useState } from 'react';

export default function AdminLogin({ onLogin, loading, error }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]       = useState(false);

  const submit = (e) => {
    e.preventDefault();
    onLogin(email.trim(), password);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-5">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg font-mono">H</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Haptiq Admin</p>
            <p className="text-gray-500 text-xs">Pool Drive 2026</p>
          </div>
        </div>

        <h1 className="text-white text-2xl font-bold mb-1">Sign In</h1>
        <p className="text-gray-400 text-sm mb-8">Coordinator access only</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="coordinator@email.com"
              required
              className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-600
                rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-600
                  rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                  focus:border-transparent transition pr-11"
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold
              py-3 rounded-xl transition-colors disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-700 text-xs mt-8">
          Restricted access · Haptiq Pool Drive 2026
        </p>
      </div>
    </div>
  );
}
