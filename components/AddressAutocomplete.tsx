'use client'

import { useState, useRef, useEffect } from 'react'

interface NominatimResult {
  place_id: number
  display_name: string
  address: {
    house_number?: string
    road?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    postcode?: string
  }
}

export interface AddressValue {
  street: string
  city: string
  state: string
  zip: string
}

interface Props {
  value: string
  onChange: (value: AddressValue) => void
  placeholder?: string
}

export default function AddressAutocomplete({ value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = async (q: string) => {
    if (q.length < 4) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&countrycodes=us`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'Darli-App/1.0' } }
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  const handleChange = (val: string) => {
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 380)
  }

  const handleSelect = (r: NominatimResult) => {
    const a = r.address
    const street = [a.house_number, a.road].filter(Boolean).join(' ')
    const city = a.city || a.town || a.village || a.county || ''
    const state = a.state || ''
    const zip = a.postcode || ''
    const display = street || r.display_name.split(',')[0]
    setQuery(display)
    setOpen(false)
    onChange({ street: display, city, state, zip })
  }

  return (
    <div ref={wrapRef} className="autocomplete-wrap">
      <div style={{ position: 'relative' }}>
        <input
          className="field-input"
          type="text"
          placeholder={placeholder || 'Start typing an address...'}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'var(--accent)' }} />
          </div>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="address-dropdown">
          {results.map((r) => (
            <button
              key={r.place_id}
              type="button"
              className="address-option"
              onClick={() => handleSelect(r)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ flex: 1, textAlign: 'left' }}>{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}