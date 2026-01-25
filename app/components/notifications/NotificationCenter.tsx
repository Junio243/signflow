'use client'

import { X, Check, Trash2, Settings, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/notifications/types'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  isOpen: boolean
  onClose: () => void
  userId: string
}

export default function NotificationCenter({ isOpen, onClose, userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen, filter])

  const loadNotifications = async () => {
    setLoading(true)
    const supabase = createClient()
    
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (filter === 'unread') {
      query = query.is('read_at', null)
    }
    
    const { data } = await query
    setNotifications(data || [])
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
    
    loadNotifications()
  }

  const markAllAsRead = async () => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
    
    loadNotifications()
  }

  const deleteNotification = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    loadNotifications()
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Marcar como lida
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }
    
    // Abrir URL se existir
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed right-4 top-16 w-96 max-h-[600px] bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Notificações</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Não lidas
          </button>
          
          {notifications.some(n => !n.read_at) && (
            <button
              onClick={markAllAsRead}
              className="ml-auto px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
            >
              <Check size={16} />
              Marcar todas
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {filter === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                    !notification.read_at ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Unread Indicator */}
                    {!notification.read_at && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${
                          !notification.read_at ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        
                        {notification.action_url && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <ExternalLink size={12} />
                            {notification.action_label || 'Ver mais'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <a
            href="/settings/notifications"
            className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Settings size={16} />
            Configurações de notificação
          </a>
        </div>
      </div>
    </>
  )
}
