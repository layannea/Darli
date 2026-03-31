'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LandlordMaintenance from './LandlordMaintenance'

type TenantInfo = { id: string; name: string | null; email: string | null; phone: string | null }
type TenantUnit = { id: string; inviteEmail: string | null; invitePhone: string | null; inviteName: string | null; status: string; acceptedAt: string | null; tenant: TenantInfo | null }
type Payment = { id: string; amount: number; month: string; paidAt: string }
type Unit = { id: string; unitNumber: string; bedrooms: number | null; bathrooms: number | null; sqft: number | null; rentAmount: number | null; tenantUnits: TenantUnit[]; payments: Payment[] }
type Building = { id: string; name: string | null; address: string; city: string; state: string; zip: string; verified: boolean; units: Unit[] }
type PaymentRecord = { id: string; amount: number; month: string; paidAt: string; unitNumber: string; buildingAddress: string; tenantName: string; last4: string | null }
type EditUnitForm = { unitNumber: string; bedrooms: string; bathrooms: string; sqft: string; rentAmount: string }

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function unitSize(u: Unit) {
  const bed = u.bedrooms !== null ? (u.bedrooms === 0 ? 'Studio' : `${u.bedrooms}bd`) : null
  const bath = u.bathrooms !== null ? `${u.bathrooms}ba` : null
  return [bed, bath].filter(Boolean).join('/') || '—'
}

function getActiveTenants(unit: Unit): TenantUnit[] {
  return unit.tenantUnits.filter(t => t.status === 'accepted' || t.status === 'invited')
}

function getTenantDisplay(tu: TenantUnit): string {
  if (tu.tenant?.name) return tu.tenant.name
  if (tu.tenant?.email) return tu.tenant.email
  return tu.inviteName || tu.inviteEmail || tu.invitePhone || 'Tenant'
}

function getTenantContact(tu: TenantUnit): { email: string | null; phone: string | null } {
  return {
    email: tu.tenant?.email || tu.inviteEmail || null,
    phone: tu.tenant?.phone || tu.invitePhone || null,
  }
}

function ContactPopover({ tu }: { tu: TenantUnit }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const { email, phone } = getTenantContact(tu)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleOpen = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    setOpen(o => !o)
  }

  if (!email && !phone) return null

  return (
    <>
      <button ref={btnRef} className="contact-info-btn" onClick={handleOpen} title="View contact info">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="contact-popover"
          style={{ position: 'fixed', top: pos.top, left: pos.left, transform: 'translateX(-50%)', zIndex: 9999 }}
        >
          <div className="contact-popover-title">Contact</div>
          {email && (
            <div className="contact-popover-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              <a href={`mailto:${email}`} className="contact-popover-link">{email}</a>
            </div>
          )}
          {phone && (
            <div className="contact-popover-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              <a href={`tel:${phone}`} className="contact-popover-link">{phone}</a>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function PaymentStatus({ unit, currentMonth }: { unit: Unit; currentMonth: string }) {
  const actives = getActiveTenants(unit)
  if (actives.length === 0) return <span className="table-cell-muted">—</span>
  const accepted = actives.filter(t => t.status === 'accepted')
  if (accepted.length === 0) return <span className="status-pill invited">⏳ Invite not accepted</span>
  if (!unit.rentAmount) return <span className="status-pill no-rent">Rent not configured</span>
  if (unit.payments.length > 0) {
    const paidDate = new Date(unit.payments[0].paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return <span className="status-pill paid">✓ Paid on {paidDate}</span>
  }
  const [y, mo] = currentMonth.split('-')
  const dueDate = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className="status-pill due">Unpaid</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Due {dueDate}</span>
    </div>
  )
}

export default function LandlordDashboard({ userId, profileStatus }: { userId: string; profileStatus: string }) {
  const router = useRouter()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [currentMonth, setCurrentMonth] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'properties' | 'payments' | 'maintenance'>('properties')

  // Invite modal
  const [inviteModal, setInviteModal] = useState<{ unitId: string; unitNumber: string } | null>(null)
  const [inviteTab, setInviteTab] = useState<'email' | 'phone'>('email')
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Rent modal
  const [rentModal, setRentModal] = useState<{ unitId: string; unitNumber: string; current: number | null } | null>(null)
  const [rentAmount, setRentAmount] = useState('')
  const [rentError, setRentError] = useState('')
  const [rentLoading, setRentLoading] = useState(false)
  const [rentSuccess, setRentSuccess] = useState(false)

  // Edit unit modal
  const [editModal, setEditModal] = useState<{ unit: Unit; buildingName: string } | null>(null)
  const [editForm, setEditForm] = useState<EditUnitForm>({ unitNumber: '', bedrooms: '', bathrooms: '', sqft: '', rentAmount: '' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editSuccess, setEditSuccess] = useState(false)

  const fetchAll = async () => {
    const [b, p] = await Promise.all([
      fetch('/api/buildings').then(r => r.json()),
      fetch('/api/landlord/payments').then(r => r.json()),
    ])
    setBuildings(b.buildings || [])
    setCurrentMonth(b.currentMonth || '')
    setPayments(p.payments || [])
    setLoading(false)
  }

  useEffect(() => {
    if (profileStatus !== 'verified') { setLoading(false); return }
    fetchAll()
  }, [profileStatus])

  const openInvite = (unitId: string, unitNumber: string) => {
    setInviteModal({ unitId, unitNumber })
    setInviteTab('email'); setInviteName(''); setInviteEmail(''); setInvitePhone('')
    setInviteError(''); setInviteSuccess(false)
  }

  const openRent = (unitId: string, unitNumber: string, current: number | null) => {
    setRentModal({ unitId, unitNumber, current })
    setRentAmount(current ? String(current) : '')
    setRentError(''); setRentSuccess(false)
  }

  const openEdit = (unit: Unit) => {
    setEditModal({ unit, buildingName: '' })
    setEditForm({
      unitNumber: unit.unitNumber,
      bedrooms: unit.bedrooms !== null ? String(unit.bedrooms) : '',
      bathrooms: unit.bathrooms !== null ? String(unit.bathrooms) : '',
      sqft: unit.sqft !== null ? String(unit.sqft) : '',
      rentAmount: unit.rentAmount !== null ? String(unit.rentAmount) : '',
    })
    setEditError(''); setEditSuccess(false)
  }

  const submitEdit = async () => {
    setEditError('')
    if (!editForm.unitNumber.trim()) { setEditError('Unit number is required'); return }
    setEditLoading(true)
    const res = await fetch('/api/landlord/update-unit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: editModal?.unit.id, ...editForm }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error || 'Failed'); setEditLoading(false); return }
    setEditSuccess(true); setEditLoading(false)
    fetchAll()
    setTimeout(() => setEditModal(null), 1400)
  }

  const submitInvite = async () => {
    setInviteError('')
    const contact = inviteTab === 'email' ? inviteEmail.trim() : invitePhone.trim()
    if (!contact) { setInviteError(`Please enter a ${inviteTab}`); return }
    setInviteLoading(true)
    const res = await fetch('/api/landlord/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: inviteModal?.unitId,
        inviteName: inviteName || null,
        inviteEmail: inviteTab === 'email' ? inviteEmail : null,
        invitePhone: inviteTab === 'phone' ? invitePhone : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setInviteError(data.error || 'Failed'); setInviteLoading(false); return }
    setInviteSuccess(true); setInviteLoading(false)
    fetchAll()
    setTimeout(() => setInviteModal(null), 1800)
  }

  const submitRent = async () => {
    setRentError('')
    const amt = parseFloat(rentAmount)
    if (!rentAmount || isNaN(amt) || amt <= 0) { setRentError('Enter a valid amount'); return }
    setRentLoading(true)
    const res = await fetch('/api/landlord/set-rent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId: rentModal?.unitId, rentAmount: amt }),
    })
    const data = await res.json()
    if (!res.ok) { setRentError(data.error || 'Failed'); setRentLoading(false); return }
    setRentSuccess(true); setRentLoading(false)
    fetchAll()
    setTimeout(() => setRentModal(null), 1400)
  }

  const totalUnits = buildings.reduce((a, b) => a + b.units.length, 0)
  const thisMonthTotal = payments.filter(p => p.month === currentMonth).reduce((s, p) => s + p.amount, 0)
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0)

  if (profileStatus !== 'verified') {
    return (
      <div className="dash-gate">
        <div className="dash-gate-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        </div>
        <h2 className="dash-gate-title">Verification pending</h2>
        <p className="dash-gate-sub">Complete your landlord verification to access the dashboard.</p>
        <button className="btn-primary" onClick={() => router.push('/profile/landlord/setup')} style={{ maxWidth: 220, margin: '0 auto' }}>
          Complete Setup <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Stats */}
      <div className="dash-stats-row">
        <div className="dash-stat-card"><div className="dash-stat-label">Buildings</div><div className="dash-stat-value">{buildings.length}</div></div>
        <div className="dash-stat-card"><div className="dash-stat-label">Total Units</div><div className="dash-stat-value">{totalUnits}</div></div>
        <div className="dash-stat-card"><div className="dash-stat-label">This Month</div><div className="dash-stat-value accent">${thisMonthTotal.toLocaleString()}</div></div>
        <div className="dash-stat-card"><div className="dash-stat-label">Total Collected</div><div className="dash-stat-value">${totalCollected.toLocaleString()}</div></div>
      </div>

      {/* Tabs */}
      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab === 'properties' ? 'active' : ''}`} onClick={() => setActiveTab('properties')}>Properties</button>
        <button className={`dash-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          Payment History {payments.length > 0 && <span className="dash-tab-badge">{payments.length}</span>}
        </button>
        <button className={`dash-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          Maintenance
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 24, height: 24, borderTopColor: 'var(--accent)' }} />
        </div>
      ) : activeTab === 'properties' ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button className="btn-ghost" onClick={() => router.push('/profile/landlord/setup')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add Building
            </button>
          </div>

          {buildings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg></div>
              <div className="empty-title">No properties yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {buildings.map(b => (
                <div key={b.id} className="property-section">
                  <div className="property-section-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="property-section-name">{b.name || 'Building'}</div>
                        {!b.verified && <span className="status-pill invited" style={{ fontSize: 11 }}>⏳ Pending verification</span>}
                        {b.verified && <span className="status-pill accepted" style={{ fontSize: 11 }}>✓ Verified</span>}
                      </div>
                      <div className="property-section-address">{b.address}, {b.city}, {b.state} {b.zip}</div>
                    </div>
                    <div className="property-section-badge">{b.units.length} unit{b.units.length !== 1 ? 's' : ''}</div>
                  </div>

                  <div className="property-table-wrap">
                    <table className="property-table">
                      <thead>
                        <tr>
                          <th>Unit</th>
                          <th>Size</th>
                          <th>Tenant(s)</th>
                          <th>Status</th>
                          <th>Rent/mo</th>
                          <th>Payment</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.units.map(u => {
                          const actives = getActiveTenants(u)
                          return (
                            <tr key={u.id}>
                              <td><span className="table-unit-num">{u.unitNumber}</span></td>
                              <td><span className="table-cell-meta">{unitSize(u)}{u.sqft ? ` · ${u.sqft.toLocaleString()} sqft` : ''}</span></td>
                              <td>
                                {actives.length === 0 ? (
                                  <span className="table-cell-muted">Vacant</span>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {actives.map(tu => (
                                      <div key={tu.id} className="table-tenant-cell">
                                        <div className="table-tenant-avatar">{getTenantDisplay(tu)[0].toUpperCase()}</div>
                                        {tu.tenant?.id ? (
                                          <Link
                                            href={`/profile/${tu.tenant.id}`}
                                            className="table-tenant-name table-tenant-link"
                                          >
                                            {getTenantDisplay(tu)}
                                          </Link>
                                        ) : (
                                          <span className="table-tenant-name">{getTenantDisplay(tu)}</span>
                                        )}
                                        <ContactPopover tu={tu} />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td>
                                {actives.length === 0 && <span className="status-pill vacant">Vacant</span>}
                                {actives.length > 0 && actives.every(t => t.status === 'invited') && <span className="status-pill invited">Invited</span>}
                                {actives.some(t => t.status === 'accepted') && <span className="status-pill accepted">Active</span>}
                              </td>
                              <td>
                                {u.rentAmount
                                  ? <span className="table-rent">${u.rentAmount.toLocaleString()}</span>
                                  : <span className="table-cell-muted">—</span>}
                              </td>
                              <td><PaymentStatus unit={u} currentMonth={currentMonth} /></td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  <button className="btn-ghost btn-sm" onClick={() => openEdit(u)}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit
                                  </button>
                                  <button className="btn-ghost btn-sm" onClick={() => openRent(u.id, u.unitNumber, u.rentAmount)}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <line x1="12" y1="1" x2="12" y2="23" />
                                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    {u.rentAmount ? 'Edit' : 'Set'} Rent
                                  </button>
                                  <button className="btn-ghost btn-sm" onClick={() => openInvite(u.id, u.unitNumber)}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                      <circle cx="9" cy="7" r="4" />
                                      <line x1="19" y1="8" x2="19" y2="14" />
                                      <line x1="22" y1="11" x2="16" y2="11" />
                                    </svg>
                                    Invite
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : activeTab === 'maintenance' ? (
        <LandlordMaintenance />
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
            <div className="empty-sub">Payments from tenants will appear here</div>
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
                    <div className="payment-title">{p.tenantName} — Unit {p.unitNumber}</div>
                    <div className="payment-sub">
                      {p.buildingAddress} · {formatMonth(p.month)}
                      {p.last4 ? ` · ••••${p.last4}` : ''}
                    </div>
                  </div>
                </div>
                <div className="payment-amount">+${p.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── INVITE MODAL ── */}
      {inviteModal && (
        <div className="modal-backdrop" onClick={() => !inviteLoading && setInviteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><div className="modal-title">Invite Tenant</div><div className="modal-sub">Unit {inviteModal.unitNumber}</div></div>
              <button className="icon-btn" onClick={() => setInviteModal(null)} disabled={inviteLoading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {inviteSuccess ? (
              <div style={{ padding: '32px 22px', textAlign: 'center' }}>
                <div className="success-icon-wrap" style={{ margin: '0 auto 14px', width: 48, height: 48 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="success-title" style={{ fontSize: 16 }}>Invite sent!</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>The tenant will see a notification when they log in.</div>
              </div>
            ) : (
              <div className="modal-body">
                <div className="invite-info-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>The tenant will receive a notification to accept this invite when they log in to Darli.</span>
                </div>
                <div className="field-group">
                  <label className="field-label">Tenant name (optional)</label>
                  <input className="field-input" placeholder="Jane Smith" value={inviteName} onChange={e => setInviteName(e.target.value)} />
                </div>
                <div>
                  <div className="invite-method-tabs">
                    <button type="button" className={`invite-method-tab ${inviteTab === 'email' ? 'active' : ''}`} onClick={() => { setInviteTab('email'); setInvitePhone('') }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                      Email
                    </button>
                    <button type="button" className={`invite-method-tab ${inviteTab === 'phone' ? 'active' : ''}`} onClick={() => { setInviteTab('phone'); setInviteEmail('') }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6.29 6.29l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      Phone
                    </button>
                  </div>
                  {inviteTab === 'email' ? (
                    <input className="field-input" type="email" placeholder="tenant@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }} />
                  ) : (
                    <input className="field-input" type="tel" placeholder="+1 555 000 0000" value={invitePhone} onChange={e => setInvitePhone(e.target.value)} style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }} />
                  )}
                </div>
                {inviteError && (
                  <div className="error-msg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {inviteError}
                  </div>
                )}
                <button className="btn-primary" onClick={submitInvite} disabled={inviteLoading}>
                  {inviteLoading ? <span className="spinner" /> : 'Send Invite'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SET RENT MODAL ── */}
      {rentModal && (
        <div className="modal-backdrop" onClick={() => !rentLoading && setRentModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div><div className="modal-title">Set Monthly Rent</div><div className="modal-sub">Unit {rentModal.unitNumber}</div></div>
              <button className="icon-btn" onClick={() => setRentModal(null)} disabled={rentLoading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            {rentSuccess ? (
              <div style={{ padding: '32px 22px', textAlign: 'center' }}>
                <div className="success-icon-wrap" style={{ margin: '0 auto 14px', width: 48, height: 48 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="success-title" style={{ fontSize: 16 }}>Rent updated!</div>
              </div>
            ) : (
              <div className="modal-body">
                {rentModal.current && (
                  <div className="demo-hint">
                    <div><div className="demo-hint-label">Current rent</div><div className="demo-hint-code">${rentModal.current.toLocaleString()}/mo</div></div>
                  </div>
                )}
                <div className="field-group">
                  <label className="field-label">Monthly rent amount (USD)</label>
                  <div className="amount-input-wrap">
                    <span className="amount-prefix">$</span>
                    <input className="field-input amount-input" type="number" placeholder="0.00" min="1" step="0.01" value={rentAmount} onChange={e => setRentAmount(e.target.value)} />
                  </div>
                </div>
                {rentError && (
                  <div className="error-msg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {rentError}
                  </div>
                )}
                <button className="btn-primary" onClick={submitRent} disabled={rentLoading}>
                  {rentLoading ? <span className="spinner" /> : 'Save Rent Amount'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT UNIT MODAL ── */}
      {editModal && (
        <div className="modal-backdrop" onClick={() => !editLoading && setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Edit Unit</div>
                <div className="modal-sub">Unit {editModal.unit.unitNumber}</div>
              </div>
              <button className="icon-btn" onClick={() => setEditModal(null)} disabled={editLoading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {editSuccess ? (
              <div style={{ padding: '32px 22px', textAlign: 'center' }}>
                <div className="success-icon-wrap" style={{ margin: '0 auto 14px', width: 48, height: 48 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="success-title" style={{ fontSize: 16 }}>Unit updated!</div>
              </div>
            ) : (
              <div className="modal-body">
                <div className="field-group">
                  <label className="field-label">Unit number *</label>
                  <input className="field-input" placeholder="e.g. 1A, 201" value={editForm.unitNumber} onChange={e => setEditForm(f => ({ ...f, unitNumber: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="field-group">
                    <label className="field-label">Bedrooms</label>
                    <select className="field-input field-select" value={editForm.bedrooms} onChange={e => setEditForm(f => ({ ...f, bedrooms: e.target.value }))}>
                      <option value="">—</option>
                      <option value="0">Studio</option>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} bed</option>)}
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Bathrooms</label>
                    <select className="field-input field-select" value={editForm.bathrooms} onChange={e => setEditForm(f => ({ ...f, bathrooms: e.target.value }))}>
                      <option value="">—</option>
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(n => <option key={n} value={n}>{n} bath</option>)}
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <label className="field-label">Square footage</label>
                  <input className="field-input" type="number" placeholder="850" value={editForm.sqft} onChange={e => setEditForm(f => ({ ...f, sqft: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label className="field-label">Monthly rent (USD)</label>
                  <div className="amount-input-wrap">
                    <span className="amount-prefix">$</span>
                    <input className="field-input amount-input" type="number" placeholder="0.00" min="1" step="0.01" value={editForm.rentAmount} onChange={e => setEditForm(f => ({ ...f, rentAmount: e.target.value }))} />
                  </div>
                </div>
                {editError && (
                  <div className="error-msg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {editError}
                  </div>
                )}
                <button className="btn-primary" onClick={submitEdit} disabled={editLoading}>
                  {editLoading ? <span className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}