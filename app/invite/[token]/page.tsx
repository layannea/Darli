'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type InviteInfo = {
  id: string
  unitNumber: string
  buildingAddress: string
  buildingCity: string
  buildingState: string
  landlordName: string
  inviteName: string | null
  bedrooms: number | null
  bathrooms: number | null
  sqft: number | null
  status: string
}

export default function InvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setInvite(d.invite)
        setLoading(false)
      })
      .catch(() => { setError('Invalid or expired invite link.'); setLoading(false) })
  }, [token])

  const handleAccept = async () => {
    setAccepting(true)
    const res = await fetch(`/api/invite/${token}/accept`, { method: 'POST' })
    const data = await res.json()

    if (res.status === 401) {
      // Not logged in — go to auth, come back after
      router.push(`/auth?invite=${token}`)
      return
    }

    if (!res.ok) {
      setError(data.error || 'Failed to accept invite')
      setAccepting(false)
      return
    }

    setAccepted(true)
    setAccepting(false)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  const sizeStr = [
    invite?.bedrooms !== null && invite?.bedrooms !== undefined
      ? invite.bedrooms === 0 ? 'Studio' : `${invite.bedrooms} bed`
      : null,
    invite?.bathrooms !== null && invite?.bathrooms !== undefined
      ? `${invite.bathrooms} bath`
      : null,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 9, marginBottom: 36, fontSize: 17, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.02em',
        }}>
          <span className="brand-dot" />
          Darli
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(242,87,87,0.1)',
              border: '1px solid rgba(242,87,87,0.2)', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--error)', margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Invalid invite</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>{error}</p>
            <button className="btn-ghost" onClick={() => router.push('/auth')}>Go to sign in</button>
          </div>
        ) : accepted ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--success)', margin: '0 auto 20px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>You&apos;re in! 🎉</h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Redirecting to your dashboard…</p>
          </div>
        ) : invite ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{
                width: 56, height: 56, background: 'var(--accent-dim)',
                border: '1px solid rgba(124,111,250,0.2)', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', margin: '0 auto 20px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', margin: '0 0 8px' }}>
                You&apos;ve been invited
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65 }}>
                <strong style={{ color: 'var(--text)' }}>{invite.landlordName}</strong> invited you to manage your tenancy on Darli
              </p>
            </div>

            {/* Unit card */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 18px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Your unit
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                  Unit {invite.unitNumber}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {invite.buildingAddress}, {invite.buildingCity}, {invite.buildingState}
                </div>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', gap: 16 }}>
                {sizeStr && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Size</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sizeStr}</div>
                  </div>
                )}
                {invite.sqft && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Sqft</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{invite.sqft.toLocaleString()}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Landlord</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{invite.landlordName}</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button className="btn-primary" onClick={handleAccept} disabled={accepting}>
              {accepting ? <span className="spinner" /> : (
                <>
                  Accept Invitation
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              )}
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
              You&apos;ll be asked to sign in or create a free account to accept.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}