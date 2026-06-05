"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const C = { primary: '#8B9E23', primaryDark: '#6B7A1A', border: '#E5E7EB', text: '#1a1a1a', muted: '#6B7280' };

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push('/');
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      if (data.session) {
        router.push('/');
        router.refresh();
      } else {
        setInfo('Account created. Check your email to confirm, then sign in.');
        setMode('signin');
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FBFCF8' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <img src="/jetwing-logo.svg" alt="Jetwing" className="w-9 h-9" />
          <span className="text-2xl font-bold tracking-tight" style={{ color: C.primary }}>JetMind</span>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-7" style={{ borderColor: C.border }}>
          <h1 className="text-lg font-bold" style={{ color: C.text }}>
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="text-sm mt-1 mb-6" style={{ color: C.muted }}>
            Jetwing Symphony
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text }}>Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                style={{ borderColor: C.border }}
                placeholder="you@jetwingsymphony.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: C.text }}>Password</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
                style={{ borderColor: C.border }}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>}
            {info && <p className="text-sm" style={{ color: C.primary }}>{info}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: C.primary }}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setInfo(null); }}
            className="w-full text-center text-xs mt-5"
            style={{ color: C.muted }}
          >
            {mode === 'signin'
              ? "No account yet? Create one"
              : 'Already have an account? Sign in'}
          </button>
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: C.muted }}>
          New here? After your first sign-in, call <code>POST /api/v1/admin/bootstrap</code> to claim the first ADMIN role.
        </p>
      </div>
    </div>
  );
}
