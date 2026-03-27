'use client'

import { ReactNode } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function StripeProvider({ children, clientSecret }: { children: ReactNode; clientSecret: string }) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#c8ff47',
            colorBackground: '#0f0f18',
            colorText: '#ebebf5',
            colorDanger: '#ff4f6b',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            borderRadius: '9px',
            colorInputBackground: '#0f0f18',
            colorInputBorder: '#1c1c2e',
            colorInputText: '#ebebf5',
            colorInputPlaceholder: '#5a5a78',
          },
          rules: {
            '.Input': { border: '1px solid #1c1c2e', padding: '12px 14px', fontSize: '14px' },
            '.Input:focus': { border: '1px solid #c8ff47', boxShadow: '0 0 0 3px rgba(200,255,71,0.08)' },
            '.Label': { fontSize: '12.5px', fontWeight: '600', color: '#8888a8', marginBottom: '6px' },
          },
        },
      }}
    >
      {children}
    </Elements>
  )
}