'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface ContentItem {
  page?: string
  section?: string
  title?: string
  content?: string
  image_url?: string
}

interface EditContextType {
  isGroepsleiding: boolean
  isEditMode: boolean
  setIsEditMode: (active: boolean) => void
  pendingUpdates: Record<string, ContentItem>
  getContent: (key: string, field: 'title' | 'content' | 'image_url', fallback: string) => string
  setDraftContent: (key: string, data: ContentItem) => void
  saveAll: () => Promise<boolean>
  discardAll: () => void
  isSaving: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  hasChanges: boolean
  errorMessage: string | null
}

const EditContext = createContext<EditContextType | null>(null)

function SearchParamsSync({ onSync }: { onSync: (isEditParam: boolean) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const editQuery = searchParams.get('edit') === 'true'
    onSync(editQuery)
  }, [searchParams, onSync])
  return null
}

export function EditProvider({
  initialContent = {},
  children,
}: {
  initialContent?: Record<string, { title?: string; content?: string; image_url?: string }>
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [isGroepsleiding, setIsGroepsleiding] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [liveContent, setLiveContent] = useState<Record<string, { title?: string; content?: string; image_url?: string }>>(initialContent)
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, ContentItem>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Sync initial server content
  useEffect(() => {
    setLiveContent(prev => ({ ...initialContent, ...prev }))
  }, [initialContent])

  const handleSyncParams = useCallback((editQuery: boolean) => {
    if (editQuery) {
      try {
        sessionStorage.setItem('kriko_edit_mode', 'true')
      } catch {}
    }

    const storedEdit = Boolean(
      typeof window !== 'undefined' &&
      (sessionStorage.getItem('kriko_edit_mode') === 'true' || localStorage.getItem('kriko_edit_mode') === 'true')
    )
    const active = editQuery || storedEdit

    if (typeof window === 'undefined') return

    // 0. If edit mode is NOT requested (?edit=true or active edit session), exit immediately (0 API calls)
    if (!active) {
      setIsEditMode(false)
      return
    }

    // 1. If visitor has no auth token cookie at all, skip network call completely
    const hasAuthCookie = document.cookie.includes('-auth-token')
    if (!hasAuthCookie) {
      setIsGroepsleiding(false)
      setIsEditMode(false)
      try {
        sessionStorage.removeItem('kriko_is_gl')
        sessionStorage.removeItem('kriko_edit_mode')
      } catch {}
      return
    }

    // 2. If we already verified groepsleiding status in this browser session, reuse cached result
    const cachedGL = sessionStorage.getItem('kriko_is_gl')
    if (cachedGL !== null) {
      const isGL = cachedGL === 'true'
      setIsGroepsleiding(isGL)
      setIsEditMode(isGL && active)
      return
    }

    // 3. Otherwise, fetch once and cache the result in sessionStorage for the rest of the session
    fetch('/api/admin/check-groepsleiding')
      .then(res => res.json())
      .then(data => {
        const isGL = Boolean(data.isGroepsleiding)
        try {
          sessionStorage.setItem('kriko_is_gl', isGL ? 'true' : 'false')
        } catch {}
        setIsGroepsleiding(isGL)
        setIsEditMode(isGL && active)
      })
      .catch(() => {
        setIsGroepsleiding(false)
        setIsEditMode(false)
      })
  }, [])

  const setDraftContent = useCallback((key: string, data: ContentItem) => {
    setPendingUpdates(prev => {
      const existing = prev[key] || {}
      return {
        ...prev,
        [key]: {
          ...existing,
          ...data,
        },
      }
    })

    // Also update live view in real-time
    setLiveContent(prev => {
      const existing = prev[key] || {}
      return {
        ...prev,
        [key]: {
          ...existing,
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.content !== undefined ? { content: data.content } : {}),
          ...(data.image_url !== undefined ? { image_url: data.image_url } : {}),
        },
      }
    })

    setSaveStatus('idle')
  }, [])

  const getContent = useCallback(
    (key: string, field: 'title' | 'content' | 'image_url', fallback: string): string => {
      const pending = pendingUpdates[key]
      if (pending && pending[field] !== undefined) {
        return pending[field] || fallback
      }
      const live = liveContent[key]
      if (live && live[field] !== undefined && live[field] !== null && live[field] !== '') {
        return live[field] || fallback
      }
      return fallback
    },
    [liveContent, pendingUpdates]
  )

  const saveAll = async (): Promise<boolean> => {
    const keysCount = Object.keys(pendingUpdates).length
    if (keysCount === 0) {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
      return true
    }

    setIsSaving(true)
    setSaveStatus('saving')
    setErrorMessage(null)

    try {
      const res = await fetch('/api/admin/site-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: pendingUpdates }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Opslaan mislukt.')
      }

      setPendingUpdates({})
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
      router.refresh()
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Fout bij opslaan'
      setSaveStatus('error')
      setErrorMessage(msg)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const discardAll = useCallback(() => {
    setPendingUpdates({})
    setLiveContent(initialContent)
    setSaveStatus('idle')
    setErrorMessage(null)
  }, [initialContent])

  const handleSetEditMode = (active: boolean) => {
    setIsEditMode(active)
    if (active) {
      try {
        sessionStorage.setItem('kriko_edit_mode', 'true')
      } catch {}
    } else {
      discardAll()
      try {
        sessionStorage.removeItem('kriko_edit_mode')
        localStorage.removeItem('kriko_edit_mode')
      } catch {}
      router.push(pathname)
    }
  }

  const hasChanges = Object.keys(pendingUpdates).length > 0

  return (
    <EditContext.Provider
      value={{
        isGroepsleiding,
        isEditMode: isGroepsleiding && isEditMode,
        setIsEditMode: handleSetEditMode,
        pendingUpdates,
        getContent,
        setDraftContent,
        saveAll,
        discardAll,
        isSaving,
        saveStatus,
        hasChanges,
        errorMessage,
      }}
    >
      <Suspense fallback={null}>
        <SearchParamsSync onSync={handleSyncParams} />
      </Suspense>
      {children}
    </EditContext.Provider>
  )
}

export function useEditMode() {
  const ctx = useContext(EditContext)
  if (!ctx) {
    return {
      isGroepsleiding: false,
      isEditMode: false,
      setIsEditMode: () => {},
      pendingUpdates: {},
      getContent: (_key: string, _field: string, fallback: string) => fallback,
      setDraftContent: () => {},
      saveAll: async () => false,
      discardAll: () => {},
      isSaving: false,
      saveStatus: 'idle' as const,
      hasChanges: false,
      errorMessage: null,
    }
  }
  return ctx
}
