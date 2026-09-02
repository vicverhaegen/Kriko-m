'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from './CartProvider'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export default function KentekenCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size: 'Standaard',
      image: product.image,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1.5px solid #E2E8F0',
      borderRadius: 'var(--border-radius-md, 14px)',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      boxShadow: 'var(--shadow-sm, 0 2px 6px rgba(0,0,0,0.04))',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    }} className="kenteken-card-hover">
      
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
        {/* Photo container on the left, filling 72x72px */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: 10,
          backgroundColor: '#E2E8F0',
          position: 'relative',
          flexShrink: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #CBD5E1',
        }}>
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <i className="fa-solid fa-shirt" style={{ color: '#64748B', opacity: 0.45, fontSize: '2rem' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            margin: '0 0 3px',
            fontSize: '0.92rem',
            fontWeight: 800,
            color: 'var(--color-primary-dark, #3a0710)',
            lineHeight: 1.25,
          }}>
            {product.name}
          </h4>
          <span style={{
            fontSize: '0.92rem',
            fontWeight: 900,
            color: 'var(--color-primary-dark, #3a0710)',
          }}>
            {formatPrice(product.price)}
          </span>
        </div>
      </div>

      <button
        onClick={handleAdd}
        aria-label={`Voeg ${product.name} toe`}
        title="Toevoegen aan winkelmandje"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          border: 'none',
          backgroundColor: added ? '#1A3D2A' : 'var(--color-primary, #650B19)',
          color: '#fff',
          fontWeight: 900,
          fontSize: '1.1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        <span>{added ? '✓' : '+'}</span>
      </button>

    </div>
  )
}
