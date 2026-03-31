'use client'

import { useEffect, useState } from 'react'

type Request = {
  id: string; title: string; description: string; category: string
  priority: string; status: string; landlordNote: string | null
  createdAt: string; resolvedAt: string | null
  tenant: { name: string | null; email: string | null; phone: string | null }
  unit: { unitNumber: string; building: { address: string; city: string; state: string; name: string | null } }
}

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'hvac', label: 'HVAC / Heating', icon: '🌡️' },
  { value: 'appliance', label: 'Appliance', icon: '🏠' },
  { value: 'structural', label: 'Structural', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

function priorityPill(p: string) {
  const map: Record<string, string> = { urgent: 'due', high: 'invited', medium: 'accepted', low: 'vacant' }
  return map[p] || 'vacant'
}

function statusPill(s: string) {
  const map: Record<string, { cls: string; label: string }> = {
    open: { cls: 'invited', label: '⏳ Open' },
    in_progress: { cls: 'accepted', label: '🔧 In Progress' },
    resolved: { cls: 'paid', label: '✓ Resolved' },
    closed: { cls: 'vacant', label: 'Closed' },
  }
  return map[s] || { cls: 'vacant', label: s }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(d)
}

export default function LandlordMaintenance() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [detailModal, setDetailModal] = useState<Request | null>(null)
  const [noteText, setNoteText] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const fetchAll = async () => {
    const res = await fetch('/api/landlord/maintenance')
    const data = await res.json()
    setRequests(data.requests || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const openDetail = (r: Request) => {
    setDetailModal(r)
    setNoteText(r.landlordNote || '')
    setNewStatus(r.status)
    setUpdateSuccess(false)
  }

  const submitUpdate = async () => {
    if (!detailModal) return
    setUpdating(true)
    const res = await fetch(`/api/landlord/maintenance/${detailModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, landlordNote: noteText }),
    })
    if (res.ok) {
      setUpdateSuccess(true)
      fetchAll()
      setTimeout(() => {
        setDetailModal(null)
        setUpdateSuccess(false)
      }, 1400)
    }
    setUpdating(false)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  const stats = {
    open: requests.filter(r => r.status === 'open').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved').length,
    urgent: requests.filter(r => r.priority === 'urgent' && r.status !== 'resolved').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { label: 'Open', val: stats.open, color: 'var(--warning)' },
          { label: 'In Progress', val: stats.in_progress, color: 'var(--accent)' },
          { label: 'Resolved', val: stats.resolved, color: 'var(--success)' },
          { label: 'Urgent', val: stats.urgent, color: 'var(--error)' },
        ].map(s => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-label">{s.label}</div>
            <div className="dash-stat-value" style={{ color: s.color, fontSize: 24 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[
          { val: 'all', label: `All (${requests.length})` },
          { val: 'open', label: `Open (${stats.open})` },
          { val: 'in_progress', label: `In Progress (${stats.in_progress})` },
          { val: 'resolved', label: `Resolved (${stats.resolved})` },
        ].map(f => (
          <button
            key={f.val}
            type="button"
            className={`btn-ghost btn-sm ${filter === f.val ? '' : ''}`}
            style={{
              borderColor: filter === f.val ? 'var(--accent)' : 'var(--border)',
              color: filter === f.val ? 'var(--accent)' : 'var(--text-subtle)',
              background: filter === f.val ? 'var(--accent-muted)' : 'transparent',
            }}
            onClick={() => setFilter(f.val as typeof filter)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Requests */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 22, height: 22, border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="empty-title">No maintenance requests</div>
          <div className="empty-sub">Requests from tenants will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => {
            const sp = statusPill(r.status)
            const cat = CATEGORIES.find(c => c.value === r.category)
            const tenantName = r.tenant.name || r.tenant.email || 'Tenant'
            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 11, overflow: 'hidden', cursor: 'pointer',
                  borderLeft: r.priority === 'urgent' ? '3px solid var(--error)' :
                    r.priority === 'high' ? '3px solid var(--warning)' : '3px solid var(--border)',
                  transition: 'border-color 0.15s',
                }}
                onClick={() => openDetail(r)}
              >
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ fontSize: 20, marginTop: 1, flexShrink: 0 }}>{cat?.icon || '📋'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{r.title}</span>
                      {r.priority === 'urgent' && (
                        <span className="status-pill due" style={{ fontSize: 10.5 }}>🚨 Urgent</span>
                      )}
                      {r.priority === 'high' && (
                        <span className="status-pill invited" style={{ fontSize: 10.5 }}>High</span>
                      )}
                      <span className={`status-pill ${sp.cls}`} style={{ fontSize: 10.5 }}>{sp.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>{cat?.label}</span>
                      <span>Unit {r.unit.unitNumber} · {r.unit.building.address}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>
                          {tenantName[0].toUpperCase()}
                        </div>
                        {tenantName}
                      </span>
                      <span style={{ marginLeft: 'auto', color: r.priority === 'urgent' ? 'var(--error)' : 'var(--text-muted)', fontWeight: r.priority === 'urgent' ? 600 : 400 }}>
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                    {r.description && (
                      <p style={{ fontSize: 12.5, color: 'var(--text-subtle)', margin: '6px 0 0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {r.description}
                      </p>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0, marginTop: 4 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail / Update Modal */}
      {detailModal && (
        <div className="modal-backdrop" onClick={() => !updating && setDetailModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{detailModal.title}</div>
                <div className="modal-sub">
                  {CATEGORIES.find(c => c.value === detailModal.category)?.icon}{' '}
                  Unit {detailModal.unit.unitNumber} · {detailModal.unit.building.address}
                </div>
              </div>
              <button className="icon-btn" onClick={() => setDetailModal(null)} disabled={updating}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {updateSuccess ? (
              <div style={{ padding: '36px 22px', textAlign: 'center' }}>
                <div className="success-icon-wrap" style={{ margin: '0 auto 14px', width: 52, height: 52 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="success-title" style={{ fontSize: 16 }}>Updated!</div>
              </div>
            ) : (
              <div className="modal-body">
                {/* Tenant + meta */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, flex: 1 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                      {(detailModal.tenant.name || detailModal.tenant.email || 'T')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{detailModal.tenant.name || 'Tenant'}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{detailModal.tenant.email}</div>
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Submitted</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{formatDate(detailModal.createdAt)}</div>
                  </div>
                  <span className={`status-pill ${priorityPill(detailModal.priority)}`} style={{ alignSelf: 'center', fontSize: 11 }}>
                    {detailModal.priority} priority
                  </span>
                </div>

                {/* Description */}
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Tenant description</div>
                  <p style={{ fontSize: 13.5, color: 'var(--text)', margin: 0, lineHeight: 1.65 }}>{detailModal.description}</p>
                </div>

                {/* Update status */}
                <div className="field-group">
                  <label className="field-label">Update status</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {STATUSES.map(s => {
                      const sp = statusPill(s.value)
                      return (
                        <button
                          key={s.value}
                          type="button"
                          className={`status-pill ${sp.cls}`}
                          style={{
                            cursor: 'pointer', border: '1.5px solid',
                            opacity: newStatus === s.value ? 1 : 0.4,
                            transform: newStatus === s.value ? 'scale(1.05)' : 'scale(1)',
                            transition: 'all 0.15s', background: 'none', font: 'inherit', fontSize: 12.5,
                          }}
                          onClick={() => setNewStatus(s.value)}
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Landlord note */}
                <div className="field-group">
                  <label className="field-label">Note to tenant (optional)</label>
                  <textarea
                    className="field-input"
                    placeholder="e.g. Plumber scheduled for Friday between 10am–12pm. Please ensure access."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical', minHeight: 70 }}
                  />
                </div>

                <button className="btn-primary" onClick={submitUpdate} disabled={updating}>
                  {updating ? <span className="spinner" /> : 'Save Update'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}