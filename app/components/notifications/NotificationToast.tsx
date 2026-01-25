'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import type { Notification } from '@/lib/notifications/types'

interface Props {
  notification: Notification
  onClose: () => void
  duration?: number
}

export default function NotificationToast({ notification, onClose, duration = 5000 }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setIsVisible(true), 10)

    // Auto-close
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  const getIcon = () => {
    const priority = notification.priority || 'normal'
    
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="text-red-500" size={20} />
      case 'high':
        return <AlertTriangle className="text-orange-500" size={20} />
      case 'low':
        return <Info className="text-blue-500" size={20} />
      default:
        return <CheckCircle2 className="text-green-500" size={20} />
    }
  }

  const getColorClasses = () => {
    const priority = notification.priority || 'normal'
    
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50'
      case 'high':
        return 'border-l-orange-500 bg-orange-50'
      case 'low':
        return 'border-l-blue-500 bg-blue-50'
      default:
        return 'border-l-green-500 bg-white'
    }
  }

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div
        className={`
          ${getColorClasses()}
          border-l-4 rounded-lg shadow-lg p-4 flex gap-3 items-start
        `}
      >
        {/* Ícone */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            {notification.title}
          </h4>
          <p className="text-gray-600 text-sm line-clamp-2">
            {notification.message}
          </p>
          
          {notification.action_url && notification.action_label && (
            <a
              href={notification.action_url}
              className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              onClick={handleClose}
            >
              {notification.action_label} →
            </a>
          )}
        </div>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-gray-200/50 rounded transition-colors"
          aria-label="Fechar"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>
    </div>
  )
}
