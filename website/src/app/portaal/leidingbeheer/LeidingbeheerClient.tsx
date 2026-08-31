'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Leader, Settings, TakConfig } from '@/lib/types'
import { LeidingbeheerKolom, LeidingbeheerTak, TAK_NAMEN, TAK_KLEUREN } from '@/lib/constants'
import PortaalToast from '../_components/PortaalToast'

interface Props {
  initialSettings: Settings
}

interface ColumnConfig {
  id: LeidingbeheerKolom
  name: string
  color: string
}

// 4 Hoofdtakken met de officiële takkleuren
const ACTIVE_COLUMNS: ColumnConfig[] = [
  {
    id: 'kapoenen',
    name: 'Kapoenen',
    color: '#F4C842', // Geel
  },
  {
    id: 'welpen',
    name: 'Welpen',
    color: '#5D9E6C', // Groen
  },
  {
    id: 'jonggivers',
    name: 'Jonggivers',
    color: '#E07B1A', // Oranje
  },
  {
    id: 'givers',
    name: 'Givers',
    color: '#1A3FB5', // Blauw
  },
]

const DEFAULT_GROEPSLEIDING_NAMES = ['marie', 'lucas', 'jelle', 'vic']

export default function LeidingbeheerClient({ initialSettings }: Props) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper om leidinglijst per tak veilig te initialiseren
  const buildInitialData = () => {
    const cols: Record<LeidingbeheerTak, Leader[]> = {
      kapoenen: [],
      welpen: [],
      jonggivers: [],
      givers: [],
      groepsleiding: [],
      opslag: [],
    }

    const takken = initialSettings?.takken ?? {}
    const grlList = takken.groepsleiding?.leaders ?? []

    const isNameGroepsleiding = (name: string, role?: string, isGrlFlag?: boolean) => {
      if (isGrlFlag) return true
      if (role && role.toLowerCase().includes('groepsleiding')) return true
      const lower = name.trim().toLowerCase()
      if (DEFAULT_GROEPSLEIDING_NAMES.some(gn => lower.includes(gn))) return true
      if (grlList.some(g => g.name.toLowerCase().trim() === lower)) return true
      return false
    }

    // 1. Laad actieve takken + opslag
    const allTakKeys: LeidingbeheerTak[] = ['kapoenen', 'welpen', 'jonggivers', 'givers', 'opslag']
    for (const col of allTakKeys) {
      const branchLeaders = takken[col]?.leaders ?? []
      cols[col] = branchLeaders.map((l: Leader, idx: number) => {
        const isGrl = isNameGroepsleiding(l.name, l.role, l.is_groepsleiding)
        return {
          id: l.id || `${col}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          name: l.name || '',
          totem: l.totem || '',
          phone: l.phone || '',
          role: l.role || (isGrl ? 'Groepsleiding' : ''),
          is_groepsleiding: isGrl,
        }
      })
    }

    // 2. Laad leiding die eventueel enkel in 'groepsleiding' staat
    const directGrlLeaders = takken.groepsleiding?.leaders ?? []
    for (const dgl of directGrlLeaders) {
      const isAlreadyInAny = allTakKeys.some(tk =>
        cols[tk].some(l => l.name.trim().toLowerCase() === dgl.name.trim().toLowerCase())
      )
      if (!isAlreadyInAny && dgl.name?.trim()) {
        cols.groepsleiding.push({
          id: dgl.id || `grl-only-${Math.random().toString(36).substring(2, 7)}`,
          name: dgl.name,
          totem: dgl.totem || '',
          phone: dgl.phone || '',
          role: dgl.role || 'Groepsleiding',
          is_groepsleiding: true,
        })
      }
    }

    // 3. Zorg dat de 4 vaste groepsleidingleden ergens voorkomen
    const defaultGrlFull = [
      { name: 'Marie Vanesbroek', col: 'jonggivers' as LeidingbeheerKolom, totem: 'Karmozijn rode karaktervolle Kavka', phone: '+32 468 53 49 81' },
      { name: 'Lucas Van Cleemput', col: 'givers' as LeidingbeheerKolom, totem: 'Kiene Kia', phone: '+32 468 41 95 02' },
      { name: 'Jelle Scholiers', col: 'jonggivers' as LeidingbeheerKolom, totem: 'Blijmoedige Beo', phone: '+32 491 91 99 90' },
      { name: 'Vic Verhaegen', col: 'welpen' as LeidingbeheerKolom, totem: 'Wasabigroene Vindingrijke Mus', phone: '+32 477 21 36 53' },
    ]

    for (const defGrl of defaultGrlFull) {
      const alreadyInAny = Object.values(cols).some(list =>
        list.some(l => l.name.toLowerCase().includes(defGrl.name.split(' ')[0].toLowerCase()))
      )
      if (!alreadyInAny) {
        cols[defGrl.col].push({
          id: `grl-${Math.random().toString(36).substring(2, 7)}`,
          name: defGrl.name,
          totem: defGrl.totem,
          phone: defGrl.phone,
          role: 'Groepsleiding',
          is_groepsleiding: true,
        })
      }
    }

    // Sorteer alle takken en opslag initieel alfabetisch op naam
    for (const key of ['kapoenen', 'welpen', 'jonggivers', 'givers', 'groepsleiding', 'opslag'] as LeidingbeheerTak[]) {
      cols[key].sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }))
    }

    // 4. Foto's ophalen
    const initPhotos: Record<string, string> = {
      groepsleiding: takken?.groepsleiding?.photo || '',
      kapoenen: takken?.kapoenen?.photo || '',
      welpen: takken?.welpen?.photo || '',
      jonggivers: takken?.jonggivers?.photo || '',
      givers: takken?.givers?.photo || '',
    }

    return { initialCols: cols, initialPhotos: initPhotos }
  }

  const { initialCols, initialPhotos } = buildInitialData()

  // State
  const [columns, setColumns] = useState<Record<LeidingbeheerTak, Leader[]>>(initialCols)
  const [photos, setPhotos] = useState<Record<string, string>>(initialPhotos)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<{ leader: Leader; fromCol: LeidingbeheerTak; index: number } | null>(null)
  const [dragOverCol, setDragOverCol] = useState<LeidingbeheerTak | null>(null)

  // Modals & Forms State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTargetCol, setEditingTargetCol] = useState<LeidingbeheerTak>('kapoenen')
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null)
  const [isNewLeader, setIsNewLeader] = useState(false)

  // Photo Upload State
  const [uploadingCol, setUploadingCol] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activePhotoCol, setActivePhotoCol] = useState<string | null>(null)

  // Feedback State
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ col: LeidingbeheerTak; leader: Leader } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Annuleren: herstel alles naar originele server state
  const handleDiscardChanges = () => {
    const { initialCols: resetCols, initialPhotos: resetPhotos } = buildInitialData()
    setColumns(resetCols)
    setPhotos(resetPhotos)
    setHasUnsavedChanges(false)
    showToast('Wijzigingen geannuleerd', 'success')
  }

  // Opslaan: sla huidige state op naar backend
  const handleSaveToBackend = async () => {
    setSaving(true)
    try {
      const takkenPayload: Record<string, Partial<TakConfig>> = {}
      const allTakKeys: LeidingbeheerTak[] = ['kapoenen', 'welpen', 'jonggivers', 'givers', 'groepsleiding', 'opslag']

      for (const col of allTakKeys) {
        takkenPayload[col] = {
          leaders: columns[col] || [],
          photo: photos[col] !== undefined ? photos[col] : '',
        }
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ takken: takkenPayload }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fout bij opslaan')
      }

      setHasUnsavedChanges(false)
      showToast('Alle wijzigingen succesvol opgeslagen!')
      router.refresh()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Fout bij opslaan', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Bereken alle huidige groepsleidingleden op alfabetische volgorde
  const getGroepsleidingMembers = () => {
    const list: Array<{ leader: Leader; branch: LeidingbeheerTak }> = []

    // 1. Directe groepsleiding (enkel groepsleiding)
    for (const leader of columns.groepsleiding || []) {
      list.push({ leader, branch: 'groepsleiding' })
    }

    // 2. Leiding uit takken en opslag met is_groepsleiding = true
    const searchCols: LeidingbeheerTak[] = ['kapoenen', 'welpen', 'jonggivers', 'givers', 'opslag']
    for (const col of searchCols) {
      for (const leader of columns[col] || []) {
        if (leader.is_groepsleiding) {
          if (!list.some(item => item.leader.id === leader.id || (item.leader.name.toLowerCase() === leader.name.toLowerCase() && leader.name.trim() !== ''))) {
            list.push({ leader, branch: col })
          }
        }
      }
    }

    // Sorteer groepsleiding altijd alfabetisch op naam
    return list.sort((a, b) => a.leader.name.localeCompare(b.leader.name, 'nl', { sensitivity: 'base' }))
  }

  const groepsleidingMembers = getGroepsleidingMembers()

  // --- DRAG & DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, leader: Leader, fromCol: LeidingbeheerTak, index: number) => {
    setDraggedItem({ leader, fromCol, index })
    e.dataTransfer.setData('text/plain', leader.id || leader.name)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverColumn = (e: React.DragEvent, colId: LeidingbeheerTak) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== colId) {
      setDragOverCol(colId)
    }
  }

  const handleDragLeaveColumn = (colId: LeidingbeheerTak) => {
    if (dragOverCol === colId) {
      setDragOverCol(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetCol: LeidingbeheerTak, targetIndex?: number) => {
    e.preventDefault()
    setDragOverCol(null)

    if (!draggedItem) return

    const { leader, fromCol, index: sourceIndex } = draggedItem
    setDraggedItem(null)

    if (fromCol === targetCol && (targetIndex === undefined || targetIndex === sourceIndex)) {
      return
    }

    const newColumns = { ...columns }
    newColumns[fromCol] = newColumns[fromCol].filter((_, i) => i !== sourceIndex)

    const targetList = [...(newColumns[targetCol] || [])]

    if (targetIndex !== undefined && targetIndex >= 0) {
      // Doelbewust op een specifieke positie gesleept (bv. naar boven)
      targetList.splice(targetIndex, 0, leader)
    } else if (fromCol !== targetCol) {
      // Nieuwe leiding naar een kolom gesleept: voeg in op alfabetische volgorde
      targetList.push(leader)
      targetList.sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }))
    } else {
      targetList.push(leader)
    }

    newColumns[targetCol] = targetList
    setColumns(newColumns)
    setHasUnsavedChanges(true)
  }

  // --- MODAL HANDLERS ---
  const openAddLeaderModal = (defaultCol: LeidingbeheerTak = 'kapoenen', forceGrl = false) => {
    setEditingTargetCol(defaultCol)
    setEditingLeader({
      id: `${defaultCol}-${Date.now()}`,
      name: '',
      totem: '',
      phone: '',
      role: forceGrl ? 'Groepsleiding' : '',
      is_groepsleiding: forceGrl || defaultCol === 'groepsleiding',
    })
    setIsNewLeader(true)
    setIsEditModalOpen(true)
  }

  const openEditLeaderModal = (leader: Leader, currentCol: LeidingbeheerTak) => {
    setEditingTargetCol(currentCol)
    setEditingLeader({ ...leader })
    setIsNewLeader(false)
    setIsEditModalOpen(true)
  }

  const handleSaveLeaderModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLeader || !editingLeader.name.trim()) {
      showToast('Naam is verplicht', 'error')
      return
    }

    const newColumns = { ...columns }

    if (isNewLeader) {
      const targetList = [...(newColumns[editingTargetCol] || []), editingLeader]
      targetList.sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }))
      newColumns[editingTargetCol] = targetList
    } else {
      let foundInCol: LeidingbeheerTak = editingTargetCol
      const allCols: LeidingbeheerTak[] = ['kapoenen', 'welpen', 'jonggivers', 'givers', 'groepsleiding', 'opslag']
      for (const col of allCols) {
        if (newColumns[col]?.some(l => l.id === editingLeader.id)) {
          foundInCol = col
          break
        }
      }

      if (foundInCol === editingTargetCol) {
        newColumns[foundInCol] = newColumns[foundInCol].map(l =>
          l.id === editingLeader.id ? editingLeader : l
        )
      } else {
        newColumns[foundInCol] = newColumns[foundInCol].filter(l => l.id !== editingLeader.id)
        const targetList = [...(newColumns[editingTargetCol] || []), editingLeader]
        targetList.sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }))
        newColumns[editingTargetCol] = targetList
      }
    }

    setColumns(newColumns)
    setIsEditModalOpen(false)
    setEditingLeader(null)
    setHasUnsavedChanges(true)
  }

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return
    const { col, leader } = deleteConfirm
    const newColumns = { ...columns }
    newColumns[col] = newColumns[col].filter(l => l.id !== leader.id)
    setColumns(newColumns)
    setDeleteConfirm(null)
    setHasUnsavedChanges(true)
  }

  // --- PHOTO UPLOAD & DELETE ---
  const triggerPhotoUpload = (colId: string) => {
    setActivePhotoCol(colId)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemovePhoto = (colId: string) => {
    const newPhotos = { ...photos, [colId]: '' }
    setPhotos(newPhotos)
    setHasUnsavedChanges(true)
    const name = colId === 'groepsleiding' ? 'Groepsleiding' : TAK_NAMEN[colId]
    showToast(`Foto voor ${name} verwijderd. Klik op Opslaan.`)
  }

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activePhotoCol) return

    setUploadingCol(activePhotoCol)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', `tak-foto-${activePhotoCol}`)
      if (photos[activePhotoCol]) {
        formData.append('oldUrl', photos[activePhotoCol])
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Upload mislukt')
      }

      const data = await res.json()
      const newPhotos = { ...photos, [activePhotoCol]: data.url }
      setPhotos(newPhotos)
      setHasUnsavedChanges(true)
      const name = activePhotoCol === 'groepsleiding' ? 'Groepsleiding' : TAK_NAMEN[activePhotoCol]
      showToast(`Foto voor ${name} klaargezet! Klik op Opslaan.`)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Fout bij uploaden foto', 'error')
    } finally {
      setUploadingCol(null)
      setActivePhotoCol(null)
      if (e.target) e.target.value = ''
    }
  }

  const grlPhoto = photos.groepsleiding
  const hasGrlPhoto = Boolean(grlPhoto && grlPhoto.trim() !== '')

  return (
    <div className="leidingbeheer-container" style={{ padding: '16px 20px 60px', width: '100%', boxSizing: 'border-box', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        @media (max-width: 768px) {
          .leidingbeheer-container {
            padding: 12px 12px 80px !important;
          }
          .leidingbeheer-grl-content {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .leidingbeheer-grl-photo {
            width: 160px !important;
            height: 120px !important;
            max-width: 100% !important;
            margin: 0 auto !important;
          }
          .leidingbeheer-grl-cards-grid {
            grid-template-columns: 1fr !important;
          }
          .leidingbeheer-takken-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .leidingbeheer-sticky-bar {
            top: 70px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            padding: 12px 14px !important;
          }
          .leidingbeheer-sticky-bar-btns {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .leidingbeheer-sticky-bar-btns button {
            justify-content: center !important;
            padding: 10px !important;
          }
        }
        @media (max-width: 640px) {
          .leidingbeheer-add-topbar-btn {
            padding: 0 !important;
            width: 38px !important;
            height: 38px !important;
            min-width: 38px !important;
            justify-content: center !important;
            border-radius: 10px !important;
          }
          .leidingbeheer-add-topbar-text {
            display: none !important;
          }
          .leidingbeheer-add-topbar-btn i {
            font-size: 0.95rem !important;
            margin: 0 !important;
          }
        }
        @media (max-width: 480px) {
          .leidingbeheer-modal-input {
            font-size: 16px !important;
          }
          .leidingbeheer-card-btn {
            width: 32px !important;
            height: 32px !important;
          }
        }
      `}</style>

      {/* Verborgen file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/avif,.jpg,.jpeg,.png,.webp,.heic,.avif"
        style={{ display: 'none' }}
      />

      {/* Toast Notificatie */}
      <PortaalToast toast={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Topbar Actie: 'Nieuwe leiding toevoegen' */}
      {mounted && typeof document !== 'undefined' && document.getElementById('portaal-topbar-actions') &&
        createPortal(
          <button
            onClick={() => openAddLeaderModal('kapoenen')}
            type="button"
            className="leidingbeheer-add-topbar-btn"
            title="Nieuwe leiding toevoegen"
            style={{
              backgroundColor: '#243B6B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '7px 14px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(36, 59, 107, 0.2)',
            }}
          >
            <i className="fa-solid fa-user-plus" style={{ fontSize: '0.82rem' }}></i>
            <span className="leidingbeheer-add-topbar-text">Nieuwe leiding toevoegen</span>
          </button>,
          document.getElementById('portaal-topbar-actions')!
        )
      }

      {/* Sticky / Drijvende Actiebalk bij niet-opgeslagen wijzigingen */}
      {hasUnsavedChanges && (
        <div
          className="leidingbeheer-sticky-bar"
          style={{
            position: 'sticky',
            top: 76,
            zIndex: 90,
            backgroundColor: '#1E293B',
            color: '#FFFFFF',
            borderRadius: 12,
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            marginBottom: 20,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 8px #F59E0B',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
              Je hebt niet-opgeslagen wijzigingen
            </span>
          </div>

          <div className="leidingbeheer-sticky-bar-btns" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleDiscardChanges}
              type="button"
              disabled={saving}
              style={{
                backgroundColor: 'transparent',
                color: '#CBD5E1',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 8,
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Annuleren
            </button>

            <button
              onClick={handleSaveToBackend}
              disabled={saving}
              type="button"
              style={{
                backgroundColor: '#243B6B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '6px 16px',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(36, 59, 107, 0.35)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              <i className={`fa-solid ${saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
              <span>{saving ? 'Opslaan...' : 'Wijzigingen opslaan'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. GROEPSLEIDING SECTIE                                      */}
      {/* ============================================================ */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          borderLeft: '1px solid #E5E7EB',
          borderRight: '1px solid #E5E7EB',
          borderBottom: '1px solid #E5E7EB',
          borderTop: '4px solid #650B19', // Bordeaux groepsleiding kleur
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          marginBottom: 24,
          overflow: 'hidden',
        }}
      >
        {/* Banner Header: Strak zonder counters of knoppen */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.18rem',
              fontWeight: 900,
              color: '#162544',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
            }}
          >
            Groepsleiding
          </h2>
        </div>

        {/* Inhoud: Foto Links + Kaarten Rechts */}
        <div
          className="leidingbeheer-grl-content"
          style={{
            padding: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          {/* Linkerblok: Foto (exact 4:3 formaat 144x108px gelijk met de kaarthoogte) */}
          <div
            className="leidingbeheer-grl-photo"
            style={{
              position: 'relative',
              width: 144,
              minWidth: 144,
              maxWidth: 144,
              height: 108,
              aspectRatio: '4 / 3',
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: hasGrlPhoto ? '1px solid #D1D5DB' : '1.5px dashed #D1D5DB',
              boxShadow: hasGrlPhoto ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            {hasGrlPhoto ? (
              <>
                <Image
                  src={grlPhoto}
                  alt="Groepsleiding Foto"
                  fill
                  sizes="150px"
                  style={{ objectFit: 'cover' }}
                />

                {/* Knoppen op foto */}
                <div
                  style={{
                    position: 'absolute',
                    right: 4,
                    bottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <button
                    onClick={() => triggerPhotoUpload('groepsleiding')}
                    disabled={uploadingCol === 'groepsleiding'}
                    type="button"
                    title="Nieuwe foto uploaden"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.72)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: 4,
                      padding: '3px 6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      backdropFilter: 'blur(3px)',
                    }}
                  >
                    <i className={`fa-solid ${uploadingCol === 'groepsleiding' ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                    <span>{uploadingCol === 'groepsleiding' ? '...' : 'Wijzig'}</span>
                  </button>

                  <button
                    onClick={() => handleRemovePhoto('groepsleiding')}
                    type="button"
                    title="Foto wissen"
                    style={{
                      backgroundColor: 'rgba(220, 38, 38, 0.85)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: 4,
                      padding: '3px 5px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      backdropFilter: 'blur(3px)',
                    }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: 6,
                  textAlign: 'center',
                }}
              >
                <i className="fa-solid fa-camera" style={{ fontSize: '1.15rem', color: '#9CA3AF' }}></i>
                <button
                  onClick={() => triggerPhotoUpload('groepsleiding')}
                  disabled={uploadingCol === 'groepsleiding'}
                  type="button"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#650B19',
                    border: '1px solid #CBD5E1',
                    borderRadius: 5,
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <span>Foto uploaden</span>
                </button>
              </div>
            )}
          </div>

          {/* Rechterblok: Kaarten van Groepsleidingleden */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 260 }}>
            {groepsleidingMembers.length === 0 ? (
              <div
                style={{
                  border: '1px dashed #D1D5DB',
                  borderRadius: 10,
                  padding: 20,
                  textAlign: 'center',
                  color: '#9CA3AF',
                  fontSize: '0.86rem',
                  fontStyle: 'italic',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 108,
                  minHeight: 108,
                  boxSizing: 'border-box',
                }}
              >
                Geen groepsleiding ingesteld.
              </div>
            ) : (
              <div
                className="leidingbeheer-grl-cards-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 10,
                  alignContent: 'start',
                }}
              >
                {groepsleidingMembers.map(({ leader, branch }) => {
                  return (
                    <div
                      key={leader.id || leader.name}
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: 10,
                        padding: '14px 16px',
                        minHeight: 108,
                        height: 108,
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ marginBottom: 2 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#1A1A1A' }}>
                            {leader.name}
                          </span>
                        </div>

                        {leader.totem && (
                          <div style={{ fontSize: '0.8rem', color: '#4B5563', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {leader.totem}
                          </div>
                        )}

                        {leader.phone && (
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fa-solid fa-phone" style={{ fontSize: '0.65rem' }}></i>
                            <span>{leader.phone}</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditLeaderModal(leader, branch)}
                        title="Bewerken"
                        className="leidingbeheer-card-btn"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: '1px solid #D1D5DB',
                          background: '#FFFFFF',
                          color: '#374151',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          flexShrink: 0,
                        }}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DE 4 HOOFDTAKKEN                                          */}
      {/* ============================================================ */}
      <div style={{ marginBottom: 28 }}>
        <div
          className="leidingbeheer-takken-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
            alignItems: 'start',
            width: '100%',
          }}
        >
          {ACTIVE_COLUMNS.map(col => {
            const isDragTarget = dragOverCol === col.id
            const leaderList = columns[col.id] || []
            const colPhoto = photos[col.id]
            const hasImage = Boolean(colPhoto && colPhoto.trim() !== '')

            return (
              <div
                key={col.id}
                onDragOver={e => handleDragOverColumn(e, col.id)}
                onDragLeave={() => handleDragLeaveColumn(col.id)}
                onDrop={e => handleDrop(e, col.id)}
                style={{
                  backgroundColor: isDragTarget ? '#F3F4F6' : '#FFFFFF',
                  borderRadius: 12,
                  borderLeft: isDragTarget ? `2px dashed ${col.color}` : '1px solid #E5E7EB',
                  borderRight: isDragTarget ? `2px dashed ${col.color}` : '1px solid #E5E7EB',
                  borderBottom: isDragTarget ? `2px dashed ${col.color}` : '1px solid #E5E7EB',
                  borderTop: isDragTarget ? `4px dashed ${col.color}` : `4px solid ${col.color}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 440,
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Kolom Header */}
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.08rem',
                        fontWeight: 900,
                        color: '#1A1A1A',
                        fontFamily: 'var(--font-heading, Nunito, sans-serif)',
                        lineHeight: 1.2,
                      }}
                    >
                      {col.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        color: '#4B5563',
                        backgroundColor: '#F3F4F6',
                        padding: '1px 7px',
                        borderRadius: 10,
                        flexShrink: 0,
                      }}
                    >
                      {leaderList.length}
                    </span>
                  </div>

                  {/* Takfoto Header Preview (4/3 dimensie met witte achtergrond) */}
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '4 / 3',
                        borderRadius: 8,
                        overflow: 'hidden',
                        backgroundColor: '#FFFFFF',
                        border: hasImage ? '1px solid #D1D5DB' : '1.5px dashed #D1D5DB',
                        boxShadow: hasImage ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {hasImage ? (
                        <>
                          <Image
                            src={colPhoto}
                            alt={`Takfoto ${col.name}`}
                            fill
                            sizes="280px"
                            style={{ objectFit: 'cover' }}
                          />

                          {/* Knoppen op de foto */}
                          <div
                            style={{
                              position: 'absolute',
                              right: 6,
                              bottom: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <button
                              onClick={() => triggerPhotoUpload(col.id)}
                              disabled={uploadingCol === col.id}
                              type="button"
                              title="Nieuwe foto uploaden"
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.72)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255,255,255,0.4)',
                                borderRadius: 5,
                                padding: '3px 7px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                backdropFilter: 'blur(3px)',
                              }}
                            >
                              <i className={`fa-solid ${uploadingCol === col.id ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                              <span>{uploadingCol === col.id ? '...' : 'Wijzigen'}</span>
                            </button>

                            <button
                              onClick={() => handleRemovePhoto(col.id)}
                              type="button"
                              title="Foto verwijderen"
                              style={{
                                backgroundColor: 'rgba(220, 38, 38, 0.85)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255,255,255,0.4)',
                                borderRadius: 5,
                                padding: '3px 6px',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                backdropFilter: 'blur(3px)',
                              }}
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            padding: 8,
                            textAlign: 'center',
                          }}
                        >
                          <span style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600 }}>
                            Geen foto ingesteld
                          </span>
                          <button
                            onClick={() => triggerPhotoUpload(col.id)}
                            disabled={uploadingCol === col.id}
                            type="button"
                            style={{
                              backgroundColor: '#FFFFFF',
                              color: '#243B6B',
                              border: '1px solid #CBD5E1',
                              borderRadius: 5,
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}
                          >
                            <i className="fa-solid fa-camera"></i>
                            <span>Foto toevoegen</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Kaartjes Lijst (Dropzone) */}
                <div
                  style={{
                    padding: 8,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    minHeight: 180,
                  }}
                >
                  {leaderList.length === 0 ? (
                    <div
                      style={{
                        border: '1px dashed #D1D5DB',
                        borderRadius: 8,
                        padding: '20px 8px',
                        textAlign: 'center',
                        color: '#9CA3AF',
                        fontSize: '0.78rem',
                        fontStyle: 'italic',
                        backgroundColor: '#F9FAFB',
                      }}
                    >
                      Geen leiding in deze tak
                    </div>
                  ) : (
                    leaderList.map((leader, index) => {
                      const isDragging = draggedItem?.leader.id === leader.id
                      const isGrl = leader.is_groepsleiding

                      return (
                        <div
                          key={leader.id || `${col.id}-${index}`}
                          draggable
                          onDragStart={e => handleDragStart(e, leader, col.id, index)}
                          onDragEnd={() => {
                            setDraggedItem(null)
                            setDragOverCol(null)
                          }}
                          onDragOver={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDragOverColumn(e, col.id)
                          }}
                          onDrop={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDrop(e, col.id, index)
                          }}
                          style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 8,
                            padding: '8px 10px',
                            border: '1px solid #E5E7EB',
                            boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                            cursor: 'grab',
                            opacity: isDragging ? 0.35 : 1,
                            transform: isDragging ? 'scale(0.98)' : 'none',
                            transition: 'box-shadow 0.15s ease, opacity 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                            position: 'relative',
                          }}
                        >
                          {/* Links: Grip + Naam + Totem + GRL badge */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                            <i
                              className="fa-solid fa-grip-vertical"
                              style={{ color: '#CBD5E1', fontSize: '0.75rem', cursor: 'grab', flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: '0.88rem',
                                    color: '#1F2937',
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {leader.name}
                                </span>

                                {/* GRL Badge */}
                                {isGrl && (
                                  <span
                                    style={{
                                      backgroundColor: '#FDE8EB',
                                      color: '#650B19',
                                      border: '1px solid #F5C6CB',
                                      fontSize: '0.62rem',
                                      fontWeight: 900,
                                      padding: '1px 5px',
                                      borderRadius: 4,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      flexShrink: 0,
                                    }}
                                    title="Is ook Groepsleiding"
                                  >
                                    GRL
                                  </span>
                                )}
                              </div>

                              {leader.totem && (
                                <div style={{ fontSize: '0.74rem', color: '#6B7280', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                                  {leader.totem}
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Rechts: Edit knop */}
                          <button
                            type="button"
                            onClick={() => openEditLeaderModal(leader, col.id)}
                            title="Bewerken"
                            className="leidingbeheer-card-btn"
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 5,
                              border: '1px solid #E5E7EB',
                              background: '#F9FAFB',
                              color: '#4B5563',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '0.72rem',
                              flexShrink: 0,
                            }}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. OPSLAG (ALTIJD UITGEKLAPT + DROPZONE)                     */}
      {/* ============================================================ */}
      <div
        onDragOver={e => handleDragOverColumn(e, 'opslag')}
        onDragLeave={() => handleDragLeaveColumn('opslag')}
        onDrop={e => handleDrop(e, 'opslag')}
        style={{
          backgroundColor: dragOverCol === 'opslag' ? '#F1F5F9' : '#FFFFFF',
          borderRadius: 14,
          borderLeft: dragOverCol === 'opslag' ? '2px dashed #64748B' : '1px solid #E5E7EB',
          borderRight: dragOverCol === 'opslag' ? '2px dashed #64748B' : '1px solid #E5E7EB',
          borderBottom: dragOverCol === 'opslag' ? '2px dashed #64748B' : '1px solid #E5E7EB',
          borderTop: dragOverCol === 'opslag' ? '4px dashed #64748B' : '4px solid #64748B',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Header: Eenvoudig Opslag */}
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.18rem',
              fontWeight: 900,
              color: '#334155',
              fontFamily: 'var(--font-heading, Nunito, sans-serif)',
            }}
          >
            Opslag
          </h2>
        </div>

        {/* Lade Inhoud (Direct getoond) */}
        <div style={{ padding: 16 }}>
          {(columns.opslag || []).length === 0 ? (
            <div
              style={{
                border: '1px dashed #CBD5E1',
                borderRadius: 8,
                padding: 20,
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.82rem',
                fontStyle: 'italic',
                backgroundColor: '#FFFFFF',
              }}
            >
              Geen leiding in opslag. Sleep leiding hierheen als ze stoppen of een pauze nemen.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8,
              }}
            >
              {(columns.opslag || []).map((leader, index) => {
                const isDragging = draggedItem?.leader.id === leader.id

                return (
                  <div
                    key={leader.id || `opslag-${index}`}
                    draggable
                    onDragStart={e => handleDragStart(e, leader, 'opslag', index)}
                    onDragEnd={() => {
                      setDraggedItem(null)
                      setDragOverCol(null)
                    }}
                    onDragOver={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDragOverColumn(e, 'opslag')
                    }}
                    onDrop={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDrop(e, 'opslag', index)
                    }}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      padding: '8px 10px',
                      border: '1px solid #E2E8F0',
                      boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.02)',
                      cursor: 'grab',
                      opacity: isDragging ? 0.35 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                      <i className="fa-solid fa-grip-vertical" style={{ color: '#CBD5E1', fontSize: '0.75rem', cursor: 'grab', flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#334155', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {leader.name}
                        </span>
                        {leader.totem && (
                          <span style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {leader.totem}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditLeaderModal(leader, 'opslag')}
                      title="Bewerken"
                      className="leidingbeheer-card-btn"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 5,
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        flexShrink: 0,
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MODAL: LEIDING TOEVOEGEN / BEWERKEN                       */}
      {/* ============================================================ */}
      {isEditModalOpen && editingLeader && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              width: '100%',
              maxWidth: 440,
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  color: '#162544',
                  fontFamily: 'var(--font-heading, Nunito, sans-serif)',
                }}
              >
                {isNewLeader ? 'Nieuw Leidinglid Toevoegen' : 'Leidinglid Bewerken'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.1rem',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveLeaderModal} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Naam */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#374151', marginBottom: 4 }}>
                  Naam <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="bv. Marthe Claes"
                  value={editingLeader.name}
                  onChange={e => setEditingLeader({ ...editingLeader, name: e.target.value })}
                  className="leidingbeheer-modal-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Totem */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#374151', marginBottom: 4 }}>
                  Totem (optioneel)
                </label>
                <input
                  type="text"
                  placeholder="bv. Vinnige Stokstaart"
                  value={editingLeader.totem || ''}
                  onChange={e => setEditingLeader({ ...editingLeader, totem: e.target.value })}
                  className="leidingbeheer-modal-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Telefoonnummer */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#374151', marginBottom: 4 }}>
                  Telefoonnummer (optioneel)
                </label>
                <input
                  type="tel"
                  placeholder="bv. 0471 23 45 67"
                  value={editingLeader.phone || ''}
                  onChange={e => setEditingLeader({ ...editingLeader, phone: e.target.value })}
                  className="leidingbeheer-modal-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tak toewijzing */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 800, color: '#374151', marginBottom: 4 }}>
                  Toewijzing Tak
                </label>
                <select
                  value={editingTargetCol}
                  onChange={e => setEditingTargetCol(e.target.value as LeidingbeheerTak)}
                  className="leidingbeheer-modal-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: '0.9rem',
                    backgroundColor: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="kapoenen">Kapoenen</option>
                  <option value="welpen">Welpen</option>
                  <option value="jonggivers">Jonggivers</option>
                  <option value="givers">Givers</option>
                  <option value="groepsleiding">Enkel Groepsleiding</option>
                  <option value="opslag">Opslag</option>
                </select>
              </div>

              {/* Groepsleiding checkbox */}
              <div
                style={{
                  backgroundColor: '#F9FAFB',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  id="is_groepsleiding_cb"
                  checked={Boolean(editingLeader.is_groepsleiding || editingTargetCol === 'groepsleiding')}
                  disabled={editingTargetCol === 'groepsleiding'}
                  onChange={e => setEditingLeader({ ...editingLeader, is_groepsleiding: e.target.checked })}
                  style={{
                    width: 16,
                    height: 16,
                    marginTop: 2,
                    accentColor: '#650B19',
                    cursor: editingTargetCol === 'groepsleiding' ? 'not-allowed' : 'pointer',
                  }}
                />
                <label htmlFor="is_groepsleiding_cb" style={{ cursor: editingTargetCol === 'groepsleiding' ? 'default' : 'pointer', fontSize: '0.84rem', color: '#1A1A1A' }}>
                  <strong style={{ display: 'block', color: '#650B19', fontWeight: 800 }}>
                    Is (ook) Groepsleiding
                  </strong>
                  <span style={{ color: '#64748B', fontSize: '0.78rem', lineHeight: 1.3, display: 'block', marginTop: 2 }}>
                    Verschijnt automatisch in de Groepsleiding-sectie bovenaan en op de Contactpagina.
                  </span>
                </label>
              </div>

              {/* Knoppen & Verwijderen */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                {!isNewLeader ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setDeleteConfirm({ col: editingTargetCol, leader: editingLeader })
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#DC2626',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <i className="fa-solid fa-trash"></i>
                    <span>Wissen</span>
                  </button>
                ) : (
                  <div />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid #D1D5DB',
                      backgroundColor: '#FFFFFF',
                      color: '#374151',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Sluiten
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#243B6B',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(36, 59, 107, 0.25)',
                    }}
                  >
                    {isNewLeader ? 'Toevoegen' : 'Klaar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL: WISSEN BEVESTIGING                                 */}
      {/* ============================================================ */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              width: '100%',
              maxWidth: 400,
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
              padding: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: '#FEE2E2',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-trash"></i>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#1A1A1A' }}>
                Leidinglid wissen?
              </h3>
            </div>

            <p style={{ margin: '0 0 14px', color: '#4B5563', fontSize: '0.86rem', lineHeight: 1.4 }}>
              Weet je zeker dat je <strong>{deleteConfirm.leader.name}</strong> wilt wissen?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Wissen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
