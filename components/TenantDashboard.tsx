'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const MortgageTracker = dynamic(() => import('./MortgageTracker'), { ssr: false })

const StripePaymentModal = dynamic(() => import('./StripePaymentModal'), { ssr: false })

type RentInfo = {
  unitNumber: string; address: string; city: string; state: string
  rentAmount: number | null; unitId: string | null; currentMonth: string
  paidThisMonth: boolean; landlordName: string | null
  bedrooms: number | null; bathrooms: number | null; sqft: number | null
}
type Payment = {
  id: string; amount: number; month: string; paidAt: string; last4: string | null
  unit: { unitNumber: string; building: { address: string } }
}
type Invite = {
  id: string; inviteName: string | null; status: string
  unit: {
    unitNumber: string; bedrooms: number | null; bathrooms: number | null; sqft: number | null
    building: { address: string; city: string; state: string; landlord: { name: string | null; email: string | null } }
  }
}

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

export default function TenantDashboard({ userId, profileStatus }: { userId: string; profileStatus: string }) {
  const router = useRouter()
  const [rentInfo, setRentInfo] = useState<RentInfo | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [showPayModal, setShowPayModal] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'rent' | 'payments' | 'mortgage'>('rent')

  const fetchAll = async () => {
    const [rentRes, inviteRes] = await Promise.all([
      fetch('/api/tenant/rent-info').then(r => r.json()),
      fetch('/api/tenant/invites').then(r => r.json()),
    ])
    setRentInfo(rentRes.rentInfo)
    setPayments(rentRes.payments || [])
    setInvites(inviteRes.invites || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const acceptInvite = async (inviteId: string) => {
    setAcceptingId(inviteId)
    const res = await fetch('/api/tenant/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inviteId }),
    })
    setAcceptingId(null)
    if (res.ok) fetchAll()
  }

  const handleOpenPay = async () => {
    if (!rentInfo?.unitId || !rentInfo?.rentAmount) return
    setPayLoading(true)
    const res = await fetch('/api/tenant/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: rentInfo.unitId,
        amount: rentInfo.rentAmount,
        month: rentInfo.currentMonth,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error(data.error)
      setPayLoading(false)
      return
    }
    setClientSecret(data.clientSecret)
    setShowPayModal(true)
    setPayLoading(false)
  }

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <>
      {/* ── PENDING INVITES ── */}
      {invites.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          <div className="invite-section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Pending Invites
          </div>
          {invites.map(inv => {
            const landlord = inv.unit.building.landlord
            const landlordName = landlord.name || landlord.email || 'Your landlord'
            const bedStr = inv.unit.bedrooms !== null ? (inv.unit.bedrooms === 0 ? 'Studio' : `${inv.unit.bedrooms} bed`) : null
            const bathStr = inv.unit.bathrooms !== null ? `${inv.unit.bathrooms} bath` : null
            const sizeStr = [bedStr, bathStr].filter(Boolean).join(' / ')
            return (
              <div key={inv.id} className="invite-card">
                <div className="invite-card-left">
                  <div className="invite-card-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                  </div>
                  <div className="invite-card-info">
                    <div className="invite-card-title">Invite from {landlordName}</div>
                    <div className="invite-card-unit">Unit {inv.unit.unitNumber}</div>
                    <div className="invite-card-meta">
                      {sizeStr && <span>{sizeStr}</span>}
                      {inv.unit.sqft && <span>· {inv.unit.sqft.toLocaleString()} sqft</span>}
                      <span>· {inv.unit.building.address}</span>
                      <span>{inv.unit.building.city}, {inv.unit.building.state}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  onClick={() => acceptInvite(inv.id)}
                  disabled={acceptingId === inv.id}
                  style={{ flexShrink: 0, minWidth: 120 }}
                >
                  {acceptingId === inv.id
                    ? <span className="spinner" style={{ width: 15, height: 15 }} />
                    : (<>Accept <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg></>)}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── STATS ── */}
      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-label">Unit</div>
          <div className="dash-stat-value">{rentInfo?.unitNumber || '—'}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">Monthly Rent</div>
          <div className="dash-stat-value accent">
            {rentInfo?.rentAmount ? `$${rentInfo.rentAmount.toLocaleString()}` : '—'}
          </div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">Payments Made</div>
          <div className="dash-stat-value">{payments.length}</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-label">Total Paid</div>
          <div className="dash-stat-value">${totalPaid.toLocaleString()}</div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab === 'rent' ? 'active' : ''}`} onClick={() => setActiveTab('rent')}>
          Rent
        </button>
        <button className={`dash-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          Payment History{payments.length > 0 && <span className="dash-tab-badge">{payments.length}</span>}
        </button>
        <button className={`dash-tab ${activeTab === 'mortgage' ? 'active' : ''}`} onClick={() => setActiveTab('mortgage')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Mortgage Tracker
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 24, height: 24, borderTopColor: 'var(--accent)' }} />
        </div>
      ) : activeTab === 'rent' ? (
        <div style={{ maxWidth: 480 }}>
          {!rentInfo ? (
            <div className="tenant-no-unit">
              <div className="tenant-no-unit-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3 className="tenant-no-unit-title">No unit connected yet</h3>
              <p className="tenant-no-unit-sub">
                If your landlord invited you, accept the invite above.<br />
                Otherwise, you can add your unit and invite your landlord manually.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="btn-ghost" onClick={() => router.push('/profile/tenant/setup')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add my unit
                </button>
              </div>
            </div>
          ) : (
            <div className="rent-card">
              <div className="rent-card-header">
                <div>
                  <div className="rent-card-title">{formatMonth(rentInfo.currentMonth)}</div>
                  <div className="rent-card-address">
                    Unit {rentInfo.unitNumber} · {rentInfo.address}, {rentInfo.city}, {rentInfo.state}
                  </div>
                  {(rentInfo.bedrooms !== null || rentInfo.sqft) && (
                    <div className="rent-card-address" style={{ marginTop: 2 }}>
                      {rentInfo.bedrooms !== null ? (rentInfo.bedrooms === 0 ? 'Studio' : `${rentInfo.bedrooms} bed`) : ''}
                      {rentInfo.bathrooms !== null ? `/${rentInfo.bathrooms} bath` : ''}
                      {rentInfo.sqft ? ` · ${rentInfo.sqft.toLocaleString()} sqft` : ''}
                    </div>
                  )}
                </div>
                {rentInfo.paidThisMonth
                  ? <div className="status-badge verified">Paid ✓</div>
                  : <div className="status-badge pending">Due</div>}
              </div>

              <div className="rent-card-body">
                {rentInfo.rentAmount ? (
                  <>
                    <div className="rent-amount-display">
                      <span className="rent-currency">$</span>
                      <span className="rent-figure">{rentInfo.rentAmount.toLocaleString()}</span>
                      <span className="rent-period">/mo</span>
                    </div>

                    {rentInfo.landlordName && (
                      <div className="rent-landlord">Landlord: {rentInfo.landlordName}</div>
                    )}

                    {rentInfo.paidThisMonth ? (
                      <div className="rent-paid-msg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Rent paid for {formatMonth(rentInfo.currentMonth)}
                      </div>
                    ) : rentInfo.unitId ? (
                      <button
                        className="btn-primary"
                        onClick={handleOpenPay}
                        disabled={payLoading}
                      >
                        {payLoading ? (
                          <span className="spinner" style={{ width: 16, height: 16 }} />
                        ) : (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                              <line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            Pay ${rentInfo.rentAmount.toLocaleString()} Now
                          </>
                        )}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div style={{ padding: '16px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Rent amount not set yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      Your landlord hasn&apos;t set the monthly rent for your unit
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'mortgage' ? (
        <MortgageTracker />
      ) : (
        payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="empty-title">No payments yet</div>
            <div className="empty-sub">Your payment history will appear here</div>
          </div>
        ) : (
          <div className="payments-list">
            {payments.map(p => (
              <div key={p.id} className="payment-row">
                <div className="payment-row-left">
                  <div className="payment-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div>
                    <div className="payment-title">{formatMonth(p.month)}</div>
                    <div className="payment-sub">
                      Unit {p.unit.unitNumber} · {p.unit.building.address}
                      {p.last4 ? ` · ••••${p.last4}` : ''}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="payment-amount">-${p.amount.toLocaleString()}</div>
                  <div className="payment-date">{new Date(p.paidAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── STRIPE PAYMENT MODAL ── */}
      {showPayModal && rentInfo && clientSecret && (
        <StripePaymentModal
          rentInfo={{
            unitNumber: rentInfo.unitNumber,
            unitId: rentInfo.unitId!,
            rentAmount: rentInfo.rentAmount!,
            currentMonth: rentInfo.currentMonth,
            landlordName: rentInfo.landlordName,
          }}
          clientSecret={clientSecret}
          onClose={() => { setShowPayModal(false); setClientSecret(null) }}
          onSuccess={() => { setShowPayModal(false); setClientSecret(null); fetchAll() }}
        />
      )}
    </>
  )
}