'use client'

import { useEffect } from 'react'

export interface ToastState {
  text: string
  type: 'success' | 'error' | 'info'
}

interface Props {
  toast: ToastState | null
  onClose: () => void
  duration?: number
}

export default function PortaalToast({ toast, onClose, duration = 3500 }: Props) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [toast, onClose, duration])

  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div
      className="portaal-toast-notification"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 16,
        zIndex: 99999,
        backgroundColor: isError ? '#7A1C1C' : '#162544',
        color: '#FFFFFF',
        padding: '14px 20px',
        borderRadius: 14,
        border: isError ? '1px solid rgba(255,128,128,0.35)' : '1px solid rgba(147, 197, 253, 0.28)',
        boxShadow: '0 14px 36px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontWeight: 800,
        fontSize: '0.98rem',
        maxWidth: 'min(480px, calc(100vw - 32px))',
        width: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <i
        className={`fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}`}
        style={{
          color: isError ? '#F87171' : '#60A5FA', // Helderblauwe checkmark
          fontSize: '1.35rem',
          flexShrink: 0,
        }}
      />
      <span style={{ lineHeight: 1.35, wordBreak: 'break-word' }}>{toast.text}</span>
    </div>
  )
}
