import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { CertificateProfile } from '@/types/certificates'

export function useProfiles() {
  const [profiles, setProfiles] = useState<CertificateProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfiles = useCallback(async () => {
    if (!supabase) {
      setError('Supabase não configurado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('certificate_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setProfiles((data || []) as CertificateProfile[])
    } catch (err) {
      console.error('Erro ao buscar perfis:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const createProfile = async (payload: {
    profile_name: string
    profile_type: string
    cpf_cnpj?: string
    organization?: string
    registration_number?: string
    is_default?: boolean
  }) => {
    if (!supabase) throw new Error('Supabase não configurado')

    try {
      // Pegar token de autenticação
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar perfil')
      }

      await fetchProfiles() // Recarregar lista
      return { success: true, profile: result.profile }
    } catch (err) {
      throw err
    }
  }

  const deleteProfile = async (profileId: string) => {
    if (!supabase) throw new Error('Supabase não configurado')

    try {
      const { error: deleteError } = await supabase
        .from('certificate_profiles')
        .delete()
        .eq('id', profileId)

      if (deleteError) throw deleteError

      await fetchProfiles() // Recarregar lista
      return { success: true }
    } catch (err) {
      throw err
    }
  }

  const setDefaultProfile = async (profileId: string) => {
    if (!supabase) throw new Error('Supabase não configurado')

    try {
      // O trigger do banco vai desmarcar os outros automaticamente
      const { error: updateError } = await supabase
        .from('certificate_profiles')
        .update({ is_default: true })
        .eq('id', profileId)

      if (updateError) throw updateError

      await fetchProfiles() // Recarregar lista
      return { success: true }
    } catch (err) {
      throw err
    }
  }

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
    createProfile,
    deleteProfile,
    setDefaultProfile,
  }
}
