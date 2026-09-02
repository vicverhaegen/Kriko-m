'use client'

import { useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import EditBlockModal, { BlockType } from './EditBlockModal'
import { useEditMode } from './EditContext'

interface Props {
  blockKey: string
  page: string
  section: string
  blockType?: BlockType
  initialTitle?: string
  initialContent?: string
  initialImageUrl?: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function EditableBlock({
  blockKey,
  page,
  section,
  blockType,
  initialTitle = '',
  initialContent = '',
  initialImageUrl = '',
  children,
  className = '',
  style = {},
}: Props) {
  const router = useRouter()
  const { isGroepsleiding, isEditMode } = useEditMode()
  const [isHovered, setIsHovered] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const canEdit = isGroepsleiding && isEditMode

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      style={{
        position: 'relative',
        outline: canEdit && isHovered ? '2px dashed #243B6B' : 'none',
        outlineOffset: 4,
        borderRadius: 8,
        transition: 'outline 0.15s ease',
        ...style,
      }}
    >
      {canEdit && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsModalOpen(true)
          }}
          type="button"
          title={`Bewerken: ${blockKey}`}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 999,
            backgroundColor: '#162544',
            color: '#FFFFFF',
            border: '1.5px solid #243B6B',
            borderRadius: '50%',
            width: 38,
            height: 38,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(22, 37, 68, 0.4)',
            opacity: isHovered ? 1 : 0.85,
            transition: 'all 0.15s ease',
          }}
        >
          ✏️
        </button>
      )}

      {children}

      {isModalOpen && (
        <EditBlockModal
          blockKey={blockKey}
          page={page}
          section={section}
          blockType={blockType}
          initialTitle={initialTitle}
          initialContent={initialContent}
          initialImageUrl={initialImageUrl}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
