'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'landlord' | 'tenant'

export default function ProfileCreateClient() {
  const router = useRouter()
  const [selected, setSelected] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selected }),
    })

    if (res.ok) {
      if (selected === 'landlord') {
        router.push('/profile/landlord/setup')
      } else {
        // Tenants go straight to dashboard — they can add unit or accept invite from there
        router.push('/dashboard')
      }
    }

    setLoading(false)
  }

  return (
    <div className="page-center">
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div className="role-page-header">
          <div className="role-page-logo"><span className="brand-dot" />Darli</div>
          <h1 className="role-page-title">What's your role?</h1>
          <p className="role-page-sub">Choose how you'll be using Darli</p>
        </div>

        <div className="role-grid">
          <button className={`role-card ${selected === 'landlord' ? 'selected' : ''}`} onClick={() => setSelected('landlord')}>
            <div className="role-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="role-title">I'm a Landlord</div>
            <div className="role-desc">I own or manage rental properties</div>
            <div className="role-features">
              <div className="role-feature"><span className="role-feature-dot" />Add buildings &amp; units</div>
              <div className="role-feature"><span className="role-feature-dot" />Manage tenants</div>
              <div className="role-feature"><span className="role-feature-dot" />Ownership verification</div>
            </div>
          </button>

          <button className={`role-card ${selected === 'tenant' ? 'selected' : ''}`} onClick={() => setSelected('tenant')}>
            <div className="role-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="role-title">I'm a Tenant</div>
            <div className="role-desc">I rent a property from a landlord</div>
            <div className="role-features">
              <div className="role-feature"><span className="role-feature-dot" />Connect with landlord</div>
              <div className="role-feature"><span className="role-feature-dot" />Manage your unit</div>
              <div className="role-feature"><span className="role-feature-dot" />Track requests</div>
            </div>
          </button>
        </div>

        <button className="btn-primary" onClick={handleContinue} disabled={!selected || loading}>
          {loading ? <span className="spinner" /> : selected
            ? (<>Continue as {selected === 'landlord' ? 'Landlord' : 'Tenant'}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>)
            : 'Select a role to continue'
          }
        </button>
      </div>
    </div>
  )
}
