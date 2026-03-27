'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import StripeProvider from './StripeProvider'

type RentInfo = {
  unitNumber: string
  unitId: string
  rentAmount: number
  currentMonth: string
  landlordName: string | null
}

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function CheckoutForm({
  rentInfo,
  onClose,
  onSuccess,
}: {
  rentInfo: RentInfo
  onClose: () => void
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form')

  const handlePay = async () => {
    if (!stripe || !elements) return
    setError('')
    setPhase('processing')

    const { error: submitError } = await elements.submit()
    if (submitError) { setError(submitError.message || 'Invalid payment details'); setPhase('form'); return }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message || 'Payment failed. Please try again.')
      setPhase('form')
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      // Record in our DB
      const res = await fetch('/api/tenant/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          unitId: rentInfo.unitId,
          amount: rentInfo.rentAmount,
          month: rentInfo.currentMonth,
        }),
      })
      if (!res.ok) { setError('Payment succeeded but failed to record. Contact support.'); setPhase('form'); return }
      setPhase('success')
      setTimeout(onSuccess, 2000)
    } else {
      setError('Payment incomplete. Please try again.')
      setPhase('form')
    }
  }

  if (phase === 'success') {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div className="success-icon-wrap" style={{ width: 60, height: 60 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Payment successful! 🎉</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            ${rentInfo.rentAmount.toLocaleString()} paid for {formatMonth(rentInfo.currentMonth)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          A receipt has been sent to your email.
        </div>
      </div>
    )
  }

  if (phase === 'processing') {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Processing payment…</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Please don&apos;t close this window</div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-body">
      {/* Amount summary */}
      <div className="pay-summary">
        <div className="pay-summary-label">Amount due</div>
        <div className="pay-summary-amount">${rentInfo.rentAmount.toLocaleString()}</div>
        <div className="pay-summary-sub">
          {formatMonth(rentInfo.currentMonth)}
          {rentInfo.landlordName && ` · to ${rentInfo.landlordName}`}
        </div>
      </div>

      {/* Stripe Payment Element — renders card, Apple Pay, Google Pay etc */}
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
        }}
      />

      {error && (
        <div className="error-msg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="stripe-secure-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Secured by Stripe · 256-bit encryption
      </div>

      <button className="btn-primary" onClick={handlePay} disabled={!stripe || !elements}>
        Pay ${rentInfo.rentAmount.toLocaleString()}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <svg width="200" height="24" viewBox="0 0 200 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="17" textAnchor="middle" fill="#5a5a78" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">Powered by</text>
          <text x="50%" y="17" textAnchor="middle" fill="#5a5a78" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif" dx="28">Stripe</text>
        </svg>
      </div>
    </div>
  )
}

export default function StripePaymentModal({
  rentInfo,
  clientSecret,
  onClose,
  onSuccess,
}: {
  rentInfo: RentInfo
  clientSecret: string
  onClose: () => void
  onSuccess: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pay-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Pay Rent</div>
            <div className="modal-sub">Unit {rentInfo.unitNumber} · {formatMonth(rentInfo.currentMonth)}</div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <StripeProvider clientSecret={clientSecret}>
          <CheckoutForm rentInfo={rentInfo} onClose={onClose} onSuccess={onSuccess} />
        </StripeProvider>
      </div>
    </div>
  )
}