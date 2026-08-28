'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings } from '@/lib/types'
import CopyButton from '@/components/CopyButton'
import ConfirmDialog from '../_components/ConfirmDialog'

interface OrderItem {
  name: string
  price: number
  quantity: number
  size?: string
}

interface AdminOrder {
  id: string
  order_ref?: string
  order_number?: number
  customer_name: string
  child_name?: string
  child_tak?: string
  email: string
  items: OrderItem[]
  total: number
  status?: string
  payment_method?: 'overschrijving' | 'cash'
  created_at?: string
}

interface ShopProduct {
  id: string
  name: string
  price: number
  category: string
  sizes?: string[] | string
  description?: string
  image?: string
}

interface Props {
  initialSettings: Settings
  role?: string
  activeTab: 'bestellingen' | 'artikelen' | 'instellingen'
  initialOrders?: AdminOrder[]
  initialShopProducts?: ShopProduct[]
}

function normalizeStatus(status?: string): 'niet_betaald' | 'betaald' | 'afgehaald' {
  if (!status) return 'niet_betaald'
  if (status === 'betaald' || status === 'paid') return 'betaald'
  if (status === 'afgehaald' || status === 'completed') return 'afgehaald'
  return 'niet_betaald'
}

export default function WebshopPageClient({
  initialSettings,
  role: _role,
  activeTab,
  initialOrders = [],
  initialShopProducts = [],
}: Props) {
  // Settings State
  const [webshopEmail, setWebshopEmail] = useState(initialSettings?.webshop_email || '')
  const [webshopFinancialEmail, setWebshopFinancialEmail] = useState(initialSettings?.webshop_financial_email || '')
  const [savingSettings, setSavingSettings] = useState(false)
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Orders State (Direct geïnitialiseerd via SSR voor 0ms laadtijd!)
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null)
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null)

  // Shop Products State (Direct geïnitialiseerd via SSR voor 0ms laadtijd!)
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>(initialShopProducts)
  const [loadingShopProducts, setLoadingShopProducts] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialShopProducts.length > 0 ? initialShopProducts[0].id : null
  )
  const [savingProduct, setSavingProduct] = useState(false)
  const [uploadingProductPhoto, setUploadingProductPhoto] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ title?: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void } | null>(null)

  const showNotification = useCallback((type: 'success' | 'error', text: string) => {
    setFlashMessage({ type, text })
    setTimeout(() => setFlashMessage(null), 4000)
  }, [])

  // Close open action menu or status menu on outside click
  useEffect(() => {
    if (!openActionMenuId && !openStatusMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.order-action-menu-container')) {
        setOpenActionMenuId(null)
      }
      if (!target.closest('.order-status-menu-container')) {
        setOpenStatusMenuId(null)
      }
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [openActionMenuId, openStatusMenuId])

  const fetchOrders = useCallback(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch('/api/admin/orders', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Ophalen bestellingen time-out')
      } else {
        console.error('Fout bij ophalen bestellingen:', err)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoadingOrders(false)
    }
  }, [])

  const fetchShopProducts = useCallback(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch('/api/admin/shop-products', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        setShopProducts(data)
        if (data.length > 0) {
          setSelectedProductId(prev => prev ?? data[0].id)
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('Ophalen artikelen time-out')
      } else {
        console.error(err)
      }
    } finally {
      clearTimeout(timeoutId)
      setLoadingShopProducts(false)
    }
  }, [])

  // Sync / refresh bij tabwissel
  useEffect(() => {
    if (activeTab === 'bestellingen' && orders.length === 0) fetchOrders()
    if (activeTab === 'artikelen' && shopProducts.length === 0) fetchShopProducts()
  }, [activeTab, orders.length, shopProducts.length, fetchOrders, fetchShopProducts])

  // Optimistic status update: UI verandert onmiddellijk (0ms), server update in de achtergrond
  async function handleStatusChange(orderId: string, newStatus: 'niet_betaald' | 'betaald' | 'afgehaald') {
    const previousOrders = [...orders]
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    setUpdatingOrderId(orderId)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (!res.ok) throw new Error('Status bijwerken mislukt')
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      // Rollback naar vorige staat indien fout
      setOrders(previousOrders)
      showNotification('error', err instanceof Error ? err.message : 'Fout bij wijzigen status')
    } finally {
      clearTimeout(timeoutId)
      setUpdatingOrderId(null)
    }
  }

  function handleOrderDelete(orderId: string, orderRef: string) {
    setOpenActionMenuId(null)
    setConfirmDialog({
      title: 'Bestelling verwijderen',
      message: `Weet je zeker dat je bestelling ${orderRef} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`,
      confirmLabel: 'Verwijderen',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        setUpdatingOrderId(orderId)
        try {
          const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Verwijderen mislukt')
          setOrders(prev => prev.filter(o => o.id !== orderId))
          showNotification('success', `Bestelling ${orderRef} verwijderd!`)
        } catch (err: unknown) {
          showNotification('error', err instanceof Error ? err.message : 'Fout bij verwijderen bestelling')
        } finally {
          setUpdatingOrderId(null)
        }
      },
    })
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webshop_email: webshopEmail.trim(),
          webshop_financial_email: webshopFinancialEmail.trim(),
        }),
      })
      if (!res.ok) throw new Error('Opslaan van instellingen mislukt')
      showNotification('success', 'Webshop instellingen succesvol opgeslagen!')
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Fout bij opslaan')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleProductSave(productToSave: ShopProduct) {
    setSavingProduct(true)
    try {
      const parsedSizes = typeof productToSave.sizes === 'string'
        ? productToSave.sizes.split(',').map(s => s.trim()).filter(Boolean)
        : productToSave.sizes

      const res = await fetch('/api/admin/shop-products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productToSave.id,
          name: productToSave.name,
          price: productToSave.price,
          category: productToSave.category,
          sizes: parsedSizes,
          description: productToSave.description,
          image: productToSave.image,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Opslaan mislukt')
      }
      const updatedProduct = await res.json()
      setShopProducts(prev => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)))
      showNotification('success', `Artikel "${productToSave.name}" opgeslagen!`)
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Fout bij opslaan')
    } finally {
      setSavingProduct(false)
    }
  }

  async function handleProductAdd() {
    setSavingProduct(true)
    try {
      const res = await fetch('/api/admin/shop-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Nieuw Artikel',
          price: 15,
          category: 'kledij',
          sizes: ['S', 'M', 'L', 'XL'],
          description: '',
        }),
      })
      if (!res.ok) throw new Error('Artikel aanmaken mislukt')
      const newProduct = await res.json()
      setShopProducts(prev => [newProduct, ...prev])
      setSelectedProductId(newProduct.id)
      showNotification('success', 'Nieuw artikel toegevoegd!')
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Fout bij toevoegen')
    } finally {
      setSavingProduct(false)
    }
  }

  function handleProductDelete(id: string) {
    setConfirmDialog({
      title: 'Artikel verwijderen',
      message: 'Weet je zeker dat je dit artikel wilt verwijderen uit de webshop?',
      confirmLabel: 'Verwijderen',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        setSavingProduct(true)
        try {
          const res = await fetch(`/api/admin/shop-products?id=${id}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Verwijderen mislukt')
          setShopProducts(prev => {
            const next = prev.filter(p => p.id !== id)
            if (next.length > 0) setSelectedProductId(next[0].id)
            return next
          })
          showNotification('success', 'Artikel succesvol verwijderd uit de webshop!')
        } catch (err: unknown) {
          showNotification('error', err instanceof Error ? err.message : 'Fout bij verwijderen')
        } finally {
          setSavingProduct(false)
        }
      },
    })
  }

  async function handleProductPhotoUpload(e: React.ChangeEvent<HTMLInputElement>, product: ShopProduct) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingProductPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'shop-product-foto')
      formData.append('productId', product.id)
      if (product.image) formData.append('oldUrl', product.image)

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Uploaden foto mislukt')
      const data = await res.json()
      if (data.url) {
        await handleProductSave({ ...product, image: data.url })
      }
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Fout bij uploaden foto')
    } finally {
      setUploadingProductPhoto(false)
    }
  }

  function handleRemoveProductPhoto(product: ShopProduct) {
    setConfirmDialog({
      title: 'Artikel foto verwijderen',
      message: 'Weet je zeker dat je deze artikel foto wilt verwijderen?',
      confirmLabel: 'Foto verwijderen',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        await handleProductSave({ ...product, image: '' })
      },
    })
  }

  // State for expanded completed orders
  const [expandedCompletedIds, setExpandedCompletedIds] = useState<string[]>([])

  const toggleCompletedOrderExpand = (orderId: string) => {
    setExpandedCompletedIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    )
  }

  // Split orders into active and completed
  const activeOrders = orders.filter(o => normalizeStatus(o.status) !== 'afgehaald')
  const completedOrders = orders.filter(o => normalizeStatus(o.status) === 'afgehaald')

  const renderOrderCard = (ord: AdminOrder, isCompletedSection = false) => {
    const curStatus = normalizeStatus(ord.status)
    const isCash = ord.payment_method === 'cash'
    const orderRef = ord.order_ref || (ord.order_number ? `KM-${String(ord.order_number).padStart(4, '0')}` : `KM-${ord.id.slice(0, 6)}`)
    const itemsList = Array.isArray(ord.items) ? ord.items : []

    const isCompleted = curStatus === 'afgehaald'
    const isPaid = curStatus === 'betaald'
    const isExpanded = !isCompletedSection || expandedCompletedIds.includes(ord.id)

    // Inklapbare rij voor Behandelde Bestellingen wanneer ingeklapt
    if (isCompletedSection && !isExpanded) {
      return (
        <div
          key={ord.id}
          onClick={() => toggleCompletedOrderExpand(ord.id)}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 14,
            padding: '14px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
        >
          {/* Linkerkant: Code — Naam + Datum */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
              {orderRef} — {ord.customer_name}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500 }}>
              {ord.created_at ? new Date(ord.created_at).toLocaleString('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
            </span>
          </div>

          {/* Rechterkant: Prijs + Chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <strong style={{ fontSize: '1.05rem', fontWeight: 900, color: '#650B19', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
              €{(ord.total || 0).toFixed(2).replace('.', ',')}
            </strong>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              fontSize: '0.75rem',
            }}>
              <i className="fa-solid fa-chevron-down"></i>
            </div>
          </div>
        </div>
      )
    }

    let badgeBg = '#FEE2E2'
    let badgeColor = '#991B1B'
    let badgeBorder = '#FCA5A5'
    let currentLabel = isCash ? 'Niet opgehaald' : 'Niet betaald'

    if (isCompleted) {
      badgeBg = '#DCFCE7'
      badgeColor = '#15803D'
      badgeBorder = '#86EFAC'
      currentLabel = 'Opgehaald'
    } else if (isPaid) {
      badgeBg = '#EBF0F9'
      badgeColor = '#1E3A8A'
      badgeBorder = '#CBD5E1'
      currentLabel = 'Betaald'
    }

    const statusOptions = isCash
      ? [
          { value: 'niet_betaald' as const, label: 'Niet opgehaald', dotColor: '#DC2626', activeBg: '#FEF2F2', activeColor: '#991B1B' },
          { value: 'afgehaald' as const, label: 'Opgehaald', dotColor: '#16A34A', activeBg: '#F0FDF4', activeColor: '#15803D' },
        ]
      : [
          { value: 'niet_betaald' as const, label: 'Niet betaald', dotColor: '#DC2626', activeBg: '#FEF2F2', activeColor: '#991B1B' },
          { value: 'betaald' as const, label: 'Betaald', dotColor: '#2563EB', activeBg: '#EBF0F9', activeColor: '#1E3A8A' },
          { value: 'afgehaald' as const, label: 'Opgehaald', dotColor: '#16A34A', activeBg: '#F0FDF4', activeColor: '#15803D' },
        ]

    return (
      <div
        key={ord.id}
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 16,
          padding: '18px 22px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          position: 'relative',
        }}
      >
        {/* 1. TITEL: Code KM-xxxx — Naam van de persoon (met dunne divider onderaan) */}
        <div
          onClick={isCompletedSection ? () => toggleCompletedOrderExpand(ord.id) : undefined}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
            cursor: isCompletedSection ? 'pointer' : 'default',
            userSelect: 'none',
            borderBottom: '1px solid #F1F5F9',
            paddingBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
              {orderRef} — {ord.customer_name}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500 }}>
              {ord.created_at ? new Date(ord.created_at).toLocaleString('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
            </span>
          </div>

          {/* Rechter acties: Chevron omhoog + 3-puntjes menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isCompletedSection && (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  fontSize: '0.75rem',
                }}
              >
                <i className="fa-solid fa-chevron-up"></i>
              </div>
            )}

            {/* 3-puntjes optiemenu */}
            <div
              className="order-action-menu-container"
              style={{ position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpenActionMenuId(openActionMenuId === ord.id ? null : ord.id)}
                title="Opties"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: openActionMenuId === ord.id ? '#E2E8F0' : 'transparent',
                  border: '1px solid #E2E8F0',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                }}
              >
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </button>

            {openActionMenuId === ord.id && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  width: 180,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '1px solid #CBD5E1',
                  zIndex: 50,
                  padding: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => handleOrderDelete(ord.id, orderRef)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#DC2626',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FDF0F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <i className="fa-solid fa-trash" style={{ fontSize: '0.78rem' }}></i>
                  <span>Bestelling Verwijderen</span>
                </button>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* 2. CONTACTGEGEVENS (Direct onder de titel) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.88rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-envelope" style={{ color: '#64748B', fontSize: '0.85rem' }}></i>
            <CopyButton text={ord.email} variant="inline">
              {ord.email}
            </CopyButton>
          </div>

          {ord.child_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
              <i className="fa-solid fa-child" style={{ color: '#64748B', fontSize: '0.85rem' }}></i>
              <span>Voor lid: <strong>{ord.child_name}</strong> {ord.child_tak ? `(${ord.child_tak})` : ''}</span>
            </div>
          )}
        </div>

        {/* 3. APARTE SECTIE VOOR HET GELD & DE BESTELLING */}
        <div style={{
          backgroundColor: '#F8FAFC',
          borderRadius: 12,
          border: '1.5px solid #E2E8F0',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {/* Header van het geldblok: Betaalmethode + Custom Status Dropdown Popover */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
            
            {/* Betaalmethode (Overschrijving of Cash) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isCash ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  backgroundColor: '#EEF5F1',
                  color: '#166534',
                  border: '1px solid #C2D9C9',
                }}>
                  <i className="fa-solid fa-money-bill-wave"></i>
                  <span>Contant / Cash</span>
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  backgroundColor: '#EBF0F9',
                  color: '#1E3A8A',
                  border: '1px solid #CBD5E1',
                }}>
                  <i className="fa-solid fa-building-columns"></i>
                  <span>Bankoverschrijving</span>
                </span>
              )}
            </div>

            {/* Custom Status Dropdown Popover Menu */}
            <div className="order-status-menu-container" style={{ position: 'relative' }}>
              <button
                type="button"
                disabled={updatingOrderId === ord.id}
                onClick={() => setOpenStatusMenuId(openStatusMenuId === ord.id ? null : ord.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: updatingOrderId === ord.id ? 'wait' : 'pointer',
                  backgroundColor: badgeBg,
                  color: badgeColor,
                  border: `1px solid ${badgeBorder}`,
                  transition: 'all 0.15s ease',
                }}
              >
                {updatingOrderId === ord.id ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '0.72rem' }}></i>
                    <span>Opslaan…</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badgeColor }}></span>
                    <span>{currentLabel}</span>
                    <i
                      className="fa-solid fa-chevron-down"
                      style={{
                        fontSize: '0.62rem',
                        transition: 'transform 0.15s ease',
                        transform: openStatusMenuId === ord.id ? 'rotate(180deg)' : 'none',
                        marginLeft: 2,
                      }}
                    ></i>
                  </>
                )}
              </button>

              {openStatusMenuId === ord.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    right: 0,
                    width: 170,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    boxShadow: '0 10px 26px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.04)',
                    border: '1px solid #CBD5E1',
                    zIndex: 60,
                    padding: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  {statusOptions.map((opt) => {
                    const isSelected = curStatus === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setOpenStatusMenuId(null)
                          if (!isSelected) handleStatusChange(ord.id, opt.value)
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: isSelected ? opt.activeBg : 'transparent',
                          color: isSelected ? opt.activeColor : '#334155',
                          fontWeight: isSelected ? 800 : 600,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC'
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: opt.dotColor }}></span>
                          <span>{opt.label}</span>
                        </div>
                        {isSelected && <i className="fa-solid fa-check" style={{ fontSize: '0.75rem', color: opt.activeColor }}></i>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Bestelde Artikelen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {itemsList.map((item: OrderItem, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
                <span style={{ color: '#162544', fontWeight: 600 }}>
                  <strong style={{ color: '#162544' }}>{item.quantity}×</strong> {item.name} {item.size && item.size !== '-' && item.size !== 'Standaard' ? <span style={{ color: '#64748B', fontSize: '0.82rem' }}>({item.size})</span> : ''}
                </span>
                <span style={{ fontWeight: 700, color: '#334155' }}>
                  €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>

          {/* Eindtotaal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #E2E8F0', paddingTop: 8 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Eindtotaal
            </span>
            <strong style={{ fontSize: '1.15rem', fontWeight: 900, color: '#650B19', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
              €{(ord.total || 0).toFixed(2).replace('.', ',')}
            </strong>
          </div>

        </div>

      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '24px 20px 48px' }} className="portaal-page-container">
      
      {/* Toast Flash Message */}
      {flashMessage && (
        <div style={{
          padding: '14px 22px',
          borderRadius: 14,
          marginBottom: 24,
          fontSize: '0.92rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backgroundColor: flashMessage.type === 'success' ? '#EBF0F9' : '#FDF0F2',
          color: flashMessage.type === 'success' ? '#162544' : '#B23A4D',
          border: `1.5px solid ${flashMessage.type === 'success' ? '#CBD5E1' : '#E0C0C4'}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <i className={`fa-solid ${flashMessage.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          <span>{flashMessage.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: BESTELLINGEN                                     */}
      {/* ======================================================== */}
      {activeTab === 'bestellingen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%' }}>
          {loadingOrders ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #CBD5E1', padding: '40px 32px', textAlign: 'center', color: '#64748B', fontWeight: 600, boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Bestellingen laden…
            </div>
          ) : orders.length === 0 ? (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #CBD5E1', padding: '36px 32px', textAlign: 'center', color: '#64748B', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)' }}>
              <strong style={{ display: 'block', fontSize: '1.05rem', color: '#162544', marginBottom: 6 }}>Er zijn nog geen bestellingen geplaatst.</strong>
              <span style={{ fontSize: '0.88rem' }}>Wanneer een koper een bestelling plaatst via de webshop, verschijnt deze hier direct in de lijst.</span>
            </div>
          ) : (
            <>
              {/* 1. RIJ: ACTIEVE BESTELLINGEN */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #CBD5E1', padding: '28px 32px', color: '#162544', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1.5px solid #F1F5F9', paddingBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF0F9', color: '#243B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                    <i className="fa-solid fa-clock"></i>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                    Actieve Bestellingen
                  </h2>
                </div>

                {activeOrders.length === 0 ? (
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 14, padding: '24px 28px', color: '#64748B', fontSize: '0.9rem', textAlign: 'center' }}>
                    <i className="fa-solid fa-check" style={{ color: '#166534', marginRight: 8 }}></i>
                    Geen actieve bestellingen op dit moment. Alles is netjes afgehandeld!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {activeOrders.map((ord) => renderOrderCard(ord, false))}
                  </div>
                )}
              </div>

              {/* 2. RIJ: BEHANDELDE BESTELLINGEN */}
              <div style={{ backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #CBD5E1', padding: '28px 32px', color: '#162544', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1.5px solid #F1F5F9', paddingBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF5F1', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                    Behandelde Bestellingen
                  </h2>
                </div>

                {completedOrders.length === 0 ? (
                  <div style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 14, padding: '24px 28px', color: '#64748B', fontSize: '0.9rem', textAlign: 'center' }}>
                    Nog geen afgehaalde bestellingen in het archief.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {completedOrders.map((ord) => renderOrderCard(ord, true))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Card Container voor Artikelen & Instellingen */}
      {activeTab !== 'bestellingen' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #CBD5E1', padding: '28px 32px', color: '#162544', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)', width: '100%' }}>
          
          {/* Header Title Bar */}
          <div style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: 16, marginBottom: 24 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.65rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className={`fa-solid ${activeTab === 'artikelen' ? 'fa-shirt' : 'fa-gear'}`} style={{ color: '#243B6B' }}></i>
              <span>
                {activeTab === 'artikelen' ? 'Artikelen & Assortiment' : 'Webshop Instellingen'}
              </span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748B' }}>
              {activeTab === 'artikelen'
                ? 'Beheer artikelen, prijzen, maten en foto\'s van de webshop en uniformen.'
                : 'Beheer de e-mailadressen voor bestellingsmeldingen en financiële opvolging.'}
            </p>
          </div>
        {/* TAB 2: ARTIKELEN & ASSORTIMENT                           */}
        {/* ======================================================== */}
        {activeTab === 'artikelen' && (
          <div>
            {loadingShopProducts ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontWeight: 600 }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i> Producten laden…
              </div>
            ) : (
              <div className="portaal-shop-beheer-grid">
                
                {/* Left sidebar product list */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 14, border: '1px solid #CBD5E1', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleProductAdd}
                    disabled={savingProduct}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      backgroundColor: '#243B6B',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: 8,
                      boxShadow: '0 2px 6px rgba(36,59,107,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Nieuw Artikel Toevoegen</span>
                  </button>

                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', padding: '4px 8px' }}>
                    Kledij
                  </span>
                  {shopProducts.filter(p => p.category !== 'kentekens').map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      style={{
                        textAlign: 'left',
                        padding: '9px 12px',
                        borderRadius: 8,
                        fontSize: '0.86rem',
                        fontWeight: selectedProductId === p.id ? 800 : 600,
                        backgroundColor: selectedProductId === p.id ? '#243B6B' : '#fff',
                        color: selectedProductId === p.id ? '#fff' : '#162544',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                      }}
                    >
                      {p.name}
                    </button>
                  ))}

                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', padding: '12px 8px 4px' }}>
                    Kentekens
                  </span>
                  {shopProducts.filter(p => p.category === 'kentekens').map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProductId(p.id)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontSize: '0.82rem',
                        fontWeight: selectedProductId === p.id ? 800 : 600,
                        backgroundColor: selectedProductId === p.id ? '#243B6B' : '#fff',
                        color: selectedProductId === p.id ? '#fff' : '#162544',
                        border: '1px solid #CBD5E1',
                        cursor: 'pointer',
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                {/* Right side product editor */}
                {(() => {
                  const product = shopProducts.find(p => p.id === selectedProductId)
                  if (!product) return <div style={{ color: '#64748B', padding: 20 }}>Selecteer een artikel uit de lijst links.</div>

                  const isKenteken = product.category === 'kentekens'

                  return (
                    <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1px solid #CBD5E1', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                          {product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleProductDelete(product.id)}
                          style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#FDF0F2', color: '#B91C1C', border: '1px solid #F8C8D4', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <i className="fa-solid fa-trash"></i>
                          <span>Verwijderen</span>
                        </button>
                      </div>

                      {/* Photo Preview & Upload */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 8 }}>
                          Artikel Foto {isKenteken ? '(Vierkant 1:1)' : '(Rechthoekig 3:2)'}
                        </label>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{
                            width: isKenteken ? 96 : 144,
                            height: 96,
                            borderRadius: isKenteken ? 10 : 12,
                            backgroundColor: '#E2E8F0',
                            border: '1px solid #CBD5E1',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            flexShrink: 0,
                            transition: 'width 0.2s ease, border-radius 0.2s ease',
                          }}>
                            {product.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#64748B' }}>
                                <i className={`fa-solid ${isKenteken ? 'fa-certificate' : 'fa-shirt'}`} style={{ fontSize: isKenteken ? '1.5rem' : '1.8rem', opacity: 0.4 }} />
                                <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Geen foto</span>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              backgroundColor: '#243B6B',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '0.84rem',
                              cursor: uploadingProductPhoto ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}>
                              <i className="fa-solid fa-upload"></i>
                              <span>{uploadingProductPhoto ? 'Foto verwerken…' : 'Nieuwe foto uploaden'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingProductPhoto}
                                onChange={e => handleProductPhotoUpload(e, product)}
                                style={{ display: 'none' }}
                              />
                            </label>
                            
                            {product.image && (
                              <button
                                type="button"
                                onClick={() => handleRemoveProductPhoto(product)}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: 8,
                                  backgroundColor: '#FDF0F2',
                                  color: '#B91C1C',
                                  border: '1px solid #F8C8D4',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                                <span>Foto verwijderen</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Name, Category & Price */}
                      <div className="portaal-product-form-grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                            Naam Artikel
                          </label>
                          <input
                            type="text"
                            value={product.name}
                            onChange={e => setShopProducts(prev => prev.map(p => p.id === product.id ? { ...p, name: e.target.value } : p))}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', fontWeight: 700, color: '#162544' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                            Sectie / Categorie
                          </label>
                          <select
                            value={product.category || 'kledij'}
                            onChange={e => setShopProducts(prev => prev.map(p => p.id === product.id ? { ...p, category: e.target.value } : p))}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, color: '#162544' }}
                          >
                            <option value="kledij">Kledij</option>
                            <option value="kentekens">Kentekens</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                            Prijs (€)
                          </label>
                          <input
                            type="number"
                            step="1"
                            value={product.price}
                            onChange={e => setShopProducts(prev => prev.map(p => p.id === product.id ? { ...p, price: parseFloat(e.target.value) || 0 } : p))}
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', fontWeight: 700, color: '#162544' }}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                          Omschrijving
                        </label>
                        <textarea
                          rows={3}
                          value={product.description || ''}
                          onChange={e => setShopProducts(prev => prev.map(p => p.id === product.id ? { ...p, description: e.target.value } : p))}
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.88rem', fontFamily: 'inherit', color: '#162544' }}
                        />
                      </div>

                      {/* Sizes */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                          Beschikbare Maten (Gescheiden door komma)
                        </label>
                        <input
                          type="text"
                          value={typeof product.sizes === 'string' ? product.sizes : (Array.isArray(product.sizes) ? product.sizes.join(', ') : '')}
                          onChange={e => {
                            const val = e.target.value
                            setShopProducts(prev => prev.map(p => p.id === product.id ? { ...p, sizes: val } : p))
                          }}
                          placeholder="Bijv. S, M, L, XL of 6j, 8j, 10j"
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.88rem', fontWeight: 700, color: '#162544' }}
                        />
                      </div>

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => handleProductSave(product)}
                        disabled={savingProduct}
                        style={{ padding: '12px 20px', borderRadius: 10, backgroundColor: '#243B6B', color: '#fff', fontWeight: 900, fontSize: '0.92rem', border: 'none', cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <i className="fa-solid fa-floppy-disk"></i>
                        <span>{savingProduct ? 'Opslaan…' : `Artikel "${product.name}" Opslaan`}</span>
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: WEBSHOP INSTELLINGEN                              */}
        {/* ======================================================== */}
        {activeTab === 'instellingen' && (
          <div style={{ maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* 1. Bestellingsmeldingen e-mail */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#EBF0F9', color: '#243B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <strong style={{ fontSize: '1.05rem', color: '#162544' }}>
                  E-mailadres voor Bestellingsmeldingen
                </strong>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5 }}>
                Dit e-mailadres (webshop / uniformverantwoordelijke) ontvangt automatisch een bericht bij elke nieuwe geplaatste bestelling.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 6 }}>
                  E-mailadres Webshopverantwoordelijke
                </label>
                <input
                  type="email"
                  value={webshopEmail}
                  onChange={e => setWebshopEmail(e.target.value)}
                  placeholder="bestellingen@kriko-m.be"
                  style={{ width: '100%', maxWidth: 500, padding: '10px 14px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.92rem', fontWeight: 700, color: '#162544' }}
                />
              </div>
            </div>

            {/* 2. Financieel e-mailadres */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#EEF5F1', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>
                  <i className="fa-solid fa-file-invoice-dollar"></i>
                </div>
                <strong style={{ fontSize: '1.05rem', color: '#162544' }}>
                  E-mailadres Financieel Verantwoordelijke
                </strong>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: '#64748B', lineHeight: 1.5 }}>
                Ontvangt automatisch een e-mailbericht wanneer een bestelling via overschrijving geplaatst wordt, zodat de bankoverschrijving gecontroleerd en geverifieerd kan worden.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 6 }}>
                  E-mailadres Financieel Verantwoordelijke
                </label>
                <input
                  type="email"
                  value={webshopFinancialEmail}
                  onChange={e => setWebshopFinancialEmail(e.target.value)}
                  placeholder="financieel@kriko-m.be"
                  style={{ width: '100%', maxWidth: 500, padding: '10px 14px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.92rem', fontWeight: 700, color: '#162544' }}
                />
              </div>
            </div>

            {/* Save Button */}
            <div>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                style={{
                  padding: '13px 26px',
                  borderRadius: 10,
                  backgroundColor: '#243B6B',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(36, 59, 107, 0.25)',
                  transition: 'all 0.2s ease',
                }}
                className="action-card-hover"
              >
                <i className="fa-solid fa-floppy-disk"></i>
                <span>{savingSettings ? 'Opslaan…' : 'Instellingen Opslaan'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          danger={confirmDialog.danger}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
