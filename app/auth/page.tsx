'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Mode = 'login' | 'signup'
type SignupMethod = 'email' | 'phone'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<Mode>('login')
  const [method, setMethod] = useState<SignupMethod>('email')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  // Email verification state
  const [verifyState, setVerifyState] = useState<{ userId: string; email: string } | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err === 'google_denied') setError('Google sign-in was cancelled.')
    if (err === 'google_failed') setError('Google sign-in failed. Please try again.')
  }, [searchParams])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setIdentifier('')
    setEmail('')
    setPhone('')
    setPassword('')
    setConfirm('')
    setName('')
    setVerifyState(null)
    setVerifyCode('')
    setVerifyError('')
  }

  const startResendCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setSubmitLoading(true)

    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = mode === 'login'
        ? { identifier, password }
        : {
            name,
            email: method === 'email' ? email : undefined,
            phone: method === 'phone' ? phone : undefined,
            password,
            method,
          }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      // Email signup → show verification screen
      if (data.requiresVerification) {
        setVerifyState({ userId: data.userId, email: data.email })
        startResendCooldown()
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifyError('')
    if (!verifyCode || verifyCode.length !== 6) {
      setVerifyError('Enter the 6-digit code')
      return
    }
    setVerifyLoading(true)

    try {
      const verRes = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: verifyState?.userId, code: verifyCode }),
      })
      const verData = await verRes.json()
      if (!verRes.ok) {
        setVerifyError(verData.error || 'Invalid code')
        return
      }

      // Set session cookie now that email is verified
      await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: verifyState?.userId }),
      })

      router.push('/dashboard')
      router.refresh()
    } catch {
      setVerifyError('Something went wrong. Please try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setVerifyError('')
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: verifyState?.userId }),
      })
      if (res.ok) {
        startResendCooldown()
      } else {
        const d = await res.json()
        setVerifyError(d.error || 'Failed to resend')
      }
    } catch {
      setVerifyError('Failed to resend. Try again.')
    } finally {
      setResendLoading(false)
    }
  }

  // ── EMAIL VERIFICATION SCREEN ──
  if (verifyState) {
    return (
      <main style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 9, marginBottom: 36, fontSize: 17, fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.02em',
          }}>
            <span className="brand-dot" />
            Darli
          </div>

          {/* Icon + heading */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 56, height: 56, background: 'var(--accent-dim)',
              border: '1px solid rgba(124,111,250,0.2)', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent)', marginBottom: 20,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', margin: '0 0 8px' }}>
              Check your email
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65 }}>
              We sent a 6-digit code to<br />
              <strong style={{ color: 'var(--text)' }}>{verifyState.email}</strong>
            </p>
          </div>

          {/* Code input + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field-group">
              <label className="field-label">Verification code</label>
              <input
                className="field-input"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{
                  textAlign: 'center', fontSize: 28, fontWeight: 700,
                  letterSpacing: '0.25em', fontFamily: 'monospace', padding: '14px',
                }}
                autoFocus
              />
            </div>

            {verifyError && (
              <div className="error-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {verifyError}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleVerify}
              disabled={verifyLoading || verifyCode.length !== 6}
            >
              {verifyLoading ? <span className="spinner" /> : 'Verify Email'}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: resendCooldown > 0 || resendLoading ? 'var(--text-muted)' : 'var(--accent)',
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
                  cursor: resendCooldown > 0 || resendLoading ? 'default' : 'pointer',
                }}
                onClick={resendCooldown > 0 || resendLoading ? undefined : handleResend}
                disabled={resendLoading || resendCooldown > 0}
              >
                {resendLoading ? 'Sending…' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </button>
            </div>

            {/* Back */}
            <button
              type="button"
              className="btn-ghost"
              style={{ alignSelf: 'center' }}
              onClick={() => {
                setVerifyState(null)
                setVerifyCode('')
                setVerifyError('')
              }}
            >
              ← Back to sign up
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── MAIN AUTH SCREEN ──
  return (
    <main className="auth-wrapper">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="brand-logo">
          <span className="brand-dot" />
          Darli
        </div>
        <div className="brand-content">
          <div className="orb" />
          <div className="orb orb-2" />
          <h1 className="brand-headline">DARLI</h1>
          <p className="brand-sub">The Housing Financial Platform</p>
          <p className="brand-sub">Free for Renters. Free for Landlords. Built on Trust.</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="form-container">
          <div className="mobile-logo">
            <span className="brand-dot" />
            Darli
          </div>

          <div className="tab-switcher">
            <button
              type="button"
              className={`tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>

          <div className="form-header">
            <h2 className="form-title">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="form-sub">
              {mode === 'login' ? 'Sign in to your Darli account' : 'Get started — it only takes a minute'}
            </p>
          </div>

          <a href="/api/auth/google" className="btn-google">
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M47.532 24.552c0-1.636-.132-3.196-.388-4.692H24v9.27h13.204c-.584 3.028-2.28 5.596-4.792 7.292v5.996h7.696c4.524-4.172 7.424-10.324 7.424-17.866z" fill="#4285F4"/>
              <path d="M24 48c6.48 0 11.916-2.148 15.892-5.82l-7.696-5.996c-2.148 1.444-4.908 2.3-8.196 2.3-6.308 0-11.648-4.26-13.556-9.988H2.46v6.188C6.42 42.836 14.58 48 24 48z" fill="#34A853"/>
              <path d="M10.444 28.496A14.434 14.434 0 0 1 9.6 24c0-1.568.268-3.092.844-4.496v-6.188H2.46A23.976 23.976 0 0 0 0 24c0 3.86.924 7.524 2.46 10.684l7.984-6.188z" fill="#FBBC05"/>
              <path d="M24 9.516c3.548 0 6.74 1.22 9.248 3.616l6.872-6.872C35.9 2.38 30.476 0 24 0 14.58 0 6.42 5.164 2.46 13.316l7.984 6.188C12.352 13.776 17.692 9.516 24 9.516z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>

          <div className="divider"><span>or</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="field-group">
                <label className="field-label">Full name</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            {mode === 'signup' && (
              <div className="method-toggle">
                <button
                  type="button"
                  className={`method-btn ${method === 'email' ? 'active' : ''}`}
                  onClick={() => setMethod('email')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email
                </button>
                <button
                  type="button"
                  className={`method-btn ${method === 'phone' ? 'active' : ''}`}
                  onClick={() => setMethod('phone')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Phone
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="field-group">
                <label className="field-label">Email or phone</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="you@example.com or +1 555 0100"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            )}

            {mode === 'signup' && method === 'email' && (
              <div className="field-group">
                <label className="field-label">Email address</label>
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            )}

            {mode === 'signup' && method === 'phone' && (
              <div className="field-group">
                <label className="field-label">Phone number</label>
                <input
                  className="field-input"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>
            )}

            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label">Password</label>
                {mode === 'login' && <a href="#" className="forgot-link">Forgot password?</a>}
              </div>
              <input
                className="field-input"
                type="password"
                placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {mode === 'signup' && (
              <div className="field-group">
                <label className="field-label">Confirm password</label>
                <input
                  className="field-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            {error && (
              <div className="error-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={submitLoading}>
              {submitLoading ? (
                <span className="spinner" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="terms-text">
              By creating an account you agree to our{' '}
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          )}

          <p className="switch-mode">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}