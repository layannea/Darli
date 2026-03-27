'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type PaymentRecord = {
  id: string; amount: number; month: string; paidAt: string
  isLate: boolean; unitNumber: string; buildingAddress: string
}

type Profile = {
  id: string; name: string | null; role: string; memberSince: string
  avatar: string | null; verified: boolean
  totalBuildings?: number; totalUnits?: number
  contact?: { email: string | null; phone: string | null } | null
  latePayments?: number; totalPayments?: number; onTimeRate?: number
  recentPayments?: PaymentRecord[]
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'short', year: 'numeric' })
}

export default function PublicProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/profile/${userId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setProfile(d.profile)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load profile'); setLoading(false) })
  }, [userId])

  const initials = profile?.name
    ? profile.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="settings-page">
      <div className="settings-container" style={{ maxWidth: 620 }}>
        <button
          className="btn-ghost btn-sm"
          onClick={() => router.back()}
          style={{ alignSelf: 'flex-start', marginBottom: 16 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : error ? (
          <div className="error-msg">{error}</div>
        ) : profile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── PROFILE HEADER ── */}
            <div className="settings-card">
              <div className="profile-hero">
                <div className="profile-avatar-lg">
                  {profile.avatar
                    ? <img src={profile.avatar} alt={profile.name || ''} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : <span>{initials}</span>}
                </div>
                <div className="profile-hero-info">
                  <div className="profile-hero-name">{profile.name || 'Anonymous'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 4 }}>
                    <span className={`status-pill ${profile.role === 'landlord' ? 'accepted' : 'invited'}`} style={{ fontSize: 11 }}>
                      {profile.role === 'landlord' ? '🏠 Landlord' : '🔑 Tenant'}
                    </span>
                    {profile.verified && (
                      <span className="status-pill accepted" style={{ fontSize: 11 }}>✓ Verified</span>
                    )}
                    {profile.role === 'tenant' && profile.latePayments !== undefined && (
                      <span
                        className={`status-pill ${profile.latePayments === 0 ? 'accepted' : 'due'}`}
                        style={{ fontSize: 11 }}
                      >
                        {profile.latePayments === 0 ? '✓ On-time payer' : `${profile.latePayments} late payment${profile.latePayments !== 1 ? 's' : ''}`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                    Member since {formatDate(profile.memberSince)}
                  </div>
                </div>
              </div>
            </div>

            {/* ── LANDLORD: properties ── */}
            {profile.role === 'landlord' && (
              <div className="settings-card">
                <div className="settings-section-title" style={{ marginBottom: 14 }}>Properties</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="profile-stat-box">
                    <div className="profile-stat-value">{profile.totalBuildings ?? 0}</div>
                    <div className="profile-stat-label">Buildings</div>
                  </div>
                  <div className="profile-stat-box">
                    <div className="profile-stat-value">{profile.totalUnits ?? 0}</div>
                    <div className="profile-stat-label">Units managed</div>
                  </div>
                </div>
                {profile.contact && (profile.contact.email || profile.contact.phone) && (
                  <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="settings-section-title">Contact</div>
                    {profile.contact.email && (
                      <div className="profile-contact-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                        <a href={`mailto:${profile.contact.email}`} className="contact-popover-link">{profile.contact.email}</a>
                      </div>
                    )}
                    {profile.contact.phone && (
                      <div className="profile-contact-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        <a href={`tel:${profile.contact.phone}`} className="contact-popover-link">{profile.contact.phone}</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TENANT: payment stats ── */}
            {profile.role === 'tenant' && profile.latePayments !== undefined && (
              <>
                <div className="settings-card">
                  <div className="settings-section-title" style={{ marginBottom: 14 }}>
                    Payment Record — Last 24 Months
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div className="profile-stat-box">
                      <div className="profile-stat-value">{profile.totalPayments ?? 0}</div>
                      <div className="profile-stat-label">Payments</div>
                    </div>
                    <div className="profile-stat-box">
                      <div className={`profile-stat-value ${(profile.latePayments ?? 0) > 0 ? 'late' : 'good'}`}>
                        {profile.latePayments ?? 0}
                      </div>
                      <div className="profile-stat-label">Late</div>
                    </div>
                    <div className="profile-stat-box">
                      <div className={`profile-stat-value ${(profile.onTimeRate ?? 100) >= 90 ? 'good' : (profile.onTimeRate ?? 100) >= 70 ? '' : 'late'}`}>
                        {profile.onTimeRate ?? 100}%
                      </div>
                      <div className="profile-stat-label">On-time</div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>Payment reliability</span>
                      <span style={{ color: (profile.onTimeRate ?? 100) >= 90 ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                        {(profile.onTimeRate ?? 100) >= 95 ? 'Excellent' : (profile.onTimeRate ?? 100) >= 80 ? 'Good' : 'Needs attention'}
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${profile.onTimeRate ?? 100}%`,
                        borderRadius: 99,
                        background: (profile.onTimeRate ?? 100) >= 90 ? 'var(--success)' : (profile.onTimeRate ?? 100) >= 70 ? 'var(--warning)' : 'var(--error)',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>

                  {(profile.latePayments ?? 0) === 0 && (
                    <div className="rent-paid-msg" style={{ marginTop: 14 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                      Perfect record — no late payments in the last 24 months
                    </div>
                  )}
                </div>

                {/* ── Transaction history ── */}
                {profile.recentPayments && profile.recentPayments.length > 0 && (
                  <div className="settings-card">
                    <div className="settings-section-title" style={{ marginBottom: 14 }}>Transaction History</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {profile.recentPayments.map(p => (
                        <div key={p.id} className="profile-payment-row">
                          <div className="profile-payment-left">
                            <div className={`profile-payment-dot ${p.isLate ? 'late' : 'ontime'}`} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                                {formatMonth(p.month)}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>
                                Unit {p.unitNumber} · {p.buildingAddress}
                                {p.isLate && (
                                  <span style={{ color: 'var(--error)', marginLeft: 6, fontWeight: 500 }}>Late</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                              ${p.amount.toLocaleString()}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                              {new Date(p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.recentPayments && profile.recentPayments.length === 0 && (
                  <div className="settings-card">
                    <div className="settings-section-title" style={{ marginBottom: 10 }}>Transaction History</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>
                      No payments recorded in the last 24 months.
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}