// src/pages/AdminPage.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from '../components/AdminLogin';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  const { user, loading: authLoading, error, signIn, signOut, setError } = useAuth();

  // Still checking auth state
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLogin
        onLogin={signIn}
        loading={authLoading}
        error={error}
      />
    );
  }

  return <AdminDashboard user={user} onSignOut={signOut} />;
}
