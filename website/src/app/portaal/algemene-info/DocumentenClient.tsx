'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { PortalResource } from '@/lib/types'
import ConfirmDialog from '../_components/ConfirmDialog'

const DEFAULT_CATEGORIES = [
  'Algemeen',
]

interface Props {
  initialResources: PortalResource[]
  isGroepsleiding?: boolean
}

function ScoutsLelieIcon() {
  return (
    <svg width="1.15em" height="1.15em" viewBox="0 0 100 100" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <path d="M50 8 C54 22 66 28 66 40 C66 48 59 55 50 55 C41 55 34 48 34 40 C34 28 46 22 50 8 Z" />
      <path d="M40 34 C28 30 17 37 18 49 C19 57 27 61 35 57 C43 53 45 43 40 34 Z" />
      <path d="M60 34 C72 30 83 37 82 49 C81 57 73 61 65 57 C57 53 55 43 60 34 Z" />
      <rect x="32" y="57" width="36" height="7" rx="3.5" />
      <path d="M44 64 C44 73 50 79 50 79 C50 79 56 73 56 64 Z" />
    </svg>
  )
}

function RenderIcon({ icon }: { icon: string }) {
  if (icon === 'scouts-lelie') {
    return <ScoutsLelieIcon />
  }
  if (icon === 'kampas') {
    return <i className="fa-solid fa-tent" />
  }
  if (icon === 'scouts-gidsen-vl') {
    return <i className="fa-solid fa-compass" />
  }
  return <i className={icon || 'fa-solid fa-file'} />
}

function ResourceCard({
  item,
  showEditControls,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: PortalResource
  showEditControls: boolean
  onEdit: (item: PortalResource) => void
  onDelete: (item: PortalResource) => void
  isDeleting: boolean
}) {
  const handleClick = () => {
    if (item.url) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        minHeight: 72,
        borderRadius: 16, // Matching the old round-corner cards in screenshot!
        background: '#FFFFFF',
        border: '1px solid #CCCCCC',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        cursor: item.url ? 'pointer' : 'default',
        transition: 'all 0.15s ease-in-out',
        boxSizing: 'border-box',
        width: '100%',
      }}
      className="action-card-hover"
    >
      {/* Icon Badge */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: '#EBF0F9',
          color: '#243B6B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.15rem',
          flexShrink: 0,
        }}
      >
        <RenderIcon icon={item.icon} />
      </div>

      {/* Label & Description */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: showEditControls ? 56 : 24 }}>
        <strong style={{
          fontSize: '.94rem',
          fontWeight: 800,
          color: '#162544',
          display: 'block',
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {item.label}
        </strong>

        {item.description && (
          <p style={{
            margin: '2px 0 0',
            fontSize: '.78rem',
            color: '#666666',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.description}
          </p>
        )}
      </div>

      {/* Edit Controls or Chevron Right Badge */}
      {showEditControls ? (
        <div style={{ display: 'flex', gap: 4, position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item) }}
            title="Bewerken"
            style={{ background: '#EBF0F9', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#243B6B', cursor: 'pointer', fontSize: '.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-pen-to-square"></i>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item) }}
            disabled={isDeleting}
            title="Verwijderen"
            style={{ background: '#FFF0F3', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#B91C1C', cursor: 'pointer', fontSize: '.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i className="fa-solid fa-trash-can"></i>
          </button>
        </div>
      ) : (
        <div style={{
          position: 'absolute',
          right: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#F0ECE4',
          color: '#243B6B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.72rem',
          fontWeight: 800,
          flexShrink: 0,
        }}>
          <i className="fa-solid fa-chevron-right"></i>
        </div>
      )}
    </div>
  )
}

const AVAILABLE_ICONS = [
  { id: 'scouts-lelie', label: 'Scouts Lelie' },
  { id: 'kampas', label: 'Kampas' },
  { id: 'scouts-gidsen-vl', label: 'Groepsadmin / SGV' },
  { id: 'fa-solid fa-file', label: 'Document' },
  { id: 'fa-solid fa-file-pdf', label: 'PDF Bestand' },
  { id: 'fa-solid fa-file-excel', label: 'Excel / Sheet' },
  { id: 'fa-solid fa-file-word', label: 'Word Document' },
  { id: 'fa-solid fa-link', label: 'Link / Externe Site' },
  { id: 'fa-solid fa-folder', label: 'Map / Drive' },
  { id: 'fa-brands fa-google-drive', label: 'Google Drive' },
  { id: 'fa-brands fa-facebook', label: 'Facebook' },
  { id: 'fa-solid fa-users-gear', label: 'Administratie' },
  { id: 'fa-solid fa-tent', label: 'Kamp' },
  { id: 'fa-solid fa-clipboard-check', label: 'Checklist' },
  { id: 'fa-solid fa-calculator', label: 'Kasboek' },
  { id: 'fa-solid fa-receipt', label: 'Afrekening' },
  { id: 'fa-solid fa-file-pen', label: 'Spelvoorbereiding' },
  { id: 'fa-solid fa-list-check', label: 'Spel Checklist' },
  { id: 'fa-solid fa-lightbulb', label: 'Spelideeën' },
  { id: 'fa-solid fa-notes-medical', label: 'Medische Fiche' },
  { id: 'fa-solid fa-phone-volume', label: 'Noodnummers' },
  { id: 'fa-solid fa-shield-halved', label: 'Veiligheid' },
  { id: 'fa-solid fa-calendar-days', label: 'Agenda' },
  { id: 'fa-solid fa-location-dot', label: 'Locatie' },
  { id: 'fa-solid fa-graduation-cap', label: 'Vorming' },
  { id: 'fa-solid fa-utensils', label: 'Kookploeg' },
  { id: 'fa-solid fa-bus', label: 'Transport' },
  { id: 'fa-solid fa-shirt', label: 'Uniform' },
  { id: 'fa-solid fa-bullhorn', label: 'Aankondiging' },
  { id: 'fa-solid fa-coins', label: 'Lidgeld' },
]

function IconPickerGrid({
  selectedIcon,
  onSelect,
}: {
  selectedIcon: string
  onSelect: (icon: string) => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
        gap: 8,
        maxHeight: 180,
        overflowY: 'auto',
        padding: 10,
        background: '#F8FAFC',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
      }}
    >
      {AVAILABLE_ICONS.map((item) => {
        const isSelected = selectedIcon === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            title={item.label}
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.15rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
              border: isSelected ? '2px solid #162544' : '1px solid #C5D5EA',
              background: isSelected ? '#243B6B' : '#EBF0F9',
              color: isSelected ? '#FFFFFF' : '#243B6B',
              boxShadow: isSelected ? '0 3px 8px rgba(36, 59, 107, 0.35)' : 'none',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <RenderIcon icon={item.id} />
          </button>
        )
      })}
    </div>
  )
}

function ResourceModal({
  item,
  categories,
  defaultCategory,
  onSave,
  onClose,
}: {
  item: PortalResource | null
  categories: string[]
  defaultCategory: string
  onSave: (data: Partial<PortalResource>) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState(item?.label || '')
  const [url, setUrl] = useState(item?.url || '')
  const [description, setDescription] = useState(item?.description || '')
  const [category, setCategory] = useState(item?.category || defaultCategory)
  const [icon, setIcon] = useState(item?.icon || 'fa-solid fa-file')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    let formattedUrl = url.trim()
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl) && !/^mailto:/i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }
    onSave({ label, url: formattedUrl, description, category, icon, type: item?.type || 'document' })
  }

  return (
    <div className="portaal-modal-overlay">
      <div className="portaal-modal-card" style={{ maxWidth: 520, borderRadius: 20, borderTop: '5px solid #243B6B', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div className="portaal-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h3 className="portaal-modal-title" style={{ color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            {item ? 'Item Bewerken' : 'Nieuw Item Toevoegen'}
          </h3>
          <button className="portaal-modal-close" onClick={onClose} style={{ fontSize: '1.5rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="portaal-modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', fontSize: '.88rem', marginBottom: 6, display: 'block' }}>Titel / Label *</label>
              <input type="text" className="form-control" value={label} onChange={e => setLabel(e.target.value)} required style={{ borderRadius: 10, padding: '10px 14px', border: '1px solid #CBD5E1' }} placeholder="Bijv. Kampgids 2026" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', fontSize: '.88rem', marginBottom: 6, display: 'block' }}>URL / Link (optioneel)</label>
              <input type="text" className="form-control" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://... of www.voorbeeld.be" style={{ borderRadius: 10, padding: '10px 14px', border: '1px solid #CBD5E1' }} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', fontSize: '.88rem', marginBottom: 6, display: 'block' }}>Beschrijving (optioneel)</label>
              <textarea className="form-control" rows={2} value={description} onChange={e => setDescription(e.target.value)} style={{ borderRadius: 10, padding: '10px 14px', border: '1px solid #CBD5E1' }} placeholder="Korte toelichting..." />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', fontSize: '.88rem', marginBottom: 6, display: 'block' }}>Categorie</label>
              <select className="form-control" value={category} onChange={e => setCategory(e.target.value)} style={{ borderRadius: 10, padding: '10px 14px', border: '1px solid #CBD5E1' }}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', fontSize: '.88rem', marginBottom: 6, display: 'block' }}>Kies Icoon</label>
              <IconPickerGrid selectedIcon={icon} onSelect={setIcon} />
            </div>
          </div>
          <div className="portaal-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 700, cursor: 'pointer' }}>Annuleren</button>
            <button type="submit" style={{ padding: '9px 22px', borderRadius: 10, background: '#243B6B', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(36,59,107,0.3)' }}>Opslaan</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CategoryModal({
  oldName,
  onSave,
  onDelete,
  onClose,
}: {
  oldName: string | null
  onSave: (name: string) => void
  onDelete: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(oldName || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSave(name.trim())
  }

  return (
    <div className="portaal-modal-overlay">
      <div className="portaal-modal-card" style={{ maxWidth: 460, borderRadius: 20, borderTop: '5px solid #243B6B', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <div className="portaal-modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h3 className="portaal-modal-title" style={{ color: '#162544', fontFamily: 'var(--font-heading, Nunito, sans-serif)', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            {oldName ? 'Categorie Bewerken' : 'Nieuwe Categorie'}
          </h3>
          <button className="portaal-modal-close" onClick={onClose} style={{ fontSize: '1.5rem', color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="portaal-modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, color: '#1E293B', fontSize: '.88rem', marginBottom: 6, display: 'block' }}>Categorienaam *</label>
              <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required placeholder="Bijv. Kampen, Spellen, Algemeen..." style={{ borderRadius: 10, padding: '10px 14px', border: '1px solid #CBD5E1' }} />
            </div>
          </div>
          <div className="portaal-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {oldName ? (
              <button type="button" onClick={() => onDelete(oldName)} style={{ padding: '9px 16px', borderRadius: 10, background: '#FFF0F3', color: '#B91C1C', border: '1px solid #F8C8D4', fontWeight: 700, fontSize: '.84rem', cursor: 'pointer' }}>Verwijderen</button>
            ) : <div />}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 10, background: '#FFFFFF', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 700, cursor: 'pointer' }}>Annuleren</button>
              <button type="submit" style={{ padding: '9px 22px', borderRadius: 10, background: '#243B6B', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 6px rgba(36,59,107,0.3)' }}>Opslaan</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DocumentenClient({ initialResources, isGroepsleiding }: Props) {
  const router = useRouter()
  const [resources, setResources] = useState<PortalResource[]>(initialResources)
  const [editMode, setEditMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Modal States
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PortalResource | null>(null)
  const [defaultCatForNewItem, setDefaultCatForNewItem] = useState<string>('Algemeen')

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategoryOldName, setEditingCategoryOldName] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null)

  const [userCreatedCategories, setUserCreatedCategories] = useState<string[]>([])
  const [removedCategories, setRemovedCategories] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kriko_deleted_categories')
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    }
    return []
  })

  const visibleResources = isGroepsleiding
    ? resources
    : resources.filter(r => (r.category || '').toLowerCase() !== 'groeps')

  const existingCategories = Array.from(new Set(visibleResources.map(r => r.category || 'Algemeen')))
    .filter(c => isGroepsleiding || c.toLowerCase() !== 'groeps')

  const filteredUserCategories = userCreatedCategories
    .filter(c => isGroepsleiding || c.toLowerCase() !== 'groeps')

  const nonGroepsCategories = Array.from(new Set([
    ...DEFAULT_CATEGORIES.filter(c => c.toLowerCase() !== 'groeps'),
    ...existingCategories.filter(c => c.toLowerCase() !== 'groeps'),
    ...filteredUserCategories.filter(c => c.toLowerCase() !== 'groeps'),
  ])).filter(cat => !removedCategories.includes(cat))

  const allCategoriesList = isGroepsleiding
    ? ['Groeps', ...nonGroepsCategories]
    : nonGroepsCategories

  const categoriesMap = allCategoriesList.reduce((acc, cat) => {
    acc[cat] = visibleResources.filter(r => (r.category || 'Algemeen') === cat)
    return acc
  }, {} as Record<string, PortalResource[]>)

  const showEditControls = Boolean(isGroepsleiding && editMode)

  function openNewItemModal(cat?: string) {
    setEditingItem(null)
    setDefaultCatForNewItem(cat || 'Algemeen')
    setItemModalOpen(true)
  }

  function openEditItemModal(item: PortalResource) {
    setEditingItem(item)
    setItemModalOpen(true)
  }

  function openCategoryModal() {
    setEditingCategoryOldName(null)
    setCategoryModalOpen(true)
  }

  function openEditCategoryModal(oldName: string) {
    setEditingCategoryOldName(oldName)
    setCategoryModalOpen(true)
  }

  async function handleSaveItem(formData: Partial<PortalResource>) {
    try {
      const payload = {
        type: editingItem?.type || 'document',
        ...formData,
      }
      let res
      if (editingItem) {
        res = await fetch(`/api/admin/portal-resources/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/portal-resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        setItemModalOpen(false)
        router.refresh()
        const refreshed = await fetch('/api/admin/portal-resources').then(r => r.json()).catch(() => null)
        if (refreshed && Array.isArray(refreshed)) setResources(refreshed)
      }
    } catch (err) {
      console.error(err)
    }
  }

  function requestDeleteItem(item: PortalResource) {
    setConfirmDialog({
      message: `Weet je zeker dat je "${item.label}" wilt verwijderen?`,
      onConfirm: async () => {
        setConfirmDialog(null)
        setDeletingId(item.id)
        try {
          const res = await fetch(`/api/admin/portal-resources/${item.id}`, { method: 'DELETE' })
          if (res.ok) {
            setResources(prev => prev.filter(r => r.id !== item.id))
          }
        } catch (err) {
          console.error(err)
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  async function handleSaveCategory(name: string) {
    if (editingCategoryOldName) {
      const oldName = editingCategoryOldName
      try {
        const res = await fetch('/api/admin/portal-resources/rename-category', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldCategory: oldName, newCategory: name }),
        })
        if (res.ok) {
          setResources(prev => prev.map(r => (r.category || 'Algemeen') === oldName ? { ...r, category: name } : r))
          setUserCreatedCategories(prev => prev.map(c => c === oldName ? name : c))
          setRemovedCategories(prev => {
            const next = Array.from(new Set([...prev, oldName])).filter(c => c !== name)
            try { localStorage.setItem('kriko_deleted_categories', JSON.stringify(next)) } catch {}
            return next
          })
        }
      } catch (err) {
        console.error(err)
      }
    } else {
      if (!allCategoriesList.includes(name)) {
        setUserCreatedCategories(prev => [...prev, name])
      }
      setRemovedCategories(prev => {
        const next = prev.filter(c => c !== name)
        try { localStorage.setItem('kriko_deleted_categories', JSON.stringify(next)) } catch {}
        return next
      })
    }
    setCategoryModalOpen(false)
  }

  async function handleDeleteCategory(name: string) {
    setCategoryModalOpen(false)
    setConfirmDialog({
      message: `Weet je zeker dat je de categorie "${name}" wilt verwijderen? Geassocieerde items worden verplaatst naar "Algemeen".`,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          const res = await fetch('/api/admin/portal-resources/delete-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: name }),
          })
          if (res.ok) {
            setResources(prev => prev.map(r => (r.category || 'Algemeen') === name ? { ...r, category: 'Algemeen' } : r))
            setUserCreatedCategories(prev => prev.filter(c => c !== name))
            setRemovedCategories(prev => {
              const next = Array.from(new Set([...prev, name]))
              try { localStorage.setItem('kriko_deleted_categories', JSON.stringify(next)) } catch {}
              return next
            })
          }
        } catch (err) {
          console.error(err)
        }
      },
    })
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '32px 24px 60px' }}>
      
      {/* Topbar Controls via React Portal into header right side slot */}
      {mounted && isGroepsleiding && typeof document !== 'undefined' && document.getElementById('portaal-topbar-actions') &&
        createPortal(
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: editMode ? '#243B6B' : '#FFFFFF',
                color: editMode ? '#FFFFFF' : '#243B6B',
                border: '1px solid #243B6B',
                fontWeight: 800,
                fontSize: '.84rem',
                cursor: 'pointer',
              }}
            >
              <i className={editMode ? 'fa-solid fa-check' : 'fa-solid fa-pen-to-square'}></i>
              <span>{editMode ? 'Klaar' : 'Bewerken'}</span>
            </button>

            {editMode && (
              <>
                <button
                  onClick={openCategoryModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    color: '#162544',
                    border: '1px solid #CCCCCC',
                    fontWeight: 800,
                    fontSize: '.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-folder-plus"></i>
                  <span>Categorie</span>
                </button>

                <button
                  onClick={() => openNewItemModal()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 8,
                    background: '#243B6B',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '.84rem',
                    cursor: 'pointer',
                  }}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Item</span>
                </button>
              </>
            )}
          </div>,
          document.getElementById('portaal-topbar-actions')!
        )
      }

      {/* CATEGORY SECTIONS: Matching old design in screenshot media_1787305299614.png */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
        {Object.entries(categoriesMap).map(([catName, items]) => {
          const isGroepsSection = catName.toLowerCase() === 'groeps'
          if (items.length === 0 && !showEditControls && !isGroepsSection) return null

          return (
            <div
              key={catName}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                ...(isGroepsSection ? {
                  background: '#CBCBCB',
                  border: '1px solid #B8B8B8',
                  borderRadius: 20,
                  padding: '22px 20px 26px',
                } : {}),
              }}
            >
              
              {/* Category Title: Clean, bold text */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: '#162544',
                  margin: 0,
                  fontFamily: 'var(--font-heading, Nunito, sans-serif)',
                  letterSpacing: '0.01em',
                }}>
                  {catName}
                </h2>

                {showEditControls && !isGroepsSection && (
                  <button
                    onClick={() => openEditCategoryModal(catName)}
                    title="Categorie bewerken"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '.82rem',
                      color: '#243B6B',
                      cursor: 'pointer',
                      fontWeight: 800,
                    }}
                  >
                    <i className="fa-solid fa-gear"></i>
                  </button>
                )}
              </div>

              {/* Items Grid: 4-Column Responsive Grid matching screenshot */}
              {items.length === 0 ? (
                <div style={{ color: '#666666', fontSize: '0.86rem', fontStyle: 'italic' }}>
                  {isGroepsSection
                    ? 'Nog geen documenten of links voor groepsleiding.'
                    : 'Nog geen documenten in deze categorie.'}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 16,
                  width: '100%',
                }}>
                  {items.map((item) => (
                    <ResourceCard
                      key={item.id}
                      item={item}
                      showEditControls={showEditControls}
                      onEdit={openEditItemModal}
                      onDelete={requestDeleteItem}
                      isDeleting={deletingId === item.id}
                    />
                  ))}
                </div>
              )}

              {showEditControls && (
                <button
                  onClick={() => openNewItemModal(catName)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 12,
                    border: '1px dashed #243B6B',
                    background: '#FFFFFF',
                    color: '#243B6B',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Item toevoegen</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {itemModalOpen && (
        <ResourceModal
          item={editingItem}
          categories={allCategoriesList}
          defaultCategory={defaultCatForNewItem}
          onSave={handleSaveItem}
          onClose={() => setItemModalOpen(false)}
        />
      )}

      {categoryModalOpen && (
        <CategoryModal
          oldName={editingCategoryOldName}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}
