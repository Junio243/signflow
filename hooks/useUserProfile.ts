// hooks/useUserProfile.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { Database } from '@/lib/types'

type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        // Buscar usuário autenticado
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setProfile(null)
          return
        }

        // Buscar perfil do usuário
        const { data, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          // Se não existe perfil, criar um novo
          if (profileError.code === 'PGRST116') {
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                full_name: user.user_metadata?.full_name || 'Usuário',
              })
              .select()
              .single()

            if (insertError) {
              setError(insertError.message)
            } else {
              setProfile(newProfile)
            }
          } else {
            setError(profileError.message)
          }
        } else {
          setProfile(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar perfil')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !profile) return { error: 'Perfil não carregado' }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', profile.id)

    if (updateError) {
      return { error: updateError.message }
    }

    // Atualizar estado local
    setProfile({ ...profile, ...updates })
    return { error: null }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
  }
}
