/**
 * Helper para traduzir mensagens de erro técnicas em mensagens amigáveis
 * em múltiplos idiomas (PT, EN, ES)
 */

import type { Locale } from './i18n/translations'

export interface FriendlyError {
  message: string
  suggestion?: string
  code?: string
}

type ErrorTranslations = {
  message: string
  suggestion?: string
}

type ErrorMessages = Record<string, Record<Locale, ErrorTranslations>>

// Catálogo de mensagens de erro em múltiplos idiomas
const ERROR_CATALOG: ErrorMessages = {
  // Erros de autenticação
  AUTH_INVALID_CREDENTIALS: {
    pt: {
      message: 'E-mail ou senha incorretos.',
      suggestion: 'Verifique seus dados ou use o link mágico para acessar.'
    },
    en: {
      message: 'Incorrect email or password.',
      suggestion: 'Check your credentials or use the magic link to access.'
    },
    es: {
      message: 'Correo o contraseña incorrectos.',
      suggestion: 'Verifica tus datos o usa el enlace mágico para acceder.'
    }
  },
  
  AUTH_EMAIL_NOT_CONFIRMED: {
    pt: {
      message: 'Esta conta ainda não foi confirmada.',
      suggestion: 'Verifique seu e-mail e clique no link de confirmação.'
    },
    en: {
      message: 'This account has not been confirmed yet.',
      suggestion: 'Check your email and click the confirmation link.'
    },
    es: {
      message: 'Esta cuenta aún no ha sido confirmada.',
      suggestion: 'Verifica tu correo y haz clic en el enlace de confirmación.'
    }
  },
  
  AUTH_USER_EXISTS: {
    pt: {
      message: 'Este e-mail já está cadastrado.',
      suggestion: 'Tente fazer login ou use a opção "Esqueci minha senha".'
    },
    en: {
      message: 'This email is already registered.',
      suggestion: 'Try logging in or use "Forgot password".'
    },
    es: {
      message: 'Este correo ya está registrado.',
      suggestion: 'Intenta iniciar sesión o usa "Olvidé mi contraseña".'
    }
  },
  
  AUTH_SIGNUP_DISABLED: {
    pt: {
      message: 'Cadastros temporariamente desabilitados.',
      suggestion: 'Entre em contato com o suporte para mais informações.'
    },
    en: {
      message: 'Signups temporarily disabled.',
      suggestion: 'Contact support for more information.'
    },
    es: {
      message: 'Registros temporalmente deshabilitados.',
      suggestion: 'Contacta con soporte para más información.'
    }
  },
  
  RATE_LIMIT_EXCEEDED: {
    pt: {
      message: 'Muitas tentativas em pouco tempo.',
      suggestion: 'Aguarde alguns minutos e tente novamente.'
    },
    en: {
      message: 'Too many attempts in a short time.',
      suggestion: 'Wait a few minutes and try again.'
    },
    es: {
      message: 'Demasiados intentos en poco tiempo.',
      suggestion: 'Espera unos minutos e inténtalo de nuevo.'
    }
  },
  
  SESSION_EXPIRED: {
    pt: {
      message: 'Sua sessão expirou.',
      suggestion: 'Por favor, faça login novamente para continuar.'
    },
    en: {
      message: 'Your session has expired.',
      suggestion: 'Please log in again to continue.'
    },
    es: {
      message: 'Tu sesión ha expirado.',
      suggestion: 'Por favor, inicia sesión nuevamente para continuar.'
    }
  },
  
  // Erros de validação
  VALIDATION_EMAIL: {
    pt: {
      message: 'E-mail inválido.',
      suggestion: 'Digite um endereço de e-mail válido (exemplo@dominio.com).'
    },
    en: {
      message: 'Invalid email.',
      suggestion: 'Enter a valid email address (example@domain.com).'
    },
    es: {
      message: 'Correo inválido.',
      suggestion: 'Ingresa una dirección de correo válida (ejemplo@dominio.com).'
    }
  },
  
  VALIDATION_PASSWORD_LENGTH: {
    pt: {
      message: 'Senha muito curta.',
      suggestion: 'Sua senha deve ter pelo menos 6 caracteres.'
    },
    en: {
      message: 'Password too short.',
      suggestion: 'Your password must be at least 6 characters long.'
    },
    es: {
      message: 'Contraseña muy corta.',
      suggestion: 'Tu contraseña debe tener al menos 6 caracteres.'
    }
  },
  
  VALIDATION_REQUIRED: {
    pt: {
      message: 'Campos obrigatórios não preenchidos.',
      suggestion: 'Preencha todos os campos marcados como obrigatórios.'
    },
    en: {
      message: 'Required fields not filled.',
      suggestion: 'Fill in all fields marked as required.'
    },
    es: {
      message: 'Campos obligatorios no completados.',
      suggestion: 'Completa todos los campos marcados como obligatorios.'
    }
  },
  
  // Erros de arquivo
  FILE_TOO_LARGE: {
    pt: {
      message: 'Arquivo muito grande.',
      suggestion: 'O arquivo deve ter no máximo 10MB. Tente comprimir ou usar outro arquivo.'
    },
    en: {
      message: 'File too large.',
      suggestion: 'File must be at most 10MB. Try compressing or using another file.'
    },
    es: {
      message: 'Archivo demasiado grande.',
      suggestion: 'El archivo debe tener un máximo de 10MB. Intenta comprimir u usar otro archivo.'
    }
  },
  
  FILE_INVALID_TYPE: {
    pt: {
      message: 'Tipo de arquivo não suportado.',
      suggestion: 'Use apenas arquivos PDF para documentos e PNG/JPG para assinaturas.'
    },
    en: {
      message: 'Unsupported file type.',
      suggestion: 'Use only PDF files for documents and PNG/JPG for signatures.'
    },
    es: {
      message: 'Tipo de archivo no compatible.',
      suggestion: 'Usa solo archivos PDF para documentos y PNG/JPG para firmas.'
    }
  },
  
  STORAGE_ERROR: {
    pt: {
      message: 'Erro ao salvar arquivo.',
      suggestion: 'Verifique sua conexão e tente novamente.'
    },
    en: {
      message: 'Error saving file.',
      suggestion: 'Check your connection and try again.'
    },
    es: {
      message: 'Error al guardar archivo.',
      suggestion: 'Verifica tu conexión e inténtalo de nuevo.'
    }
  },
  
  // Erros de rede
  NETWORK_ERROR: {
    pt: {
      message: 'Erro de conexão.',
      suggestion: 'Verifique sua internet e tente novamente.'
    },
    en: {
      message: 'Connection error.',
      suggestion: 'Check your internet and try again.'
    },
    es: {
      message: 'Error de conexión.',
      suggestion: 'Verifica tu internet e inténtalo de nuevo.'
    }
  },
  
  TIMEOUT: {
    pt: {
      message: 'A operação demorou muito.',
      suggestion: 'O servidor não respondeu a tempo. Tente novamente.'
    },
    en: {
      message: 'Operation took too long.',
      suggestion: 'Server did not respond in time. Try again.'
    },
    es: {
      message: 'La operación tardó demasiado.',
      suggestion: 'El servidor no respondió a tiempo. Inténtalo de nuevo.'
    }
  },
  
  // Erros de permissão
  PERMISSION_DENIED: {
    pt: {
      message: 'Você não tem permissão para esta ação.',
      suggestion: 'Entre em contato com o administrador se precisar de acesso.'
    },
    en: {
      message: 'You do not have permission for this action.',
      suggestion: 'Contact the administrator if you need access.'
    },
    es: {
      message: 'No tienes permiso para esta acción.',
      suggestion: 'Contacta con el administrador si necesitas acceso.'
    }
  },
  
  // Erros genéricos
  SERVER_ERROR: {
    pt: {
      message: 'Erro interno do servidor.',
      suggestion: 'Ocorreu um erro inesperado. Tente novamente em alguns minutos.'
    },
    en: {
      message: 'Internal server error.',
      suggestion: 'An unexpected error occurred. Try again in a few minutes.'
    },
    es: {
      message: 'Error interno del servidor.',
      suggestion: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.'
    }
  },
  
  NOT_FOUND: {
    pt: {
      message: 'Recurso não encontrado.',
      suggestion: 'O item que você procura não existe ou foi removido.'
    },
    en: {
      message: 'Resource not found.',
      suggestion: 'The item you are looking for does not exist or has been removed.'
    },
    es: {
      message: 'Recurso no encontrado.',
      suggestion: 'El elemento que buscas no existe o ha sido eliminado.'
    }
  },
  
  UNKNOWN_ERROR: {
    pt: {
      message: 'Ocorreu um erro inesperado.',
      suggestion: 'Por favor, tente novamente. Se o problema persistir, entre em contato com o suporte.'
    },
    en: {
      message: 'An unexpected error occurred.',
      suggestion: 'Please try again. If the problem persists, contact support.'
    },
    es: {
      message: 'Ocurrió un error inesperado.',
      suggestion: 'Por favor, inténtalo de nuevo. Si el problema persiste, contacta con soporte.'
    }
  },
  
  UNAUTHORIZED: {
    pt: {
      message: 'Por favor, faça login para acessar este recurso.',
      suggestion: 'Você precisa estar autenticado para realizar esta ação.'
    },
    en: {
      message: 'Please log in to access this resource.',
      suggestion: 'You need to be authenticated to perform this action.'
    },
    es: {
      message: 'Por favor, inicia sesión para acceder a este recurso.',
      suggestion: 'Necesitas estar autenticado para realizar esta acción.'
    }
  },
}

/**
 * Detecta o idioma do navegador ou retorna português como padrão
 */
function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'pt'
  
  // Tentar pegar do localStorage primeiro
  const stored = localStorage.getItem('locale')
  if (stored && ['pt', 'en', 'es'].includes(stored)) {
    return stored as Locale
  }
  
  // Detectar do navegador
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('en')) return 'en'
  if (lang.startsWith('es')) return 'es'
  return 'pt' // Padrão
}

/**
 * Identifica o código de erro baseado na mensagem
 */
function identifyErrorCode(error: any): string {
  const errorMessage = error?.message || error?.error_description || String(error)
  const errorCode = error?.code || error?.error || ''

  // Autenticação
  if (errorMessage.includes('Invalid login credentials') || errorCode === '401') {
    return 'AUTH_INVALID_CREDENTIALS'
  }
  if (errorMessage.includes('Email not confirmed') || errorMessage.includes('User not found')) {
    return 'AUTH_EMAIL_NOT_CONFIRMED'
  }
  if (errorMessage.includes('User already registered') || errorCode === '23505') {
    return 'AUTH_USER_EXISTS'
  }
  if (errorMessage.includes('Signups not allowed') || errorMessage.includes('signup disabled')) {
    return 'AUTH_SIGNUP_DISABLED'
  }
  if (errorMessage.includes('Email rate limit exceeded') || errorMessage.includes('too many requests')) {
    return 'RATE_LIMIT_EXCEEDED'
  }
  if (errorMessage.includes('session_not_found') || errorMessage.includes('not authenticated')) {
    return 'SESSION_EXPIRED'
  }

  // Validação
  if (errorMessage.includes('invalid email') || errorMessage.includes('email is not valid')) {
    return 'VALIDATION_EMAIL'
  }
  if (errorMessage.includes('password') && errorMessage.includes('too short')) {
    return 'VALIDATION_PASSWORD_LENGTH'
  }
  if (errorMessage.includes('required') || errorMessage.includes('cannot be null')) {
    return 'VALIDATION_REQUIRED'
  }

  // Arquivo
  if (errorMessage.includes('file size') || errorMessage.includes('payload too large')) {
    return 'FILE_TOO_LARGE'
  }
  if (errorMessage.includes('file type') || errorMessage.includes('invalid format')) {
    return 'FILE_INVALID_TYPE'
  }
  if (errorMessage.includes('storage')) {
    return 'STORAGE_ERROR'
  }

  // Rede
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
    return 'NETWORK_ERROR'
  }
  if (errorMessage.includes('timeout')) {
    return 'TIMEOUT'
  }

  // Permissão
  if (errorCode === '403' || errorMessage.includes('forbidden') || errorMessage.includes('permission denied')) {
    return 'PERMISSION_DENIED'
  }
  if (errorCode === 'UNAUTHORIZED' || errorMessage.includes('UNAUTHORIZED')) {
    return 'UNAUTHORIZED'
  }

  // Genéricos
  if (errorCode === '500' || errorMessage.includes('internal server error')) {
    return 'SERVER_ERROR'
  }
  if (errorCode === '404' || errorMessage.includes('not found')) {
    return 'NOT_FOUND'
  }

  return 'UNKNOWN_ERROR'
}

/**
 * Converte erros técnicos em mensagens amigáveis no idioma especificado
 */
export function getFriendlyErrorMessage(error: any, locale?: Locale): FriendlyError {
  // Se já é uma string simples, retornar diretamente
  if (typeof error === 'string') {
    return { message: error }
  }

  const detectedLocale = locale || detectLocale()
  const errorCode = identifyErrorCode(error)
  
  const translation = ERROR_CATALOG[errorCode]?.[detectedLocale] || 
                      ERROR_CATALOG[errorCode]?.pt || 
                      ERROR_CATALOG.UNKNOWN_ERROR[detectedLocale]

  return {
    message: translation.message,
    suggestion: translation.suggestion,
    code: errorCode
  }
}

/**
 * Formata o erro para exibição ao usuário
 */
export function formatErrorForDisplay(error: any, locale?: Locale): string {
  const friendly = getFriendlyErrorMessage(error, locale)
  
  if (friendly.suggestion) {
    return `${friendly.message} ${friendly.suggestion}`
  }
  
  return friendly.message
}

/**
 * Retorna apenas a mensagem principal sem sugestão
 */
export function getErrorMessage(error: any, locale?: Locale): string {
  return getFriendlyErrorMessage(error, locale).message
}

/**
 * Retorna apenas a sugestão
 */
export function getErrorSuggestion(error: any, locale?: Locale): string | undefined {
  return getFriendlyErrorMessage(error, locale).suggestion
}
