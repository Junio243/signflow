'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Bell, Mail, Smartphone, MessageSquare, Check } from 'lucide-react'
import type { NotificationPreferences } from '@/lib/notifications/types'

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    if (!supabase) return
    
    setLoading(true)
    
    // Pegar usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/login'
      return
    }
    
    setUserId(user.id)
    
    // Buscar preferências
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (data) {
      setPreferences(data)
    } else {
      // Preferências padrão
      setPreferences({
        user_id: user.id,
        email_enabled: true,
        in_app_enabled: true,
        push_enabled: false,
        sms_enabled: false,
        document_ready: true,
        signature_received: true,
        document_expiring: true,
        document_expired: true,
        signature_request: true,
        validation_viewed: false,
        system_update: true,
      })
    }
    
    setLoading(false)
  }

  const savePreferences = async () => {
    if (!supabase || !userId || !preferences) return
    
    setSaving(true)
    
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({ ...preferences, user_id: userId })
    
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    
    setSaving(false)
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return
    setPreferences({ ...preferences, [key]: value })
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) return null

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Bell className="text-blue-600" />
          Configurações de Notificações
        </h1>
        <p className="text-gray-600 mt-2">
          Escolha como e quando você quer receber notificações do SignFlow
        </p>
      </div>

      {/* Canais de Notificação */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Smartphone size={20} />
          Canais de Notificação
        </h2>
        
        <div className="space-y-4">
          <ToggleOption
            icon={<Bell size={18} />}
            title="Notificações no App"
            description="Veja notificações dentro do SignFlow"
            enabled={preferences.in_app_enabled}
            onChange={(val) => updatePreference('in_app_enabled', val)}
          />
          
          <ToggleOption
            icon={<Mail size={18} />}
            title="Email"
            description="Receba notificações importantes por email"
            enabled={preferences.email_enabled}
            onChange={(val) => updatePreference('email_enabled', val)}
          />
          
          <ToggleOption
            icon={<Smartphone size={18} />}
            title="Push Notifications"
            description="Notificações no navegador (em breve)"
            enabled={preferences.push_enabled}
            onChange={(val) => updatePreference('push_enabled', val)}
            disabled
          />
          
          <ToggleOption
            icon={<MessageSquare size={18} />}
            title="SMS"
            description="Receba alertas urgentes por SMS (em breve)"
            enabled={preferences.sms_enabled}
            onChange={(val) => updatePreference('sms_enabled', val)}
            disabled
          />
        </div>
      </section>

      {/* Tipos de Notificação */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Tipos de Notificação</h2>
        
        <div className="space-y-4">
          <ToggleOption
            title="Documento pronto"
            description="Quando seu documento estiver pronto para assinar"
            enabled={preferences.document_ready}
            onChange={(val) => updatePreference('document_ready', val)}
          />
          
          <ToggleOption
            title="Assinatura recebida"
            description="Quando alguém assinar um documento seu"
            enabled={preferences.signature_received}
            onChange={(val) => updatePreference('signature_received', val)}
          />
          
          <ToggleOption
            title="Documento expirando"
            description="Lembrete quando um documento está perto de expirar"
            enabled={preferences.document_expiring}
            onChange={(val) => updatePreference('document_expiring', val)}
          />
          
          <ToggleOption
            title="Documento expirado"
            description="Quando um documento expirou sem ser assinado"
            enabled={preferences.document_expired}
            onChange={(val) => updatePreference('document_expired', val)}
          />
          
          <ToggleOption
            title="Solicitação de assinatura"
            description="Quando alguém solicitar sua assinatura"
            enabled={preferences.signature_request}
            onChange={(val) => updatePreference('signature_request', val)}
          />
          
          <ToggleOption
            title="Validação visualizada"
            description="Quando alguém verificar a autenticidade de um documento"
            enabled={preferences.validation_viewed}
            onChange={(val) => updatePreference('validation_viewed', val)}
          />
          
          <ToggleOption
            title="Atualizações do sistema"
            description="Novos recursos e melhorias do SignFlow"
            enabled={preferences.system_update}
            onChange={(val) => updatePreference('system_update', val)}
          />
        </div>
      </section>

      {/* Botão Salvar */}
      <div className="flex justify-end gap-3">
        {saved && (
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <Check size={20} />
            Salvo com sucesso!
          </div>
        )}
        
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>
    </div>
  )
}

function ToggleOption({
  icon,
  title,
  description,
  enabled,
  onChange,
  disabled = false,
}: {
  icon?: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="flex gap-3 flex-1">
        {icon && <div className="text-gray-500 mt-1">{icon}</div>}
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
          {disabled && (
            <span className="text-xs text-orange-600 mt-1 inline-block">
              Em breve
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          disabled
            ? 'bg-gray-200 cursor-not-allowed'
            : enabled
            ? 'bg-blue-600'
            : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
