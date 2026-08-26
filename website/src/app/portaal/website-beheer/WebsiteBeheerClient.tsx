'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ExcelJS from 'exceljs'
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
  customer_name: string
  email: string
  items: OrderItem[]
  total: number
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

interface AccountInfo {
  id: string | null
  role: string
  email: string
  naam: string
  password?: string
}


interface Props {
  initialSettings: Settings
  role?: string
}



export default function WebsiteBeheerClient({ initialSettings, role }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const currentShopTab: 'bestellingen' | 'beheer' = role === 'webshop'
    ? (tabParam === 'artikelen' ? 'beheer' : 'bestellingen')
    : 'bestellingen'

  const isInstellingenTab = tabParam === 'instellingen'
  const [topbarContainer, setTopbarContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setTopbarContainer(document.getElementById('portaal-topbar-actions'))
  }, [])

  const [saving, setSaving] = useState(false)
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [modalFlash, setModalFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Modal display state
  const [showShopModal, setShowShopModal] = useState(false)
  const [activeShopTab, setActiveShopTab] = useState<'bestellingen' | 'beheer'>('bestellingen')

  // Orders State
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  // Shop Products State
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([])
  const [loadingShopProducts, setLoadingShopProducts] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('item_tshirt')
  const [uploadingProductPhoto, setUploadingProductPhoto] = useState(false)
  const [savingProduct, setSavingProduct] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ title?: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void } | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const res = await fetch('/api/admin/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Fout bij ophalen bestellingen:', err)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  const fetchShopProducts = useCallback(async () => {
    setLoadingShopProducts(true)
    try {
      const res = await fetch('/api/admin/shop-products')
      if (res.ok) {
        const data = await res.json()
        setShopProducts(data)
        if (data.length > 0) setSelectedProductId(data[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingShopProducts(false)
    }
  }, [])

  useEffect(() => {
    if (role === 'webshop') {
      fetchOrders()
      fetchShopProducts()
    }
  }, [role, fetchOrders, fetchShopProducts])

  // Titels & Subtitels per rol op de startpagina
  const [homeTitleLeiding, setHomeTitleLeiding] = useState<string>(
    initialSettings?.home_title_leiding || (initialSettings?.home_title && initialSettings.home_title !== 'Leidingportaal' ? initialSettings.home_title : 'Welkom leiding')
  )
  const [homeSubtitleLeiding, setHomeSubtitleLeiding] = useState<string>(
    initialSettings?.home_subtitle_leiding || initialSettings?.home_subtitle || ''
  )
  const [homeTitleGroepsleiding, setHomeTitleGroepsleiding] = useState<string>(
    initialSettings?.home_title_groepsleiding || (initialSettings?.home_title && initialSettings.home_title !== 'Leidingportaal' ? initialSettings.home_title : 'Welkom groepsleiding')
  )
  const [homeSubtitleGroepsleiding, setHomeSubtitleGroepsleiding] = useState<string>(
    initialSettings?.home_subtitle_groepsleiding || initialSettings?.home_subtitle || ''
  )
  const [homeLeidingFoto, setHomeLeidingFoto] = useState<string>(
    initialSettings?.home_leiding_foto || '/images/leiding_25-26.jpg'
  )
  const [uploadingHomeFoto, setUploadingHomeFoto] = useState(false)
  const [portalLoginFoto, setPortalLoginFoto] = useState<string>(
    initialSettings?.portal_login_foto || '/images/hero-nieuw.webp'
  )
  const [uploadingLoginFoto, setUploadingLoginFoto] = useState(false)
  const [webshopEmail, setWebshopEmail] = useState<string>(
    initialSettings?.webshop_email || 'groepsleiding@kriko-m.be'
  )

  const [activeTitleRoleTab, setActiveTitleRoleTab] = useState<'leiding' | 'groepsleiding'>('leiding')

  async function handleHomeFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingHomeFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'home-leiding-foto')
      if (homeLeidingFoto && homeLeidingFoto.startsWith('http')) {
        formData.append('oldUrl', homeLeidingFoto)
      }

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Uploaden foto mislukt')
      }
      const data = await res.json()
      if (data.url) {
        setHomeLeidingFoto(data.url)
        showModalNotification('success', 'Nieuwe leidingsfoto geüpload! Vergeet niet hieronder op Opslaan te klikken.')
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij uploaden foto'
      showModalNotification('error', errorText)
    } finally {
      setUploadingHomeFoto(false)
      e.target.value = ''
    }
  }

  async function handleLoginFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLoginFoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'portal-login-foto')
      if (portalLoginFoto && portalLoginFoto.startsWith('http')) {
        formData.append('oldUrl', portalLoginFoto)
      }

      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Uploaden foto mislukt')
      }
      const data = await res.json()
      if (data.url) {
        setPortalLoginFoto(data.url)
        showModalNotification('success', 'Nieuwe login-achtergrondfoto geüpload! Vergeet niet hieronder op Opslaan te klikken.')
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij uploaden foto'
      showModalNotification('error', errorText)
    } finally {
      setUploadingLoginFoto(false)
      e.target.value = ''
    }
  }

  // Accountbeheer State inside Portaal Instellingen
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [editingAccountRole, setEditingAccountRole] = useState<'leiding' | 'groepsleiding' | 'webshop'>('leiding')
  const [editAccountName, setEditAccountName] = useState('')
  const [editAccountPassword, setEditAccountPassword] = useState('')
  const [showAccountPassword, setShowAccountPassword] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const [savingAccount, setSavingAccount] = useState(false)
  const [accountSuccess, setAccountSuccess] = useState('')
  const [accountError, setAccountError] = useState('')

  const fetchAccounts = useCallback(async () => {
    setLoadingAccounts(true)
    setAccountError('')
    setAccountSuccess('')
    try {
      const res = await fetch('/api/admin/accounts')
      const data = await res.json()
      if (data.accounts) {
        setAccounts(data.accounts)
        const target = data.accounts.find((a: AccountInfo) => a.role === editingAccountRole)
        if (target) {
          setEditAccountName(target.naam)
          setEditAccountPassword(target.password || '')
        }
      }
    } catch {
      setAccountError('Kon accountgegevens niet laden.')
    } finally {
      setLoadingAccounts(false)
    }
  }, [editingAccountRole])

  useEffect(() => {
    if (isInstellingenTab && role !== 'webshop') {
      fetchAccounts()
    }
  }, [isInstellingenTab, role, fetchAccounts])

  function handleSelectAccountRole(roleType: 'leiding' | 'groepsleiding' | 'webshop') {
    setEditingAccountRole(roleType)
    setShowAccountPassword(false)
    setAccountError('')
    setAccountSuccess('')
    const target = accounts.find(a => a.role === roleType)
    if (target) {
      setEditAccountName(target.naam)
      setEditAccountPassword(target.password || '')
    } else {
      setEditAccountName('')
      setEditAccountPassword('')
    }
  }

  async function handleSaveAccountInModal(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setSavingAccount(true)
    setAccountError('')
    setAccountSuccess('')

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: editingAccountRole,
          newName: editAccountName,
          newPassword: editAccountPassword || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        setAccountError(data.error || 'Fout bij opslaan van account.')
        return false
      } else {
        const roleLabel = editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop & uniformen'
        setAccountSuccess(`Account voor ${roleLabel} succesvol bijgewerkt!`)
        await fetchAccounts()
        router.refresh()
        return true
      }
    } catch {
      setAccountError('Netwerkfout bij opslaan.')
      return false
    } finally {
      setSavingAccount(false)
    }
  }

  function showNotification(type: 'success' | 'error', text: string) {
    setFlashMessage({ type, text })
    setTimeout(() => setFlashMessage(null), 4000)
  }

  function showModalNotification(type: 'success' | 'error', text: string) {
    setModalFlash({ type, text })
    setTimeout(() => setModalFlash(null), 4000)
  }


  async function exportOrdersToExcel() {
    if (!orders || orders.length === 0) return

    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Scouts Kriko-M'
      workbook.lastModifiedBy = 'Scouts Kriko-M Portaal'
      workbook.created = new Date()

      const worksheet = workbook.addWorksheet('Webshop Bestellingen', {
        pageSetup: { paperSize: 9, orientation: 'landscape' },
        views: [{ showGridLines: true }]
      })

      // Title Banner
      const titleRow = worksheet.addRow(['WEBSHOP BESTELLINGEN — SCOUTS KRIKO-M'])
      titleRow.height = 36
      titleRow.getCell(1).font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF800020' } }
      titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }

      const metaRow = worksheet.addRow([`Exportdatum: ${new Date().toLocaleString('nl-BE')}  |  Totaal aantal bestellingen: ${orders.length}`])
      metaRow.height = 20
      metaRow.getCell(1).font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF555555' } }
      metaRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' }

      worksheet.addRow([]) // Spacer

      // Table Headers
      const headerRowValues = ['Bestelnummer', 'Datum & Tijd', 'Koper', 'E-mailadres', 'Bestelde Artikelen', 'Totaal (€)']
      const headerRow = worksheet.addRow(headerRowValues)
      headerRow.height = 34

      // Bordeaux styling header
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF800020' }, // Deep Bordeaux top
        }
        cell.font = {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: 'FFFFFFFF' },
        }
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF5C0017' } },
          bottom: { style: 'medium', color: { argb: 'FF5C0017' } },
          left: { style: 'thin', color: { argb: 'FF9E2A4B' } },
          right: { style: 'thin', color: { argb: 'FF9E2A4B' } },
        }
      })

      // Column widths
      worksheet.getColumn(1).width = 18 // Bestelnummer
      worksheet.getColumn(2).width = 22 // Datum
      worksheet.getColumn(3).width = 26 // Koper
      worksheet.getColumn(4).width = 34 // Email
      worksheet.getColumn(5).width = 55 // Bestelde Artikelen
      worksheet.getColumn(6).width = 18 // Totaal

      let grandTotal = 0

      // Data Rows
      orders.forEach((ord, index) => {
        const formattedDate = ord.created_at
          ? new Date(ord.created_at).toLocaleString('nl-BE', { dateStyle: 'medium', timeStyle: 'short' })
          : ''

        let itemsText = ''
        let itemCount = 1
        if (Array.isArray(ord.items) && ord.items.length > 0) {
          itemCount = ord.items.length
          itemsText = ord.items
            .map((i: OrderItem) => `• ${i.quantity}x ${i.name}${i.size ? ` (${i.size})` : ''}  —  €${(i.price * i.quantity).toFixed(2).replace('.', ',')}`)
            .join('\n')
        }

        const totalAmount = Number(ord.total) || 0
        grandTotal += totalAmount

        const row = worksheet.addRow([
          ord.order_ref || `KM-${ord.id.slice(0, 6)}`,
          formattedDate,
          ord.customer_name || '',
          ord.email || '',
          itemsText,
          totalAmount,
        ])

        row.height = Math.max(30, itemCount * 22)

        const isEven = index % 2 === 1
        const bgArgb = isEven ? 'FFF9F5F6' : 'FFFFFFFF'

        row.eachCell((cell, colNumber) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgArgb },
          }
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF1A1A1A' } }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }

          if (colNumber === 1 || colNumber === 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
            if (colNumber === 1) cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1A3D2A' } }
          } else if (colNumber === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
          } else if (colNumber === 6) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' }
            cell.numFmt = '"€ "#,##0.00'
            cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF800020' } }
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' }
          }
        })
      })

      // Summary Row
      worksheet.addRow([])
      const summaryRow = worksheet.addRow(['', '', '', '', 'TOTAAL ONTVANGEN:', grandTotal])
      summaryRow.height = 32
      summaryRow.getCell(5).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF800020' } }
      summaryRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'right' }
      summaryRow.getCell(6).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF800020' } }
      summaryRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' }
      summaryRow.getCell(6).numFmt = '"€ "#,##0.00'
      summaryRow.getCell(6).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3E8EA' },
      }
      summaryRow.getCell(6).border = {
        top: { style: 'double', color: { argb: 'FF800020' } },
        bottom: { style: 'double', color: { argb: 'FF800020' } },
      }

      // Buffer & Download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Webshop_Bestellingen_Kriko-M_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Fout bij exporteren naar Excel:', err)
      showModalNotification('error', 'Kon het Excel-bestand niet genereren.')
    }
  }

  async function handleSavePortalSettings() {
    setSaving(true)
    setModalFlash(null)
    try {
      const payload = {
        home_title_leiding: homeTitleLeiding,
        home_subtitle_leiding: homeSubtitleLeiding,
        home_title_groepsleiding: homeTitleGroepsleiding,
        home_subtitle_groepsleiding: homeSubtitleGroepsleiding,
        home_leiding_foto: homeLeidingFoto,
        portal_login_foto: portalLoginFoto,
        webshop_email: webshopEmail,
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Opslaan mislukt')
      }

      // If groepsleiding also edited account details, save account too
      if (editAccountName.trim()) {
        await handleSaveAccountInModal()
      }

      const successText = 'Instellingen succesvol opgeslagen!'
      showNotification('success', successText)
      showModalNotification('success', successText)
      router.refresh()
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij opslaan'
      showModalNotification('error', errorText)
      showNotification('error', errorText)
    } finally {
      setSaving(false)
    }
  }

  async function _handleOpenShopModal() {
    setModalFlash(null)
    setShowShopModal(true)
    setActiveShopTab('bestellingen')
    fetchOrders()
    fetchShopProducts()
  }


  function handleOrderDelete(orderId: string, orderRef: string) {
    setConfirmDialog({
      title: 'Bestelling verwijderen',
      message: `Weet je zeker dat je bestelling ${orderRef} wilt verwijderen?`,
      confirmLabel: 'Verwijderen',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null)
        setUpdatingOrderId(orderId)
        try {
          const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
          if (!res.ok) throw new Error('Verwijderen mislukt')
          setOrders(prev => prev.filter(o => o.id !== orderId))
          showModalNotification('success', `Bestelling ${orderRef} verwijderd!`)
        } catch (err: unknown) {
          showModalNotification('error', err instanceof Error ? err.message : 'Fout bij verwijderen bestelling')
        } finally {
          setUpdatingOrderId(null)
        }
      },
    })
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
      showModalNotification('success', `Artikel "${productToSave.name}" opgeslagen!`)
      router.refresh()
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij opslaan'
      showModalNotification('error', errorText)
    } finally {
      setSavingProduct(false)
    }
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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Uploaden foto mislukt')
      }
      const data = await res.json()
      if (data.url) {
        await handleProductSave({ ...product, image: data.url })
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij uploaden foto'
      showModalNotification('error', errorText)
    } finally {
      setUploadingProductPhoto(false)
      e.target.value = ''
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

  async function handleProductAdd() {
    setSavingProduct(true)
    try {
      const res = await fetch('/api/admin/shop-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Nieuw Artikel',
          price: 1.00,
          category: 'kledij',
          description: '',
          sizes: ['Standaard'],
          image: '',
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Toevoegen mislukt')
      }
      const newProduct = await res.json()
      setShopProducts(prev => [...prev, newProduct])
      setSelectedProductId(newProduct.id)
      showModalNotification('success', `Nieuw artikel "${newProduct.name}" toegevoegd!`)
      router.refresh()
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Fout bij toevoegen'
      showModalNotification('error', errorText)
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
          const res = await fetch(`/api/admin/shop-products?id=${id}`, {
            method: 'DELETE',
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Verwijderen mislukt')
          }
          setShopProducts(prev => {
            const next = prev.filter(p => p.id !== id)
            if (next.length > 0) setSelectedProductId(next[0].id)
            return next
          })
          showModalNotification('success', 'Artikel succesvol verwijderd uit de webshop!')
          router.refresh()
        } catch (err: unknown) {
          const errorText = err instanceof Error ? err.message : 'Fout bij verwijderen'
          showModalNotification('error', errorText)
        } finally {
          setSavingProduct(false)
        }
      },
    })
  }

  function renderShopTabBody(activeTabToUse: 'bestellingen' | 'beheer') {
    return (
      <>
        {/* TAB 1: ALLE BESTELLINGEN */}
        {activeTabToUse === 'bestellingen' && (
          <div>
            {loadingOrders ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Bestellingen laden…</div>
            ) : orders.length === 0 ? (
              <div style={{ backgroundColor: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 14, padding: 36, textAlign: 'center', color: '#64748B' }}>
                <strong style={{ display: 'block', fontSize: '1rem', color: '#162544', marginBottom: 4 }}>Er zijn nog geen bestellingen geplaatst.</strong>
                <span style={{ fontSize: '0.86rem' }}>Wanneer een koper een bestelling plaatst via de webshop, verschijnt deze hier direct in de lijst.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Top Action Bar with Export to Excel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '12px 18px', borderRadius: 12, border: '1.5px solid #E2E8F0' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#162544' }}>
                    Totaal {orders.length} bestelling{orders.length === 1 ? '' : 'en'}
                  </span>
                  <button
                    type="button"
                    onClick={exportOrdersToExcel}
                    style={{
                      padding: '11px 22px',
                      borderRadius: 10,
                      backgroundColor: '#243B6B',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 900,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: '0 4px 14px rgba(36, 59, 107, 0.28)',
                      transition: 'all 0.2s ease',
                    }}
                    className="action-card-hover"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>Exporteer naar Excel (.xlsx)</span>
                  </button>
                </div>

                {orders.map((ord) => (
                  <div key={ord.id} style={{ backgroundColor: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    
                    {/* Order Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 14 }}>
                      <div>
                        <strong style={{ fontSize: '1.15rem', color: '#162544', marginRight: 12 }}>
                          Bestelling {ord.order_ref || `KM-${ord.id.slice(0, 6)}`}
                        </strong>
                        <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600 }}>
                          {ord.created_at ? new Date(ord.created_at).toLocaleString('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info Box with Clickable Copy Button */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>Koper</div>
                        <div style={{ fontWeight: 800, color: '#162544', fontSize: '0.95rem' }}>{ord.customer_name}</div>
                        <div style={{ marginTop: 6 }}>
                          <CopyButton text={ord.email} variant="inline">
                            {ord.email}
                          </CopyButton>
                        </div>
                      </div>
                    </div>

                    {/* Ordered Items Table */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 6 }}>Bestelde artikelen</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <tbody>
                          {Array.isArray(ord.items) && ord.items.map((item: OrderItem, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '6px 0', color: '#162544', fontWeight: 700 }}>
                                {item.quantity}× {item.name} <span style={{ color: '#64748B', fontWeight: 600 }}>(Maat: {item.size})</span>
                              </td>
                              <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 800, color: '#162544' }}>
                                €{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total & Footer Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1.5px solid #E2E8F0' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: '#162544' }}>
                        Totaalbedrag: <span style={{ color: '#800020' }}>€{(ord.total || 0).toFixed(2).replace('.', ',')}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOrderDelete(ord.id, ord.order_ref || `KM-${ord.id.slice(0, 6)}`)}
                        disabled={updatingOrderId === ord.id}
                        style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#FDF0F2', color: '#B23A4D', border: '1.5px solid #E0C0C4', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {updatingOrderId === ord.id ? 'Verwijderen…' : 'Bestelling Verwijderen'}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ARTIKELEN & INSTELLINGEN */}
        {activeTabToUse === 'beheer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Webshop Notificatie E-mailadres Instelling */}
            <div style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 14, padding: '14px 18px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                E-mailadres voor Bestelnotificaties
              </label>
              <p style={{ margin: '0 0 10px', fontSize: '0.82rem', color: '#64748B' }}>
                Aan wie moeten de meldingen van nieuwe webshopbestellingen gestuurd worden?
              </p>
              <div className="portaal-email-notif-form">
                <input
                  type="email"
                  value={webshopEmail}
                  onChange={e => setWebshopEmail(e.target.value)}
                  placeholder="bestellingen@kriko-m.be"
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', fontWeight: 700, color: '#162544' }}
                />
                <button
                  type="button"
                  onClick={handleSavePortalSettings}
                  disabled={saving}
                  style={{ padding: '8px 18px', borderRadius: 8, backgroundColor: '#243B6B', color: '#fff', fontWeight: 800, fontSize: '0.86rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {saving ? 'Opslaan…' : 'E-mail Opslaan'}
                </button>
              </div>
            </div>

            {loadingShopProducts ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Producten laden…</div>
            ) : (
              <div className="portaal-shop-beheer-grid">
                
                {/* Left sidebar product list */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  
                  <button
                    type="button"
                    onClick={handleProductAdd}
                    disabled={savingProduct}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      backgroundColor: '#243B6B',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      marginBottom: 8,
                      boxShadow: '0 2px 6px rgba(36,59,107,0.2)',
                    }}
                  >
                    + Nieuw Artikel Toevoegen
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
                  if (!product) return <div style={{ color: '#64748B' }}>Selecteer een artikel uit de lijst.</div>

                  return (
                    <div style={{ backgroundColor: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #E2E8F0', paddingBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#162544' }}>
                          {product.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleProductDelete(product.id)}
                          style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#FDF0F2', color: '#B23A4D', border: '1.5px solid #E0C0C4', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Verwijderen
                        </button>
                      </div>

                      {/* Foto Preview & Upload */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 8 }}>
                          Artikel Foto
                        </label>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <div style={{
                            width: 90,
                            height: 90,
                            borderRadius: 12,
                            backgroundColor: '#E2E8F0',
                            border: '1.5px solid #CBD5E1',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                          }}>
                            {product.image ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textAlign: 'center', padding: 4 }}>
                                Geen foto
                              </span>
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
                                  color: '#B23A4D',
                                  border: '1.5px solid #E0C0C4',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Foto verwijderen
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Naam, Categorie & Prijs */}
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

                      {/* Beschrijving */}
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

                      {/* Maten */}
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

                      {/* Opslaan Knop */}
                      <button
                        type="button"
                        onClick={() => handleProductSave(product)}
                        disabled={savingProduct}
                        style={{ padding: '12px 20px', borderRadius: 10, backgroundColor: '#243B6B', color: '#fff', fontWeight: 900, fontSize: '0.92rem', border: 'none', cursor: 'pointer', marginTop: 8 }}
                      >
                        {savingProduct ? 'Opslaan…' : `Artikel "${product.name}" Opslaan`}
                      </button>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        width: '100%',
        padding: '32px 20px 48px',
        minHeight: role === 'webshop' ? undefined : 'calc(100vh - 120px)',
        display: role === 'webshop' ? 'block' : 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}
      className="portaal-page-container"
    >

      {/* Notification Toast Outside Modal */}
      {flashMessage && (
        <div style={{
          width: '100%',
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
          boxSizing: 'border-box',
        }}>
          <span>{flashMessage.text}</span>
        </div>
      )}

      {role === 'webshop' ? (
        /* DEDICATED INLINE WEBSHOP VIEW */
        <div style={{ backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #CBD5E1', padding: '28px 32px', color: '#162544', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: 16, marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 900, color: '#162544' }}>
                {currentShopTab === 'bestellingen' ? '📦 Alle Bestellingen' : '👕 Artikelen & Assortiment'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                {currentShopTab === 'bestellingen'
                  ? 'Overzicht van alle ingekomen bestellingen in de webshop. Exporteer eenvoudig naar Excel.'
                  : 'Beheer artikelen, prijzen, maten en foto\'s van de webshop en uniformen.'}
              </p>
            </div>
            {currentShopTab === 'bestellingen' && (
              <button
                type="button"
                onClick={exportOrdersToExcel}
                style={{
                  padding: '11px 22px',
                  borderRadius: 10,
                  backgroundColor: '#243B6B',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(36, 59, 107, 0.28)',
                  transition: 'all 0.2s ease',
                }}
                className="action-card-hover"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Exporteer naar Excel (.xlsx)</span>
              </button>
            )}
          </div>

          {renderShopTabBody(currentShopTab)}
        </div>
      ) : isInstellingenTab ? (
        /* IN-PAGE INSTELLINGEN VIEW */
        <>
          {/* Topbar Back Button */}
          {topbarContainer && createPortal(
            <Link
              href="/portaal/website-beheer"
              className="portaal-topbar-back-link"
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                backgroundColor: '#F1F5F9',
                color: '#162544',
                fontWeight: 800,
                border: '1.5px solid #CBD5E1',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.75rem' }}></i>
              <span className="portaal-back-full-text">Terug naar Beheer</span>
              <span className="portaal-back-short-text" style={{ display: 'none' }}>Terug</span>
            </Link>,
            topbarContainer
          )}

          <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* In-Page Main Settings Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 24, border: '1px solid #CBD5E1', padding: '32px 36px', color: '#162544', boxShadow: '0 12px 32px rgba(0, 0, 0, 0.05)', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: 20, marginBottom: 28 }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '1.45rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                    ⚙️ Instellingen Leidingsportaal
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                    Pas de welkomsttitels, achtergrondfoto&apos;s en account-wachtwoorden (Leiding, Groepsleiding, Webshop) van het portaal aan.
                  </p>
                </div>
              </div>

              {/* Flash Message inside Page */}
              {modalFlash && (
                <div style={{
                  padding: '12px 18px',
                  borderRadius: 12,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 24,
                  backgroundColor: modalFlash.type === 'success' ? '#EBF0F9' : '#FDF0F2',
                  color: modalFlash.type === 'success' ? '#162544' : '#B23A4D',
                  border: `1.5px solid ${modalFlash.type === 'success' ? '#CBD5E1' : '#E0C0C4'}`,
                }}>
                  <span>{modalFlash.text}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* SECTIE 1: STARTPAGINA TITELS PER ROL */}
                <div style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                    Welkomsttitel Op Startpagina
                  </h4>
                  <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: '#64748B' }}>
                    Stel een unieke hoofdtitel en subtitel in voor gewone Leiding vs. Groepsleiding.
                  </p>

                  {/* Role Tabs */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button
                      type="button"
                      onClick={() => setActiveTitleRoleTab('leiding')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: activeTitleRoleTab === 'leiding' ? '2px solid #243B6B' : '1.5px solid #CBD5E1',
                        backgroundColor: activeTitleRoleTab === 'leiding' ? '#243B6B' : '#fff',
                        color: activeTitleRoleTab === 'leiding' ? '#fff' : '#162544',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Voor Leiding
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTitleRoleTab('groepsleiding')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: activeTitleRoleTab === 'groepsleiding' ? '2px solid #243B6B' : '1.5px solid #CBD5E1',
                        backgroundColor: activeTitleRoleTab === 'groepsleiding' ? '#243B6B' : '#fff',
                        color: activeTitleRoleTab === 'groepsleiding' ? '#fff' : '#162544',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Voor Groepsleiding
                    </button>
                  </div>

                  {activeTitleRoleTab === 'leiding' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                          Hoofdtitel voor Leiding
                        </label>
                        <input
                          type="text"
                          value={homeTitleLeiding}
                          onChange={e => setHomeTitleLeiding(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', background: '#fff', fontWeight: 700, color: '#162544' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                          Subtitel voor Leiding (Optioneel)
                        </label>
                        <textarea
                          value={homeSubtitleLeiding}
                          onChange={e => setHomeSubtitleLeiding(e.target.value)}
                          rows={2}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', background: '#fff', color: '#162544' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                          Hoofdtitel voor Groepsleiding
                        </label>
                        <input
                          type="text"
                          value={homeTitleGroepsleiding}
                          onChange={e => setHomeTitleGroepsleiding(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', background: '#fff', fontWeight: 700, color: '#162544' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                          Subtitel voor Groepsleiding (Optioneel)
                        </label>
                        <textarea
                          value={homeSubtitleGroepsleiding}
                          onChange={e => setHomeSubtitleGroepsleiding(e.target.value)}
                          rows={2}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', background: '#fff', color: '#162544' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTIE 2: ACHTERGRONDFOTO'S PORTAAL */}
                <div style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, border: '1.5px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                      📸 Achtergrondfoto&apos;s Portaal
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B' }}>
                      Beheer de achtergrondfoto&apos;s voor de loginpagina en de startpagina van het leidingportaal.
                    </p>
                  </div>

                  {/* FOTO 1: STARTPAGINA LEIDINGSFOTO */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#162544', marginBottom: 10 }}>
                      1. Startpagina Achtergrondfoto (Leidingsfoto)
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{
                        width: 220,
                        height: 120,
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '2px solid #CBD5E1',
                        backgroundImage: `url(${homeLeidingFoto || '/images/leiding_25-26.jpg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, rgba(22, 37, 68, 0.45) 0%, rgba(36, 59, 107, 0.55) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', padding: '4px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, backdropFilter: 'blur(2px)' }}>
                            Preview filter
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{
                          padding: '10px 16px',
                          borderRadius: 10,
                          backgroundColor: '#243B6B',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          cursor: uploadingHomeFoto ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.15s ease',
                        }}>
                          <i className="fa-solid fa-upload"></i>
                          <span>{uploadingHomeFoto ? 'Foto verwerken…' : 'Nieuwe Leidingsfoto Uploaden'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingHomeFoto}
                            onChange={handleHomeFotoUpload}
                            style={{ display: 'none' }}
                          />
                        </label>

                        {homeLeidingFoto && homeLeidingFoto !== '/images/leiding_25-26.jpg' && (
                          <button
                            type="button"
                            onClick={() => setHomeLeidingFoto('/images/leiding_25-26.jpg')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              backgroundColor: '#FDF0F2',
                              color: '#B23A4D',
                              border: '1.5px solid #E0C0C4',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: 'fit-content',
                            }}
                          >
                            Herstel naar standaardfoto (/images/leiding_25-26.jpg)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FOTO 2: LOGINPAGINA ACHTERGRONDFOTO */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#162544', marginBottom: 10 }}>
                      2. Loginpagina Achtergrondfoto (/portaal)
                    </div>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{
                        width: 220,
                        height: 120,
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        border: '2px solid #CBD5E1',
                        backgroundImage: `url(${portalLoginFoto || '/images/hero-nieuw.webp'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(135deg, rgba(22, 37, 68, 0.45) 0%, rgba(36, 59, 107, 0.55) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', padding: '4px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, backdropFilter: 'blur(2px)' }}>
                            Login preview
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{
                          padding: '10px 16px',
                          borderRadius: 10,
                          backgroundColor: '#243B6B',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '0.86rem',
                          cursor: uploadingLoginFoto ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.15s ease',
                        }}>
                          <i className="fa-solid fa-upload"></i>
                          <span>{uploadingLoginFoto ? 'Foto verwerken…' : 'Nieuwe Login-foto Uploaden'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingLoginFoto}
                            onChange={handleLoginFotoUpload}
                            style={{ display: 'none' }}
                          />
                        </label>

                        {portalLoginFoto && portalLoginFoto !== '/images/hero-nieuw.webp' && (
                          <button
                            type="button"
                            onClick={() => setPortalLoginFoto('/images/hero-nieuw.webp')}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              backgroundColor: '#FDF0F2',
                              color: '#B23A4D',
                              border: '1.5px solid #E0C0C4',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: 'fit-content',
                            }}
                          >
                            Herstel naar standaardfoto (/images/hero-nieuw.webp)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTIE 3: ACCOUNTBEHEER & WACHTWOORDEN */}
                <div id="accountbeheer" style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, border: '1.5px solid #E2E8F0' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                    👥 Accountbeheer — Rollen &amp; Wachtwoorden
                  </h4>
                  <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: '#64748B' }}>
                    Pas de weergavenaam of het wachtwoord aan voor de 3 hoofdaccounts van het portaal (Leiding, Groepsleiding, Webshop).
                  </p>

                  {loadingAccounts ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Accounts laden…</div>
                  ) : (
                    <form onSubmit={handleSaveAccountInModal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {accountError && (
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FDF0F2', color: '#B23A4D', border: '1px solid #E0C0C4', fontSize: '0.86rem', fontWeight: 700 }}>
                          {accountError}
                        </div>
                      )}
                      {accountSuccess && (
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#EBF0F9', color: '#162544', border: '1px solid #CBD5E1', fontSize: '0.86rem', fontWeight: 700 }}>
                          {accountSuccess}
                        </div>
                      )}

                      {/* Role Selector */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleSelectAccountRole('leiding')}
                          style={{
                            padding: '10px 6px',
                            borderRadius: 12,
                            border: editingAccountRole === 'leiding' ? '2px solid #243B6B' : '1.5px solid #E2E8F0',
                            background: editingAccountRole === 'leiding' ? '#EBF0F9' : '#FFFFFF',
                            color: editingAccountRole === 'leiding' ? '#243B6B' : '#555555',
                            fontWeight: editingAccountRole === 'leiding' ? 800 : 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                          }}
                        >
                          Leiding
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAccountRole('groepsleiding')}
                          style={{
                            padding: '10px 6px',
                            borderRadius: 12,
                            border: editingAccountRole === 'groepsleiding' ? '2px solid #243B6B' : '1.5px solid #E2E8F0',
                            background: editingAccountRole === 'groepsleiding' ? '#EBF0F9' : '#FFFFFF',
                            color: editingAccountRole === 'groepsleiding' ? '#243B6B' : '#555555',
                            fontWeight: editingAccountRole === 'groepsleiding' ? 800 : 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                          }}
                        >
                          Groepsleiding
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectAccountRole('webshop')}
                          style={{
                            padding: '10px 6px',
                            borderRadius: 12,
                            border: editingAccountRole === 'webshop' ? '2px solid #243B6B' : '1.5px solid #E2E8F0',
                            background: editingAccountRole === 'webshop' ? '#EBF0F9' : '#FFFFFF',
                            color: editingAccountRole === 'webshop' ? '#243B6B' : '#555555',
                            fontWeight: editingAccountRole === 'webshop' ? 800 : 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                          }}
                        >
                          Webshop
                        </button>
                      </div>

                      <div className="portaal-account-form-grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                            Weergavenaam {editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop'}
                          </label>
                          <input
                            type="text"
                            value={editAccountName}
                            onChange={(e) => setEditAccountName(e.target.value)}
                            required
                            placeholder="Bijv. Leiding Kriko-M"
                            disabled={savingAccount}
                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #CBD5E1', borderRadius: 8, fontSize: '0.9rem', background: '#fff', fontWeight: 700, color: '#162544', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#162544', textTransform: 'uppercase', marginBottom: 4 }}>
                            Wachtwoord {editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop'}
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              ref={passwordInputRef}
                              type={showAccountPassword ? 'text' : 'password'}
                              value={editAccountPassword}
                              onChange={(e) => setEditAccountPassword(e.target.value)}
                              placeholder={editAccountPassword ? '••••••••' : 'Wachtwoord instellen (min. 6 tekens)'}
                              disabled={savingAccount}
                              style={{
                                width: '100%',
                                padding: '10px 76px 10px 12px',
                                border: '1.5px solid #CBD5E1',
                                borderRadius: 8,
                                fontSize: '0.9rem',
                                background: '#fff',
                                fontWeight: 700,
                                color: '#162544',
                                boxSizing: 'border-box',
                              }}
                            />
                            <div style={{ position: 'absolute', right: 6, display: 'flex', alignItems: 'center', gap: 2 }}>
                              {/* Oogje knop */}
                              <button
                                type="button"
                                onClick={() => setShowAccountPassword(prev => !prev)}
                                title={showAccountPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                                aria-label={showAccountPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  border: 'none',
                                  background: showAccountPassword ? '#E2E8F0' : 'transparent',
                                  color: '#475569',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.92rem',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <i className={`fa-regular ${showAccountPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                              </button>

                              {/* Potloodje knop */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (passwordInputRef.current) {
                                    passwordInputRef.current.focus()
                                    passwordInputRef.current.select()
                                  }
                                }}
                                title="Wachtwoord aanpassen"
                                aria-label="Wachtwoord aanpassen"
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 6,
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#243B6B',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.92rem',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <i className="fa-solid fa-pencil" />
                              </button>
                            </div>
                          </div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>
                            Klik op het oogje om het wachtwoord te bekijken of op het potloodje om het aan te passen.
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                        <button
                          type="submit"
                          disabled={savingAccount || !editAccountName.trim()}
                          style={{
                            padding: '9px 18px',
                            borderRadius: 8,
                            backgroundColor: '#243B6B',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.86rem',
                            border: 'none',
                            cursor: savingAccount ? 'wait' : 'pointer',
                          }}
                        >
                          {savingAccount ? 'Opslaan…' : `Account ${editingAccountRole === 'leiding' ? 'Leiding' : editingAccountRole === 'groepsleiding' ? 'Groepsleiding' : 'Webshop'} Opslaan`}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, borderTop: '2px solid #E2E8F0', paddingTop: 20 }}>
                <button
                  type="button"
                  onClick={() => router.push('/portaal/website-beheer')}
                  style={{ padding: '10px 20px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Annuleren
                </button>

                <button
                  type="button"
                  onClick={handleSavePortalSettings}
                  disabled={saving}
                  style={{ padding: '10px 28px', backgroundColor: '#162544', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 900, cursor: saving ? 'wait' : 'pointer', fontSize: '0.9rem' }}
                >
                  {saving ? 'Opslaan…' : '💾 Wijzigingen Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* TWO SEPARATE SECTION CARDS GRID FOR GROEPSLEIDING / ADMIN */
        <div style={{ width: '100%', maxWidth: 860, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, justifyContent: 'center' }}>
          
          {/* CARD 1: PUBLIEKE WEBSITE */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            border: '1px solid #CCCCCC',
            padding: '32px 26px',
            color: '#162544',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            justifyContent: 'space-between',
            gap: 22,
            transition: 'all 0.2s ease-in-out',
          }} className="portaal-home-card">
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#162544',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 900, color: '#162544', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                Publieke Website
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555555', lineHeight: 1.5, fontWeight: 500 }}>
                Bewerk live teksten, kalenderactiviteiten en foto&apos;s rechtstreeks op de openbare website.
              </p>
            </div>

            <Link
              href="/?edit=true"
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#243B6B',
                color: '#FFFFFF',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: '0.96rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(36, 59, 107, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s ease',
              }}
              className="action-card-hover"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span>Website Live Bewerken</span>
            </Link>
          </div>

          {/* CARD 2: LEIDINGSPORTAAL */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 20,
            border: '1px solid #CCCCCC',
            padding: '32px 26px',
            color: '#162544',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            justifyContent: 'space-between',
            gap: 22,
            transition: 'all 0.2s ease-in-out',
          }} className="portaal-home-card">
            <div>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#162544',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 900, color: '#162544', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading, Nunito, sans-serif)' }}>
                Portaal Instellingen
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#555555', lineHeight: 1.5, fontWeight: 500 }}>
                Pas de welkomsttitels, achtergronden en account-wachtwoorden (Leiding, Groepsleiding, Webshop) van het portaal aan.
              </p>
            </div>

            <button
              onClick={() => { setModalFlash(null); router.push('/portaal/website-beheer?tab=instellingen'); fetchAccounts(); }}
              type="button"
              style={{
                width: '100%',
                padding: '14px 20px',
                backgroundColor: '#243B6B',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 900,
                fontSize: '0.96rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(36, 59, 107, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s ease',
              }}
              className="action-card-hover"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14"></line>
                <line x1="4" y1="10" x2="4" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12" y2="3"></line>
                <line x1="20" y1="21" x2="20" y2="16"></line>
                <line x1="20" y1="12" x2="20" y2="3"></line>
                <line x1="1" y1="14" x2="7" y2="14"></line>
                <line x1="9" y1="8" x2="15" y2="8"></line>
                <line x1="17" y1="16" x2="23" y2="16"></line>
              </svg>
              <span>Portaal Instellingen</span>
            </button>
          </div>

        </div>
      )}

      {/* MODAL FOR WEBSHOP (BESTELLINGEN + ARTIKELEN & INSTELLINGEN) */}
      {showShopModal && (
        <div className="portaal-modal-overlay">
          <div className="portaal-modal-card" style={{ width: '94%', maxWidth: 1020, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            
            {/* Header with Title & Close */}
            <div className="portaal-modal-header" style={{ padding: '18px 28px', borderBottom: '1px solid #E2E8F0' }}>
              <h3 className="portaal-modal-title" style={{ fontSize: '1.25rem' }}>Webshop Beheer</h3>
              <button className="portaal-modal-close" onClick={() => setShowShopModal(false)}>&times;</button>
            </div>

            {/* Subheader Tabs Bar */}
            <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', padding: '0 28px', backgroundColor: '#FAFCFA' }}>
              <button
                type="button"
                onClick={() => setActiveShopTab('bestellingen')}
                style={{
                  padding: '13px 22px',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeShopTab === 'bestellingen' ? '3px solid #243B6B' : '3px solid transparent',
                  color: activeShopTab === 'bestellingen' ? '#162544' : '#64748B',
                  marginBottom: -2,
                }}
              >
                Alle Bestellingen ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveShopTab('beheer')}
                style={{
                  padding: '13px 22px',
                  fontWeight: 900,
                  fontSize: '0.94rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: activeShopTab === 'beheer' ? '3px solid #243B6B' : '3px solid transparent',
                  color: activeShopTab === 'beheer' ? '#162544' : '#64748B',
                  marginBottom: -2,
                }}
              >
                Artikelen &amp; Assortiment
              </button>
            </div>

            {/* Body Content */}
            <div className="portaal-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {renderShopTabBody(activeShopTab)}

            </div>

            <div className="portaal-modal-footer" style={{ padding: '16px 28px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowShopModal(false)}
                style={{ padding: '9px 18px', fontSize: '0.9rem' }}
              >
                Sluiten
              </button>
            </div>

          </div>
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
