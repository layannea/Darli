'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UserData = {
  id: string; name: string | null; email: string | null
  phone: string | null; avatar: string | null; createdAt: string
  googleId: string | null
}

function InfoRow({
  label, value, icon, action
}: {
  label: string; value: string | null; icon: React.ReactNode; action?: React.ReactNode
}) {
  return (
    <div className="settings-info-row">
      <div className="settings-info-icon">{icon}</div>
      <div className="settings-info-content" style={{ flex: 1 }}>
        <div className="settings-info-label">{label}</div>
        <div className="settings-info-value">
          {value || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Name
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')

  // Phone
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneVal, setPhoneVal] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneSuccess, setPhoneSuccess] = useState(false)
  const [phoneError, setPhoneError] = useState('')

  // Password
  const [showPw, setShowPw] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  const fetchUser = () =>
    fetch('/api/settings').then(r => r.json()).then(d => {
      setUser(d.user)
      setNameVal(d.user?.name || '')
      setPhoneVal(d.user?.phone || '')
      setLoading(false)
    })

  useEffect(() => { fetchUser() }, [])

  const saveName = async () => {
    setNameError(''); setNameLoading(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameVal }),
    })
    if (!res.ok) { const d = await res.json(); setNameError(d.error || 'Failed'); setNameLoading(false); return }
    await fetchUser()
    setNameSuccess(true); setNameLoading(false); setEditingName(false)
    setTimeout(() => setNameSuccess(false), 2500)
  }

  const savePhone = async () => {
    setPhoneError(''); setPhoneLoading(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneVal }),
    })
    const data = await res.json()
    if (!res.ok) { setPhoneError(data.error || 'Failed'); setPhoneLoading(false); return }
    await fetchUser()
    setPhoneSuccess(true); setPhoneLoading(false); setEditingPhone(false)
    setTimeout(() => setPhoneSuccess(false), 2500)
  }

  const savePassword = async () => {
    setPwError(''); setPwSuccess(false)
    if (newPw !== confirmPw) { setPwError('Passwords do not match'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setPwLoading(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    })
    const data = await res.json()
    if (!res.ok) { setPwError(data.error || 'Failed'); setPwLoading(false); return }
    setPwSuccess(true); setPwLoading(false)
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setTimeout(() => { setPwSuccess(false); setShowPw(false) }, 2000)
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] || '?').toUpperCase()

  if (loading) return (
    <div className="settings-page">
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    </div>
  )

  return (
    <div className="settings-page">
      <div className="settings-container">

        {/* Header */}
        <div className="settings-header">
          <button className="btn-ghost btn-sm" onClick={() => router.push('/dashboard')} style={{ alignSelf: 'flex-start' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <div>
            <h1 className="settings-page-title">Settings</h1>
            <p className="settings-page-sub">Manage your account</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-section-title">Profile</div>
            {(nameSuccess || phoneSuccess) && (
              <span className="status-pill accepted" style={{ fontSize: 11 }}>✓ Saved</span>
            )}
          </div>

          {/* Avatar + name */}
          <div className="profile-hero" style={{ marginBottom: 20 }}>
            <div className="profile-avatar-lg">
              {user?.avatar
                ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : <span>{initials}</span>}
            </div>
            <div className="profile-hero-info">
              {editingName ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    className="field-input"
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    placeholder="Your full name"
                    style={{ maxWidth: 220, padding: '8px 12px', fontSize: 13 }}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    autoFocus
                  />
                  <button className="btn-primary btn-sm" onClick={saveName} disabled={nameLoading} style={{ minWidth: 60 }}>
                    {nameLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save'}
                  </button>
                  <button className="btn-ghost btn-sm" onClick={() => { setEditingName(false); setNameVal(user?.name || '') }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="profile-hero-name">{user?.name || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 16 }}>No name set</span>}</div>
                  <button className="icon-btn" onClick={() => setEditingName(true)} title="Edit name">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>
              )}
              {nameError && <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>{nameError}</div>}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Member since {new Date(user?.createdAt || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div style={{ marginTop: 8 }}>
                <Link href={`/profile/${user?.id}`} className="btn-ghost btn-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  View my public profile
                </Link>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 4 }}>
            <InfoRow
              label="Email address"
              value={user?.email || null}
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}
            />

            {/* Phone — editable */}
            {editingPhone ? (
              <div className="settings-info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <div className="settings-info-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="settings-info-label">Phone number</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      <input
                        className="field-input"
                        type="tel"
                        placeholder="+1 555 000 0000"
                        value={phoneVal}
                        onChange={e => setPhoneVal(e.target.value)}
                        style={{ maxWidth: 220, padding: '8px 12px', fontSize: 13 }}
                        onKeyDown={e => e.key === 'Enter' && savePhone()}
                        autoFocus
                      />
                      <button className="btn-primary btn-sm" onClick={savePhone} disabled={phoneLoading} style={{ minWidth: 60 }}>
                        {phoneLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save'}
                      </button>
                      <button className="btn-ghost btn-sm" onClick={() => { setEditingPhone(false); setPhoneVal(user?.phone || '') }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
                {phoneError && <div style={{ fontSize: 12, color: 'var(--error)', paddingLeft: 44 }}>{phoneError}</div>}
              </div>
            ) : (
              <InfoRow
                label="Phone number"
                value={user?.phone || null}
                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>}
                action={
                  <button className="btn-ghost btn-sm" onClick={() => setEditingPhone(true)}>
                    {user?.phone ? 'Edit' : '+ Add'}
                  </button>
                }
              />
            )}

            {user?.googleId && (
              <InfoRow
                label="Google account"
                value="Connected"
                icon={
                  <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                    <path d="M47.532 24.552c0-1.636-.132-3.196-.388-4.692H24v9.27h13.204c-.584 3.028-2.28 5.596-4.792 7.292v5.996h7.696c4.524-4.172 7.424-10.324 7.424-17.866z" fill="#4285F4"/>
                    <path d="M24 48c6.48 0 11.916-2.148 15.892-5.82l-7.696-5.996c-2.148 1.444-4.908 2.3-8.196 2.3-6.308 0-11.648-4.26-13.556-9.988H2.46v6.188C6.42 42.836 14.58 48 24 48z" fill="#34A853"/>
                    <path d="M10.444 28.496A14.434 14.434 0 0 1 9.6 24c0-1.568.268-3.092.844-4.496v-6.188H2.46A23.976 23.976 0 0 0 0 24c0 3.86.924 7.524 2.46 10.684l7.984-6.188z" fill="#FBBC05"/>
                    <path d="M24 9.516c3.548 0 6.74 1.22 9.248 3.616l6.872-6.872C35.9 2.38 30.476 0 24 0 14.58 0 6.42 5.164 2.46 13.316l7.984 6.188C12.352 13.776 17.692 9.516 24 9.516z" fill="#EA4335"/>
                  </svg>
                }
              />
            )}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
            Email cannot be changed. Phone can be added or updated here.
          </p>
        </div>

        {/* Password card */}
        {!(user?.googleId && !user?.email) && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-section-title">Password</div>
              {pwSuccess && <span className="status-pill accepted" style={{ fontSize: 11 }}>✓ Updated</span>}
            </div>

            {!showPw ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>••••••••••••</div>
                <button className="btn-ghost btn-sm" onClick={() => setShowPw(true)}>Change password</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {!user?.googleId && (
                  <div className="field-group">
                    <label className="field-label">Current password</label>
                    <input className="field-input" type="password" placeholder="••••••••" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                  </div>
                )}
                <div className="field-group">
                  <label className="field-label">New password</label>
                  <input className="field-input" type="password" placeholder="Minimum 8 characters" value={newPw} onChange={e => setNewPw(e.target.value)} />
                </div>
                <div className="field-group">
                  <label className="field-label">Confirm new password</label>
                  <input className="field-input" type="password" placeholder="••••••••" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                </div>
                {pwError && (
                  <div className="error-msg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /></svg>
                    {pwError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" onClick={savePassword} disabled={pwLoading} style={{ maxWidth: 160 }}>
                    {pwLoading ? <span className="spinner" /> : 'Update Password'}
                  </button>
                  <button className="btn-ghost" onClick={() => { setShowPw(false); setPwError(''); setCurrentPw(''); setNewPw(''); setConfirmPw('') }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Account / sign out */}
        <div className="settings-card" style={{ borderColor: 'rgba(242,87,87,0.2)' }}>
          <div className="settings-section-title" style={{ color: 'var(--error)', marginBottom: 14 }}>Account</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Sign out</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>
                Sign out of your Darli account on this device
              </div>
            </div>
            <button
              className="btn-ghost btn-sm"
              style={{ borderColor: 'rgba(242,87,87,0.3)', color: 'var(--error)' }}
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/auth'
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}