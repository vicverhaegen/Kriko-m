'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useCart } from './CartProvider'
import { formatPrice } from '@/lib/utils'

interface Product {
  id: string
  name: string
  category: string
  price: number
  description: string
  image?: string
  sizes?: string[]
}

export default function ShopProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] ?? 'Standaard')
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize,
      image: product.image,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="shop-card">
      <div className="shop-card-image">
        {product.image ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', height: '100%', width: '100%', minHeight: 220, alignItems: 'center', justifyContent: 'center', background: '#E2E8F0', color: '#64748B', position: 'relative' }}>
            <i className="fa-solid fa-shirt" style={{ fontSize: '3.5rem', opacity: 0.35 }} />
          </div>
        )}
      </div>

      <div className="shop-card-body">
        <h3 className="shop-card-title">{product.name}</h3>
        <div className="shop-card-price">{formatPrice(product.price)}</div>
        <p className="shop-card-desc">{product.description}</p>

        {product.sizes && product.sizes.length > 0 && (
          <>
            <label className="form-label" style={{ marginBottom: 4, fontSize: '0.8rem' }}>
              Selecteer Maat:
            </label>
            <select
              className="shop-size-select"
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
            >
              {product.sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}

        <button
          className="btn btn-secondary btn-add-to-cart"
          style={{ width: '100%', marginTop: 'auto' }}
          onClick={handleAdd}
        >
          <i className="fa-solid fa-bag-shopping" style={{ marginRight: 8 }} />
          {added ? 'Toegevoegd!' : 'In winkelmandje'}
        </button>
      </div>
    </div>
  )
}
