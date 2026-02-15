/**
 * Abrevia um nome completo para proteger privacidade
 * 
 * @example
 * abbreviateName("Alexandre Junio Canuto Lopes") // "Alexandre L."
 * abbreviateName("Maria Silva") // "Maria S."
 * abbreviateName("João") // "João"
 * abbreviateName("") // "Usuário"
 */
export function abbreviateName(fullName: string | null | undefined): string {
  if (!fullName || fullName.trim() === '') return 'Usuário'
  
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  
  // Se só tem um nome, retorna ele
  if (parts.length === 1) return parts[0]
  
  // "Alexandre Junio Canuto Lopes" -> "Alexandre L."
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  const lastInitial = lastName.charAt(0).toUpperCase()
  
  return `${firstName} ${lastInitial}.`
}

/**
 * Gera um nome automático para assinatura baseado no tipo
 * 
 * @example
 * generateSignatureName('draw') // "Desenho - 14/02/2026 21:45"
 * generateSignatureName('upload', 'foto.png') // "foto - 14/02/2026 21:45"
 */
export function generateSignatureName(
  type: 'draw' | 'upload' | 'certified',
  fileName?: string
): string {
  const now = new Date()
  const timestamp = now.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  // Para upload, usar nome do arquivo (sem extensão)
  if (type === 'upload' && fileName) {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
    return `${nameWithoutExt} - ${timestamp}`
  }
  
  const baseNames = {
    draw: 'Desenho',
    upload: 'Importada',
    certified: 'Certificada'
  }
  
  return `${baseNames[type]} - ${timestamp}`
}

/**
 * Obtém informações de display para uma assinatura
 * 
 * @example
 * getSignatureDisplay({ type: 'draw', name: null, created_at: '...' })
 * // { icon: '✍️', name: 'Assinatura desenhada (14/02/2026)', ... }
 */
export function getSignatureDisplay(sig: {
  type?: 'draw' | 'upload' | 'certified' | null
  name?: string | null
  created_at?: string | null
}) {
  const icons = {
    draw: '✍️',
    upload: '📄',
    certified: '🔒'
  }
  
  const typeNames = {
    draw: 'Assinatura desenhada',
    upload: 'Assinatura importada',
    certified: 'Assinatura certificada'
  }
  
  const type = sig.type || 'upload'
  const icon = icons[type]
  const defaultName = typeNames[type]
  
  let date = 'Data desconhecida'
  if (sig.created_at) {
    try {
      date = new Date(sig.created_at).toLocaleDateString('pt-BR')
    } catch {}
  }
  
  return {
    icon,
    name: sig.name || `${defaultName} (${date})`,
    description: `Criada em ${date}`,
    type
  }
}
