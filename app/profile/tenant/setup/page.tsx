'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import type { AddressValue } from '@/components/AddressAutocomplete'

export default function TenantSetupPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [landlordEmail, setLandlordEmail] = useState('')
  const [landlordPhone, setLandlordPhone] = useState('')

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (!data.profile) router.replace('/profile/create')
      else if (data.profile.role !== 'tenant') router.replace('/dashboard')
      else if (data.profile.status === 'verified') router.replace('/dashboard')
      else setChecking(false)
    }).catch(() => setChecking(false))
  }, [router])

  const onAddress = (addr: AddressValue) => {
    setStreet(addr.street); setCity(addr.city); setState(addr.state); setZip(addr.zip)
  }

  const handleSubmit = async () => {
    setError('')
    if (!street) { setError('Please enter your address'); return }
    if (!unitNumber) { setError('Please enter your unit number'); return }
    if (!landlordEmail && !landlordPhone) { setError('Please provide at least one landlord contact'); return }

    setLoading(true)
    const res = await fetch('/api/tenant/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: street, city, state, zip, unitNumber, landlordEmail, landlordPhone }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard'), 1800)
  }

  if (checking) return (
    <div className="page-center">
      <div className="spinner" style={{ width: 24, height: 24, borderTopColor: 'var(--accent)' }} />
    </div>
  )

  return (
    <div className="page-center">
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ marginBottom: 32 }}>
          <div className="role-page-logo"><span className="brand-dot" />Darli</div>
          <h1 className="role-page-title">Set up your profile</h1>
          <p className="role-page-sub">Tell us where you live and invite your landlord</p>
        </div>

        {success ? (
          <div className="success-box" style={{ textAlign: 'left', padding: 28 }}>
            <div className="success-icon-wrap" style={{ margin: '0 0 18px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 className="success-title" style={{ fontSize: 18, textAlign: 'left' }}>Invitation sent!</h3>
            <p className="success-sub" style={{ textAlign: 'left', marginBottom: 0 }}>
              We&apos;ve notified your landlord. Redirecting to your dashboard…
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field-group">
              <label className="field-label">Your street address *</label>
              <AddressAutocomplete value={street} onChange={onAddress} placeholder="Start typing your address..." />
            </div>
            <div className="three-col">
              <div className="field-group">
                <label className="field-label">City</label>
                <input className="field-input" placeholder="New York" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">State</label>
                <input className="field-input" placeholder="NY" value={state} onChange={e => setState(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">ZIP</label>
                <input className="field-input" placeholder="10001" value={zip} onChange={e => setZip(e.target.value)} />
              </div>
            </div>
            <div className="field-group">
              <label className="field-label">Your unit number *</label>
              <input className="field-input" placeholder="e.g. 4B, 201, Apt 3" value={unitNumber} onChange={e => setUnitNumber(e.target.value)} />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="field-label" style={{ display: 'block', marginBottom: 0 }}>Invite your landlord (at least one contact)</p>
              <div className="field-group">
                <label className="field-label">Landlord email</label>
                <input className="field-input" type="email" placeholder="landlord@example.com" value={landlordEmail} onChange={e => setLandlordEmail(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Landlord phone</label>
                <input className="field-input" type="tel" placeholder="+1 555 000 0000" value={landlordPhone} onChange={e => setLandlordPhone(e.target.value)} />
              </div>
            </div>

            {error && (
              <div className="error-msg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                {error}
              </div>
            )}
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner" /> : (<>Invite Landlord <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}