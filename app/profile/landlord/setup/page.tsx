'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import type { AddressValue } from '@/components/AddressAutocomplete'

type UnitEntry = { id: string; number: string; bedrooms: number | null; bathrooms: number | null; sqft: number | null }
type NewUnitForm = { number: string; bedrooms: string; bathrooms: string; sqft: string }
type BuildingEntry = { id: string; name: string; street: string; city: string; state: string; zip: string; units: UnitEntry[]; newUnit: NewUnitForm }

const uid = () => Math.random().toString(36).slice(2, 9)
const blankNewUnit = (): NewUnitForm => ({ number: '', bedrooms: '', bathrooms: '', sqft: '' })
const newBuilding = (): BuildingEntry => ({ id: uid(), name: '', street: '', city: '', state: '', zip: '', units: [], newUnit: blankNewUnit() })

const ErrorMsg = ({ msg }: { msg: string }) => msg ? (
  <div className="error-msg">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
    {msg}
  </div>
) : null

function VerifyCheck({ label, delay }: { label: string; delay: number }) {
  const [done, setDone] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDone(true), delay + 600); return () => clearTimeout(t) }, [delay])
  return (
    <div className="verify-check-row">
      <div className={`verify-check-icon ${done ? 'done' : ''}`}>
        {done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
          : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border-hover)' }} />}
      </div>
      <span style={{ fontSize: 13, color: done ? 'var(--text)' : 'var(--text-muted)', transition: 'color 0.3s' }}>{label}</span>
    </div>
  )
}

function BuildingVerificationStep({
  buildingIds,
  buildingNames,
  onApproved,
}: {
  buildingIds: string[]
  buildingNames: string[]
  onApproved: () => void
}) {
  const [phase, setPhase] = useState<'idle' | 'uploaded' | 'verifying' | 'approved'>('idle')
  const [uploadedFile, setUploadedFile] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const useSample = () => { setUploadedFile('Sample_Property_Deed.pdf'); setPhase('uploaded') }

  const downloadSample = () => {
    const content = `SAMPLE PROPERTY DEED — DARLI DEMO\n\nProperties:\n${buildingNames.map((n, i) => `  ${i + 1}. ${n}`).join('\n')}\n\nOwner: Demo Landlord\nType: Warranty Deed\nDate: ${new Date().toLocaleDateString()}\n\nThis is a sample document for demo purposes only.\nIn production, landlords upload a deed, mortgage statement,\nutility bill, or tax record for each property.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'Sample_Property_Deed.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleVerify = () => {
    setPhase('verifying')
    setTimeout(async () => {
      // Mark profile as verified (first time)
      await fetch('/api/verification/landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'DARLI-LL-2024' }),
      })
      // Mark each building as verified
      await fetch('/api/verification/building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingIds }),
      })
      setPhase('approved')
      setTimeout(onApproved, 1400)
    }, 3000)
  }

  const checks = [
    'Scanning document authenticity',
    'Cross-referencing property records',
    'Validating ownership details',
    'Confirming identity match',
  ]

  return (
    <div className="verify-box">
      <div className="verify-icon-wrap">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
      </div>
      <h2 className="verify-title">Verify property ownership</h2>
      <p className="verify-sub">
        Confirm you own or manage the {buildingIds.length > 1 ? `${buildingIds.length} properties` : 'property'} you just added.
        Upload a deed, mortgage statement, or utility bill — or use the sample for this demo.
      </p>

      {/* Buildings being verified */}
      <div className="verify-buildings-list">
        {buildingNames.map((name, i) => (
          <div key={i} className="verify-building-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
            {name}
          </div>
        ))}
      </div>

      <div className="doc-types-row">
        {['Property Deed', 'Mortgage Statement', 'Utility Bill', 'Tax Record'].map(d => (
          <div key={d} className="doc-type-chip">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            {d}
          </div>
        ))}
      </div>

      {phase === 'idle' && (
        <>
          <div className="demo-callout">
            <div className="demo-callout-left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              <div>
                <div className="demo-callout-title">Sample_Property_Deed.pdf</div>
                <div className="demo-callout-sub">Demo document · no personal info required</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button type="button" className="btn-ghost btn-sm" onClick={downloadSample}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Download
              </button>
              <button type="button" className="btn-primary btn-sm" onClick={useSample}>Use Sample</button>
            </div>
          </div>
          <div className="divider" style={{ margin: '4px 0' }}><span>or upload your own</span></div>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) { setUploadedFile(e.target.files[0].name); setPhase('uploaded') } }} />
          <div className="upload-zone" onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setUploadedFile(f.name); setPhase('uploaded') } }}>
            <div className="upload-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg></div>
            <div className="upload-label">Drop files here or <span className="upload-link">browse</span></div>
            <div className="upload-sub">PDF, JPG, PNG — up to 10MB each</div>
          </div>
        </>
      )}

      {phase === 'uploaded' && (
        <div className="uploaded-ready">
          <div className="uploaded-file" style={{ background: 'var(--accent-dim)', borderColor: 'rgba(200,255,71,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            <span style={{ flex: 1, color: 'var(--text)', fontSize: 13 }}>{uploadedFile}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', padding: 0 }} onClick={() => { setUploadedFile(''); setPhase('idle') }}>← Use a different document</button>
        </div>
      )}

      {phase === 'verifying' && (
        <div className="verifying-box">
          <div className="verifying-header">
            <div className="spinner" style={{ width: 20, height: 20, border: '2.5px solid var(--border)', borderTopColor: 'var(--accent)' }} />
            <div className="verifying-title">Verifying ownership…</div>
          </div>
          <div className="verify-checks">{checks.map((c, i) => <VerifyCheck key={c} label={c} delay={i * 700} />)}</div>
        </div>
      )}

      {phase === 'approved' && (
        <div className="verifying-box" style={{ borderColor: 'rgba(200,255,71,0.25)', background: 'rgba(200,255,71,0.05)' }}>
          <div className="verifying-header">
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#08080f" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div className="verifying-title" style={{ color: 'var(--accent)' }}>
              {buildingIds.length > 1 ? 'All properties verified!' : 'Property verified!'}
            </div>
          </div>
        </div>
      )}

      {(phase === 'idle' || phase === 'uploaded') && (
        <button className="btn-primary" onClick={handleVerify} disabled={!uploadedFile}>
          {!uploadedFile ? 'Select a document to continue' : (<>Submit for Verification <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>)}
        </button>
      )}
    </div>
  )
}

export default function LandlordSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [buildings, setBuildings] = useState<BuildingEntry[]>([newBuilding()])
  const [newBuildingIds, setNewBuildingIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (!data.profile) router.replace('/profile/create')
      else if (data.profile.role !== 'landlord') router.replace('/dashboard')
      else setChecking(false) // Always allow through — even verified landlords can add buildings
    }).catch(() => setChecking(false))
  }, [router])

  const updateBuilding = (id: string, patch: Partial<BuildingEntry>) =>
    setBuildings(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))

  const updateNewUnit = (bid: string, patch: Partial<NewUnitForm>) =>
    setBuildings(prev => prev.map(b => b.id === bid ? { ...b, newUnit: { ...b.newUnit, ...patch } } : b))

  const onAddress = (id: string, addr: AddressValue) =>
    updateBuilding(id, { street: addr.street, city: addr.city, state: addr.state, zip: addr.zip })

  const addUnit = (bid: string) => {
    setBuildings(prev => prev.map(b => {
      if (b.id !== bid) return b
      const { number, bedrooms, bathrooms, sqft } = b.newUnit
      if (!number.trim()) return b
      return {
        ...b,
        units: [...b.units, { id: uid(), number: number.trim(), bedrooms: bedrooms ? Number(bedrooms) : null, bathrooms: bathrooms ? Number(bathrooms) : null, sqft: sqft ? Number(sqft) : null }],
        newUnit: blankNewUnit(),
      }
    }))
  }

  const removeUnit = (bid: string, unitId: string) =>
    setBuildings(prev => prev.map(b => b.id === bid ? { ...b, units: b.units.filter(u => u.id !== unitId) } : b))

  const handleSave = async () => {
    setError('')
    for (const b of buildings) {
      if (!b.street) { setError('Please enter an address for each building'); return }
      if (!b.city || !b.state) { setError('Please fill in city and state for each building'); return }
      if (b.units.length === 0) { setError('Please add at least one unit to each building'); return }
    }
    setLoading(true)
    const res = await fetch('/api/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buildings: buildings.map(b => ({
          name: b.name || null, address: b.street, city: b.city, state: b.state, zip: b.zip,
          units: b.units.map(u => ({ number: u.number, bedrooms: u.bedrooms, bathrooms: u.bathrooms, sqft: u.sqft })),
        })),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save'); setLoading(false); return }
    setNewBuildingIds(data.buildingIds)
    setStep(2)
    setLoading(false)
  }

  const buildingDisplayNames = buildings.map(b =>
    [b.name, b.street, b.city].filter(Boolean).join(' — ') || 'New Building'
  )

  const steps = [
    { n: 1, label: 'Properties', sub: 'Add your buildings' },
    { n: 2, label: 'Verification', sub: 'Confirm ownership' },
    { n: 3, label: 'Approved', sub: 'Ready to go' },
  ]

  if (checking) return <div className="page-center"><div className="spinner" style={{ width: 24, height: 24, borderTopColor: 'var(--accent)' }} /></div>

  return (
    <div className="wizard-page">
      <div className="wizard-sidebar">
        <div className="wizard-logo"><span className="brand-dot" />Darli</div>
        <div className="wizard-steps">
          {steps.map((s, i) => (
            <div key={s.n} className={`wizard-step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
              <div className="wizard-step-left">
                <div className="wizard-step-circle">
                  {step > s.n ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> : s.n}
                </div>
                {i < steps.length - 1 && <div className="wizard-step-line" />}
              </div>
              <div className="wizard-step-info">
                <div className="wizard-step-label">{s.label}</div>
                <div className="wizard-step-sublabel">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        {step === 1 && (
          <>
            <div className="wizard-content-header">
              <h1 className="wizard-content-title">Your properties</h1>
              <p className="wizard-content-sub">Add the buildings and units you manage</p>
            </div>

            <div className="buildings-list">
              {buildings.map((b, idx) => (
                <div key={b.id} className="building-card">
                  <div className="building-card-header">
                    <span className="building-card-label">Building {idx + 1}</span>
                    {buildings.length > 1 && (
                      <button className="icon-btn" onClick={() => setBuildings(prev => prev.filter(x => x.id !== b.id))}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" /></svg>
                      </button>
                    )}
                  </div>
                  <div className="building-card-body">
                    <div className="field-group">
                      <label className="field-label">Building name (optional)</label>
                      <input className="field-input" placeholder="e.g. Maple Heights" value={b.name} onChange={e => updateBuilding(b.id, { name: e.target.value })} />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Street address *</label>
                      <AddressAutocomplete value={b.street} onChange={addr => onAddress(b.id, addr)} placeholder="Start typing an address..." />
                    </div>
                    <div className="three-col">
                      <div className="field-group"><label className="field-label">City *</label><input className="field-input" placeholder="New York" value={b.city} onChange={e => updateBuilding(b.id, { city: e.target.value })} /></div>
                      <div className="field-group"><label className="field-label">State *</label><input className="field-input" placeholder="NY" value={b.state} onChange={e => updateBuilding(b.id, { state: e.target.value })} /></div>
                      <div className="field-group"><label className="field-label">ZIP</label><input className="field-input" placeholder="10001" value={b.zip} onChange={e => updateBuilding(b.id, { zip: e.target.value })} /></div>
                    </div>

                    <div className="unit-section">
                      <div className="unit-section-label">Units *</div>
                      {b.units.length > 0 && (
                        <div className="unit-cards-list">
                          {b.units.map(u => (
                            <div key={u.id} className="unit-detail-card">
                              <div className="unit-detail-left">
                                <div className="unit-detail-num">Unit {u.number}</div>
                                <div className="unit-detail-meta">
                                  {u.bedrooms !== null ? (u.bedrooms === 0 ? 'Studio' : `${u.bedrooms} bed`) : '—'}
                                  {u.bathrooms !== null ? ` · ${u.bathrooms} bath` : ''}
                                  {u.sqft ? ` · ${u.sqft.toLocaleString()} sqft` : ''}
                                </div>
                              </div>
                              <button type="button" className="unit-chip-remove" onClick={() => removeUnit(b.id, u.id)}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="add-unit-form">
                        <div className="add-unit-form-grid">
                          <div className="field-group" style={{ gridColumn: 'span 2' }}>
                            <label className="field-label">Unit #</label>
                            <input className="field-input" placeholder="1A, 201…" value={b.newUnit.number} onChange={e => updateNewUnit(b.id, { number: e.target.value })} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUnit(b.id))} />
                          </div>
                          <div className="field-group">
                            <label className="field-label">Bedrooms</label>
                            <select className="field-input field-select" value={b.newUnit.bedrooms} onChange={e => updateNewUnit(b.id, { bedrooms: e.target.value })}>
                              <option value="">—</option>
                              <option value="0">Studio</option>
                              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} bed</option>)}
                            </select>
                          </div>
                          <div className="field-group">
                            <label className="field-label">Bathrooms</label>
                            <select className="field-input field-select" value={b.newUnit.bathrooms} onChange={e => updateNewUnit(b.id, { bathrooms: e.target.value })}>
                              <option value="">—</option>
                              {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(n => <option key={n} value={n}>{n} bath</option>)}
                            </select>
                          </div>
                          <div className="field-group" style={{ gridColumn: 'span 2' }}>
                            <label className="field-label">Sqft (optional)</label>
                            <input className="field-input" type="number" placeholder="850" value={b.newUnit.sqft} onChange={e => updateNewUnit(b.id, { sqft: e.target.value })} />
                          </div>
                        </div>
                        <button type="button" className="btn-ghost btn-sm" onClick={() => addUnit(b.id)} disabled={!b.newUnit.number.trim()}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          Add Unit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn-ghost" style={{ marginBottom: 24 }} onClick={() => setBuildings(prev => [...prev, newBuilding()])}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add another building
            </button>

            <ErrorMsg msg={error} />
            <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ maxWidth: 220, marginTop: error ? 12 : 0 }}>
              {loading ? <span className="spinner" /> : (<>Save &amp; Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>)}
            </button>
          </>
        )}

        {step === 2 && (
          <BuildingVerificationStep
            buildingIds={newBuildingIds}
            buildingNames={buildingDisplayNames}
            onApproved={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <div className="success-box">
            <div className="success-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h2 className="success-title">
              {buildings.length > 1 ? 'Properties verified! 🎉' : 'Property verified! 🎉'}
            </h2>
            <p className="success-sub">
              Your {buildings.length > 1 ? `${buildings.length} buildings are` : 'building is'} approved and ready. Head to your dashboard to manage units and invite tenants.
            </p>
            <button className="btn-primary" onClick={() => router.push('/dashboard')} style={{ margin: '0 auto', maxWidth: 200 }}>
              Go to Dashboard <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}