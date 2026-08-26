'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useEditMode } from './EditContext'

interface EditableTextProps {
  blockKey: string
  page: string
  section?: string
  field?: 'title' | 'content'
  defaultValue?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'strong' | 'em' | 'a' | 'button' | 'li' | 'code'
  className?: string
  style?: React.CSSProperties
  multiline?: boolean
  href?: string
  target?: string
  rel?: string
  children?: React.ReactNode
}

export default function EditableText({
  blockKey,
  page,
  section = 'general',
  field = 'content',
  defaultValue = '',
  as: Component = 'span',
  className = '',
  style = {},
  multiline = false,
  href,
  target,
  rel,
  children,
}: EditableTextProps) {
  const { isEditMode, getContent, setDraftContent } = useEditMode()
  const fallback = typeof children === 'string' && children.trim().length > 0 ? children : defaultValue
  const currentText = getContent(blockKey, field, fallback)

  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const textRef = useRef<HTMLElement | null>(null)

  // Keep DOM innerText in sync if value changed externally while NOT focused
  useEffect(() => {
    if (textRef.current && !isFocused) {
      if (textRef.current.innerText !== currentText) {
        textRef.current.innerText = currentText
      }
    }
  }, [currentText, isFocused])

  // Normal visitor mode
  if (!isEditMode) {
    const rawContent = currentText || children
    const formattedContent =
      typeof rawContent === 'string'
        ? rawContent.replace(/Kriko-M/gi, (match) => match.replace('-', '\u2011'))
        : rawContent

    if (Component === 'a') {
      return (
        <a href={href} target={target} rel={rel} className={className} style={style}>
          {formattedContent}
        </a>
      )
    }
    const Tag = Component as React.ElementType
    return (
      <Tag className={className} style={style}>
        {formattedContent}
      </Tag>
    )
  }

  // Live Edit Mode (Groepsleiding)
  function handleInput(e: React.FormEvent<HTMLElement>) {
    const newText = (e.currentTarget.innerText || '').trimEnd()
    setDraftContent(blockKey, {
      page,
      section,
      [field]: newText,
    })
  }

  function handleBlur(e: React.FocusEvent<HTMLElement>) {
    setIsFocused(false)
    const newText = (e.currentTarget.innerText || '').trimEnd()
    setDraftContent(blockKey, {
      page,
      section,
      [field]: newText,
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault()
      e.currentTarget.blur()
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation()
  }

  const Tag = Component as React.ElementType

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        textRef.current = el
        if (el && !isFocused && !el.innerText && currentText) {
          el.innerText = currentText
        }
      }}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Klik om direct te typen"
      className={`editable-live-text ${className}`}
      style={{
        ...style,
        outline: isFocused
          ? '2px solid #243B6B'
          : isHovered
          ? '1.5px dashed #C9963A'
          : '1px dashed rgba(36, 59, 107, 0.25)',
        outlineOffset: 3,
        borderRadius: 4,
        cursor: 'text',
        backgroundColor: isFocused
          ? 'rgba(36, 59, 107, 0.05)'
          : isHovered
          ? 'rgba(201, 150, 58, 0.06)'
          : 'transparent',
        transition: 'all 0.15s ease',
        minWidth: '1em',
        display: style?.display || (Component === 'span' || Component === 'strong' || Component === 'em' ? 'inline' : 'block'),
      }}
    />
  )
}
