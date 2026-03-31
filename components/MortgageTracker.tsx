'use client'

import { useState } from 'react'

const CURRENT_SCORE = 634
const TARGET_SCORE = 680
const EXCELLENT_SCORE = 750
const POINTS_PER_MONTH = 8
const MONTHS_TO_TARGET = Math.ceil((TARGET_SCORE - CURRENT_SCORE) / POINTS_PER_MONTH)
const PAYMENT_STREAK = 7
const TOTAL_PAYMENTS = 7
const LATE_PAYMENTS = 0

function ScoreArc({ score }: { score: number }) {
  const min = 300, max = 850
  const pct = (score - min) / (max - min)
  const arcLen = 188
  const offset = arcLen - pct * arcLen

  const label =
    score >= 800 ? 'Excellent' :
    score >= 740 ? 'Very Good' :
    score >= 670 ? 'Good' :
    score >= 580 ? 'Fair' : 'Poor'

  const color =
    score >= 740 ? 'var(--success)' :
    score >= 670 ? 'var(--accent)' :
    score >= 580 ? 'var(--warning)' : 'var(--error)'

  return (
    <svg width="160" height="100" viewBox="0 0 160 100">
      <path
        d="M20 90 A66 66 0 0 1 140 90"
        fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round"
      />
      <path
        d="M20 90 A66 66 0 0 1 140 90"
        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        strokeDasharray={arcLen} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="80" y="76" textAnchor="middle"
        style={{ fontSize: 28, fontWeight: 800, fill: 'var(--text)', fontFamily: 'var(--font)', letterSpacing: '-0.03em' }}
      >
        {score}
      </text>
      <text
        x="80" y="92" textAnchor="middle"
        style={{ fontSize: 11, fontWeight: 600, fill: color, fontFamily: 'var(--font)' }}
      >
        {label}
      </text>
    </svg>
  )
}

function FactorBar({ label, pct, status }: { label: string; pct: number; status: 'good' | 'fair' | 'poor' }) {
  const color = status === 'good' ? 'var(--success)' : status === 'fair' ? 'var(--warning)' : 'var(--error)'
  const pillClass = status === 'good' ? 'accepted' : status === 'fair' ? 'invited' : 'due'
  const pillLabel = status === 'good' ? 'Good' : status === 'fair' ? 'Fair' : 'Needs work'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
        <span className={`status-pill ${pillClass}`} style={{ fontSize: 10.5 }}>{pillLabel}</span>
      </div>
      <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: color, transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

function Milestone({
  done, active, label, sub,
}: { done?: boolean; active?: boolean; label: string; sub: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: done ? 'var(--success)' : active ? 'var(--accent)' : 'transparent',
        border: done ? 'none' : active ? '2px solid var(--accent)' : '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <div>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: done ? 'var(--text-subtle)' : active ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  )
}

function ScoreTierBar() {
  const pct = ((CURRENT_SCORE - 300) / 550) * 100

  return (
    <div>
      <div style={{ position: 'relative', height: 10, background: 'var(--surface-2)', borderRadius: 99, overflow: 'visible', marginBottom: 8 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: '100%', borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '100%',
            background: 'linear-gradient(90deg, var(--error) 0%, var(--warning) 33%, var(--accent) 60%, var(--success) 100%)',
          }} />
        </div>
        {/* thumb */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 6px)`,
          top: -3, width: 13, height: 16,
          background: 'var(--text)', borderRadius: 3,
          border: '2px solid var(--surface)',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        {[
          { label: 'Poor', range: '300–579', color: 'var(--error)' },
          { label: 'Fair', range: '580–669', color: 'var(--warning)' },
          { label: 'Good', range: '670–739', color: 'var(--accent)' },
          { label: 'Excellent', range: '800+', color: 'var(--success)' },
        ].map(t => (
          <div key={t.label} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: t.color }}>{t.label}</div>
            <div style={{ color: 'var(--text-muted)' }}>{t.range}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
        Your score: <strong style={{ color: 'var(--accent)' }}>{CURRENT_SCORE}</strong>
        {' '}— {TARGET_SCORE - CURRENT_SCORE} points from <strong style={{ color: 'var(--text)' }}>Good (mortgage-ready)</strong>
      </div>
    </div>
  )
}

const targetMonth = (() => {
  const d = new Date()
  d.setMonth(d.getMonth() + MONTHS_TO_TARGET)
  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
})()

const excellentMonth = (() => {
  const d = new Date()
  d.setMonth(d.getMonth() + Math.ceil((EXCELLENT_SCORE - CURRENT_SCORE) / POINTS_PER_MONTH))
  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
})()

export default function MortgageTracker() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tips'>('overview')

  return (
    <div className="mortgage-tracker">

      {/* ── HERO CARD ── */}
      <div className="mortgage-card mortgage-hero-card">
        <div className="mortgage-hero-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="mortgage-hero-title">Mortgage Readiness Tracker</span>
          <span className="status-pill invited" style={{ fontSize: 10.5, marginLeft: 'auto' }}>
            Beta
          </span>
        </div>

        <div className="mortgage-hero-grid">
          {/* Arc */}
          <div className="mortgage-score-arc-wrap">
            <ScoreArc score={CURRENT_SCORE} />
          </div>

          {/* Main info */}
          <div className="mortgage-hero-main">
            <div>
              <div className="mortgage-eyebrow">
                Estimated readiness
              </div>
              <div className="mortgage-main-metric">
                {MONTHS_TO_TARGET} months away
              </div>
              <div className="mortgage-sub-metric">
                Target score: <strong style={{ color: 'var(--text)' }}>{TARGET_SCORE}</strong>
                {' '}· Need <strong style={{ color: 'var(--accent)' }}>+{TARGET_SCORE - CURRENT_SCORE} pts</strong>
              </div>
            </div>

            <div className="mortgage-trajectory">
              <div className="mortgage-trajectory-label">At your current trajectory</div>
              <div className="mortgage-trajectory-value">
                "Mortgage-ready by {targetMonth}"
              </div>
            </div>
          </div>

          {/* Stats column */}
          <div className="mortgage-kpi-grid">
            {[
              { val: `+${POINTS_PER_MONTH}`, label: 'pts / month', color: 'var(--success)' },
              { val: String(PAYMENT_STREAK), label: 'on-time streak', color: 'var(--text)' },
              { val: `${TOTAL_PAYMENTS}`, label: 'payments made', color: 'var(--text)' },
              { val: `${LATE_PAYMENTS}`, label: 'late payments', color: 'var(--success)' },
            ].map(s => (
              <div key={s.label} className="mortgage-kpi-card">
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.val}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="dash-tabs">
        <button className={`dash-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </button>
        <button className={`dash-tab ${activeTab === 'tips' ? 'active' : ''}`} onClick={() => setActiveTab('tips')}>
          How to improve
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="mortgage-overview">

          {/* Score tier bar */}
          <div className="mortgage-card mortgage-section-card">
            <div className="mortgage-eyebrow">
              Credit score tiers
            </div>
            <ScoreTierBar />
          </div>

          {/* 2-col: factors + roadmap */}
          <div className="mortgage-two-col">

            {/* Score factors */}
            <div className="mortgage-card mortgage-section-card">
              <div className="mortgage-eyebrow">
                Score factors
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <FactorBar label="Payment history" pct={92} status="good" />
                <FactorBar label="Credit utilization" pct={74} status="good" />
                <FactorBar label="Credit age" pct={44} status="fair" />
                <FactorBar label="Credit mix" pct={38} status="fair" />
                <FactorBar label="New inquiries" pct={80} status="good" />
              </div>
            </div>

            {/* Roadmap */}
            <div className="mortgage-card mortgage-section-card">
              <div className="mortgage-eyebrow">
                Your homeownership roadmap
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Milestone done label="First rent reported" sub="Aug 2025 · Credit journey begins" />
                <Milestone done label="Score hit 600" sub="Nov 2025 · +34 pts from rent reporting" />
                <Milestone active label={`Target: ${TARGET_SCORE} (Good)`} sub={`~${targetMonth} · Qualifies for conventional mortgage`} />
                <Milestone label={`Target: ${EXCELLENT_SCORE} (Excellent)`} sub={`~${excellentMonth} · Best interest rates`} />
                <Milestone label="First home purchase" sub="Your path from rent to ownership" />
              </div>
            </div>
          </div>

          {/* Projection chart — simple visual */}
          <div className="mortgage-card mortgage-section-card">
            <div className="mortgage-eyebrow" style={{ marginBottom: 16 }}>
              Score projection (next 12 months)
            </div>
            <div style={{ position: 'relative', height: 80 }}>
              {/* Goal line */}
              <div style={{
                position: 'absolute', left: 0, right: 0,
                top: `${100 - ((TARGET_SCORE - 580) / 140) * 100}%`,
                borderTop: '1px dashed rgba(124,111,250,0.4)',
                display: 'flex', alignItems: 'center',
              }}>
                <span style={{ fontSize: 10.5, color: 'var(--accent)', background: 'var(--surface)', paddingRight: 4, marginLeft: 'auto' }}>
                  Target 680
                </span>
              </div>
              {/* Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: '100%' }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const score = Math.min(750, CURRENT_SCORE + (i + 1) * POINTS_PER_MONTH)
                  const h = ((score - 580) / 140) * 100
                  const isTarget = score >= TARGET_SCORE
                  const isPast = i < MONTHS_TO_TARGET
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{
                        width: '100%', height: `${h}%`,
                        background: isTarget ? 'var(--success)' : isPast ? 'var(--accent)' : 'var(--border)',
                        borderRadius: '3px 3px 0 0', opacity: isPast ? 1 : 0.35,
                        transition: 'height 0.6s ease',
                      }} />
                    </div>
                  )
                })}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Apr 2026</span>
              <span>Mar 2027</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
              {[
                { color: 'var(--accent)', label: 'Building toward target' },
                { color: 'var(--success)', label: 'Mortgage ready' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* ── TIPS TAB ── */
        <div className="mortgage-tips">
          {[
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ),
              color: 'rgba(52,211,153,0.08)',
              border: 'rgba(52,211,153,0.2)',
              title: 'Keep paying rent on time — your biggest lever',
              body: `Each on-time rent payment adds ~${POINTS_PER_MONTH} points to your score. Your ${PAYMENT_STREAK}-month streak is your strongest asset. Never miss a payment — one missed payment can drop your score 60–110 points.`,
              tag: 'High impact',
              tagClass: 'accepted',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              ),
              color: 'rgba(124,111,250,0.06)',
              border: 'rgba(124,111,250,0.2)',
              title: 'Keep credit utilization below 30%',
              body: 'Credit utilization (how much of your credit limit you use) is the 2nd biggest factor. Aim to use less than 30% of any credit card limit. Below 10% is ideal and can add 20–40 points.',
              tag: 'Medium impact',
              tagClass: 'invited',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ),
              color: 'rgba(245,158,11,0.06)',
              border: 'rgba(245,158,11,0.2)',
              title: "Don't open new credit accounts right now",
              body: 'Each new credit application causes a hard inquiry that temporarily drops your score 5–10 points. Avoid opening new credit cards or loans until your score reaches 680. Exceptions: student loans already in repayment.',
              tag: 'Important',
              tagClass: 'invited',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              ),
              color: 'var(--surface-2)',
              border: 'var(--border)',
              title: 'Build credit age by keeping old accounts open',
              body: 'The age of your oldest account matters. If you have any old credit cards, keep them open even if unused (just spend $1/month to keep them active). Closing old accounts reduces your average credit age.',
              tag: 'Long-term',
              tagClass: 'vacant',
            },
            {
              icon: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
              color: 'var(--surface-2)',
              border: 'var(--border)',
              title: 'Consider a secured credit card',
              body: 'If you have limited credit history, a secured card (where you deposit $200–$500 as collateral) is a safe way to build credit mix. Use it for one small recurring purchase like Netflix, then pay it off in full each month.',
              tag: 'Optional',
              tagClass: 'vacant',
            },
          ].map((tip, i) => (
            <div key={i} className="mortgage-tip-card" style={{
              background: tip.color, border: `1px solid ${tip.border}`,
              borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12,
            }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>{tip.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{tip.title}</span>
                  <span className={`status-pill ${tip.tagClass}`} style={{ fontSize: 10.5, flexShrink: 0 }}>{tip.tag}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.65 }}>{tip.body}</p>
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className="mortgage-cta">
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              Your rent is building your future
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Every on-time payment through Darli is reported to all 3 credit bureaus — Equifax, Experian, and TransUnion.
              Keep it up and you'll be mortgage-ready by <strong style={{ color: 'var(--accent)' }}>{targetMonth}</strong>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}