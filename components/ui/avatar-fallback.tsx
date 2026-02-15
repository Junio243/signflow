'use client'

import { useState } from 'react'
import Image from 'next/image'
import { User } from 'lucide-react'

interface AvatarFallbackProps {
  /** URL da imagem/logo (pode ser vazio) */
  src?: string | null
  /** Nome para gerar iniciais */
  name: string
  /** Texto alternativo */
  alt?: string
  /** Tamanho (px) */
  size?: number
  /** Forma (circular ou quadrada) */
  shape?: 'circle' | 'square'
  /** Classe CSS adicional */
  className?: string
}

/**
 * Gera cor baseada no nome (consistente)
 */
function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // green
    '#06B6D4', // cyan
    '#6366F1', // indigo
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Extrai iniciais do nome (máx 2 letras)
 */
function getInitials(name: string): string {
  if (!name) return '?'
  
  const words = name.trim().split(/\s+/)
  
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  
  return (
    words[0].charAt(0).toUpperCase() +
    words[words.length - 1].charAt(0).toUpperCase()
  )
}

/**
 * Componente de Avatar com Fallback Automático
 * 
 * Tenta exibir a imagem fornecida. Se falhar, gera um avatar
 * com as iniciais do nome em uma cor consistente.
 * 
 * @example
 * ```tsx
 * // Com logo
 * <AvatarFallback src="https://example.com/logo.png" name="João Silva" />
 * 
 * // Sem logo (gera iniciais)
 * <AvatarFallback name="João Silva" />
 * 
 * // Custom
 * <AvatarFallback 
 *   name="Maria Santos" 
 *   size={64} 
 *   shape="square"
 *   className="border-2"
 * />
 * ```
 */
export function AvatarFallback({
  src,
  name,
  alt,
  size = 40,
  shape = 'circle',
  className = '',
}: AvatarFallbackProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Se não tem src ou deu erro, mostrar fallback
  const showFallback = !src || imageError

  // Gerar avatar com iniciais
  const initials = getInitials(name)
  const bgColor = stringToColor(name)

  // Classes CSS
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg'
  const containerClass = `relative inline-flex items-center justify-center ${shapeClass} ${className}`

  if (showFallback) {
    // Fallback: Avatar com iniciais
    return (
      <div
        className={containerClass}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
        }}
        title={name}
      >
        <span
          className="font-semibold text-white select-none"
          style={{
            fontSize: size * 0.4,
            lineHeight: 1,
          }}
        >
          {initials}
        </span>
      </div>
    )
  }

  // Tentar carregar imagem
  return (
    <div className={containerClass} style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt || `Logo de ${name}`}
        width={size}
        height={size}
        className={`${shapeClass} object-cover`}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoading(false)}
        unoptimized={src.includes('placehold.co') || src.includes('ui-avatars.com')}
      />
      
      {/* Loading placeholder */}
      {imageLoading && (
        <div
          className={`absolute inset-0 ${shapeClass} bg-gray-200 animate-pulse`}
        />
      )}
    </div>
  )
}

/**
 * Avatar com ícone de usuário (fallback genérico)
 */
export function UserAvatar({
  size = 40,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gray-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <User className="text-gray-500" size={size * 0.6} />
    </div>
  )
}

/**
 * Gera URL de avatar via UI Avatars (fallback externo)
 * 
 * @param name Nome da pessoa
 * @param size Tamanho (px)
 * @param bgColor Cor de fundo (hex sem #)
 * @returns URL do avatar gerado
 */
export function getUIAvatarURL(
  name: string,
  size: number = 128,
  bgColor?: string
): string {
  const initials = encodeURIComponent(getInitials(name))
  const color = bgColor || stringToColor(name).replace('#', '')
  
  return `https://ui-avatars.com/api/?name=${initials}&size=${size}&background=${color}&color=fff&bold=true&format=svg`
}

/**
 * Hook para usar avatar com fallback automático
 */
export function useAvatarFallback(src?: string | null, name?: string) {
  const [error, setError] = useState(false)
  
  const avatarSrc = src && !error ? src : name ? getUIAvatarURL(name) : null
  
  return {
    src: avatarSrc,
    onError: () => setError(true),
    fallbackInitials: name ? getInitials(name) : '?',
    fallbackColor: name ? stringToColor(name) : '#888',
  }
}

export default AvatarFallback
