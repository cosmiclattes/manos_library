"use client"

import * as React from "react"

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block">{children}</div>
}

const DropdownMenuTrigger = ({
  children,
  onClick
}: {
  children: React.ReactNode
  onClick?: () => void
}) => {
  return <div onClick={onClick}>{children}</div>
}

const DropdownMenuContent = ({
  children,
  open,
  onClose
}: {
  children: React.ReactNode
  open: boolean
  onClose: () => void
}) => {
  React.useEffect(() => {
    if (open) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        if (!target.closest('[data-dropdown-content]')) {
          onClose()
        }
      }
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      data-dropdown-content
      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
    >
      <div className="py-1" role="menu">
        {children}
      </div>
    </div>
  )
}

const DropdownMenuItem = ({
  children,
  onClick
}: {
  children: React.ReactNode
  onClick?: () => void
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-2"
      role="menuitem"
    >
      {children}
    </button>
  )
}

const DropdownMenuSeparator = () => {
  return <div className="h-px my-1 bg-gray-200" />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
