'use client'

import { useEffect, useState } from 'react'

type MaintenanceRequest = {
  id: string; title: string; description: string; category: string
  priority: string; status: string; landlordNote: string | null
  createdAt: string; resolvedAt: string | null
  unit: { unitNumber: string; building: { address: string; city: string; state: string } }
}

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing', icon: '🚿' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'hvac', label: 'HVAC / Heating', icon: '🌡️' },
  { value: 'appliance', label: 'Appliance', icon: '🏠' },
  { value: 'structural', label: 'Structural', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📋' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'Not urgent, can wait weeks' },
  { value: 'medium', label: 'Medium', desc: 'Should be fixed within days' },
  { value: 'high', label: 'High', desc: 'Needs attention soon' },
  { value: 'urgent', label: 'Urgent', desc: 'Safety issue, needs immediate attention' },
]

function priorityPill(p: string) {
  const map: Record<string, string> = {
    urgent: 'due', high: 'invited', medium: 'accepted', low: 'vacant',
  }
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

export default function TenantMaintenance({ unitId }: { unitId: string | null }) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('plumbing')
  const [priority, setPriority] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const readJsonSafe = async (res: Response) => {
    const raw = await res.text()
    if (!raw) return {}
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/tenant/maintenance')
      const data = await readJsonSafe(res)
      if (!res.ok) {
        setRequests([])
        setLoading(false)
        return
      }
      setRequests((data as { requests?: MaintenanceRequest[] }).requests || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('plumbing'); setPriority('medium')
    setSubmitError(''); setSubmitSuccess(false)
  }

  const submitRequest = async () => {
    setSubmitError('')
    if (!title.trim()) { setSubmitError('Please enter a title'); return }
    if (!description.trim()) { setSubmitError('Please describe the issue'); return }
    if (!unitId) { setSubmitError('No unit connected to your account'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/tenant/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, title, description, category, priority }),
      })
      const data = await readJsonSafe(res) as { error?: string }
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit')
        return
      }

      setSubmitSuccess(true)
      fetchRequests()
      setTimeout(() => { setShowForm(false); resetForm() }, 1600)
    } catch {
      setSubmitError('Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const openCount = requests.filter(r => r.status === 'open').length
  const inProgressCount = requests.filter(r => r.status === 'in_progress').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Open', val: openCount, color: 'var(--warning)' },
            { label: 'In Progress', val: inProgressCount, color: 'var(--accent)' },
            { label: 'Total', val: requests.length, color: 'var(--text-subtle)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 9, padding: '7px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button
          className="btn-primary"
          style={{ maxWidth: 180 }}
          onClick={() => { setShowForm(true); resetForm() }}
          disabled={!unitId}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Request
        </button>
      </div>

      {!unitId && (
        <div className="error-msg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
          </svg>
          You need an active unit to submit maintenance requests.
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => !submitting && setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">New Maintenance Request</div>
                <div className="modal-sub">Your landlord will be notified</div>
              </div>
              <button className="icon-btn" onClick={() => setShowForm(false)} disabled={submitting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ padding: '36px 22px', textAlign: 'center' }}>
                <div className="success-icon-wrap" style={{ margin: '0 auto 14px', width: 52, height: 52 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div className="success-title" style={{ fontSize: 16 }}>Request submitted!</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Your landlord has been notified.</div>
              </div>
            ) : (
              <div className="modal-body">
                {/* Category */}
                <div className="field-group">
                  <label className="field-label">Category</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        style={{
                          padding: '9px 10px', borderRadius: 8, border: '1px solid',
                          borderColor: category === c.value ? 'var(--accent)' : 'var(--border)',
                          background: category === c.value ? 'var(--accent-muted)' : 'var(--surface)',
                          color: category === c.value ? 'var(--accent)' : 'var(--text-subtle)',
                          font: 'inherit', fontSize: 12.5, fontWeight: 500,
                          cursor: 'pointer', transition: 'all 0.15s',
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        <span>{c.icon}</span>{c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="field-group">
                  <label className="field-label">Priority</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={`status-pill ${priorityPill(p.value)}`}
                        style={{
                          cursor: 'pointer', border: '1.5px solid',
                          opacity: priority === p.value ? 1 : 0.4,
                          transform: priority === p.value ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.15s', background: 'none',
                          font: 'inherit', fontSize: 12.5,
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {PRIORITIES.find(p => p.value === priority)?.desc}
                  </div>
                </div>

                {/* Title */}
                <div className="field-group">
                  <label className="field-label">Title *</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Kitchen sink is leaking"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={80}
                  />
                </div>

                {/* Description */}
                <div className="field-group">
                  <label className="field-label">Describe the issue *</label>
                  <textarea
                    className="field-input"
                    placeholder="Provide as much detail as possible — when it started, how severe, what you've tried..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    style={{ resize: 'vertical', minHeight: 90 }}
                  />
                </div>

                {submitError && (
                  <div className="error-msg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    {submitError}
                  </div>
                )}

                <button className="btn-primary" onClick={submitRequest} disabled={submitting}>
                  {submitting ? <span className="spinner" /> : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" style={{ width: 22, height: 22, border: '2px solid var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div className="empty-title">No maintenance requests</div>
          <div className="empty-sub">Submit a request when something needs fixing</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {requests.map(r => {
            const sp = statusPill(r.status)
            const cat = CATEGORIES.find(c => c.value === r.category)
            const isExpanded = expanded === r.id
            return (
              <div
                key={r.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 11, overflow: 'hidden',
                  borderLeft: r.status === 'open' ? '3px solid var(--warning)' :
                    r.status === 'in_progress' ? '3px solid var(--accent)' :
                    r.status === 'resolved' ? '3px solid var(--success)' : '3px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  style={{
                    width: '100%', background: 'none', border: 'none', padding: '14px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                    textAlign: 'left', font: 'inherit',
                  }}
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div style={{ fontSize: 18, marginTop: 1 }}>{cat?.icon || '📋'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{r.title}</span>
                      <span className={`status-pill ${priorityPill(r.priority)}`} style={{ fontSize: 10.5 }}>
                        {r.priority}
                      </span>
                      <span className={`status-pill ${sp.cls}`} style={{ fontSize: 10.5, marginLeft: 'auto' }}>
                        {sp.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {cat?.label} · Unit {r.unit.unitNumber} · Submitted {formatDate(r.createdAt)}
                    </div>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="var(--text-muted)" strokeWidth="2"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, marginTop: 4 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                        Description
                      </div>
                      <p style={{ fontSize: 13.5, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.65 }}>{r.description}</p>
                    </div>

                    {r.landlordNote && (
                      <div style={{
                        background: 'var(--accent-muted)', border: '1px solid rgba(124,111,250,0.2)',
                        borderRadius: 8, padding: '10px 13px',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                          Landlord note
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-subtle)', margin: 0, lineHeight: 1.6 }}>{r.landlordNote}</p>
                      </div>
                    )}

                    {r.resolvedAt && (
                      <div style={{ fontSize: 12, color: 'var(--success)' }}>
                        ✓ Resolved on {formatDate(r.resolvedAt)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}