/**
 * Helper para traduzir mensagens de erro técnicas em mensagens amigáveis
 * em português para o usuário final.
 */

export interface FriendlyError {
  message: string
  suggestion?: string
  code?: string
}

/**
 * Converte erros técnicos em mensagens amigáveis
 */
export function getFriendlyErrorMessage(error: any): FriendlyError {
  // Se já é uma string simples, retornar diretamente
  if (typeof error === 'string') {
    return { message: error }
  }

  const errorMessage = error?.message || error?.error_description || String(error)
  const errorCode = error?.code || error?.error || ''

  // Erros de autenticação
  if (errorMessage.includes('Invalid login credentials') || errorCode === '401') {
    return {
      message: 'E-mail ou senha incorretos.',
      suggestion: 'Verifique seus dados ou use o link mágico para acessar.',
      code: 'AUTH_INVALID_CREDENTIALS'
    }
  }

  if (errorMessage.includes('Email not confirmed') || errorMessage.includes('User not found')) {
    return {
      message: 'Esta conta ainda não foi confirmada.',
      suggestion: 'Verifique seu e-mail e clique no link de confirmação.',
      code: 'AUTH_EMAIL_NOT_CONFIRMED'
    }
  }

  if (errorMessage.includes('User already registered') || errorCode === '23505') {
    return {
      message: 'Este e-mail já está cadastrado.',
      suggestion: 'Tente fazer login ou use a opção "Esqueci minha senha".',
      code: 'AUTH_USER_EXISTS'
    }
  }

  if (errorMessage.includes('Signups not allowed') || errorMessage.includes('signup disabled')) {
    return {
      message: 'Cadastros temporariamente desabilitados.',
      suggestion: 'Entre em contato com o suporte para mais informações.',
      code: 'AUTH_SIGNUP_DISABLED'
    }
  }

  if (errorMessage.includes('Email rate limit exceeded') || errorMessage.includes('too many requests')) {
    return {
      message: 'Muitas tentativas em pouco tempo.',
      suggestion: 'Aguarde alguns minutos e tente novamente.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  }

  if (errorMessage.includes('session_not_found') || errorMessage.includes('not authenticated')) {
    return {
      message: 'Sua sessão expirou.',
      suggestion: 'Por favor, faça login novamente para continuar.',
      code: 'SESSION_EXPIRED'
    }
  }

  // Erros de validação
  if (errorMessage.includes('invalid email') || errorMessage.includes('email is not valid')) {
    return {
      message: 'E-mail inválido.',
      suggestion: 'Digite um endereço de e-mail válido (exemplo@dominio.com).',
      code: 'VALIDATION_EMAIL'
    }
  }

  if (errorMessage.includes('password') && errorMessage.includes('too short')) {
    return {
      message: 'Senha muito curta.',
      suggestion: 'Sua senha deve ter pelo menos 6 caracteres.',
      code: 'VALIDATION_PASSWORD_LENGTH'
    }
  }

  if (errorMessage.includes('required') || errorMessage.includes('cannot be null')) {
    return {
      message: 'Campos obrigatórios não preenchidos.',
      suggestion: 'Preencha todos os campos marcados como obrigatórios.',
      code: 'VALIDATION_REQUIRED'
    }
  }

  // Erros de arquivo/upload
  if (errorMessage.includes('file size') || errorMessage.includes('payload too large')) {
    return {
      message: 'Arquivo muito grande.',
      suggestion: 'O arquivo deve ter no máximo 10MB. Tente comprimir ou usar outro arquivo.',
      code: 'FILE_TOO_LARGE'
    }
  }

  if (errorMessage.includes('file type') || errorMessage.includes('invalid format')) {
    return {
      message: 'Tipo de arquivo não suportado.',
      suggestion: 'Use apenas arquivos PDF para documentos e PNG/JPG para assinaturas.',
      code: 'FILE_INVALID_TYPE'
    }
  }

  if (errorMessage.includes('storage')) {
    return {
      message: 'Erro ao salvar arquivo.',
      suggestion: 'Verifique sua conexão e tente novamente.',
      code: 'STORAGE_ERROR'
    }
  }

  // Erros de banco de dados
  if (errorCode === '23503') {
    return {
      message: 'Erro de referência no banco de dados.',
      suggestion: 'Alguns dados necessários não foram encontrados. Recarregue a página.',
      code: 'DATABASE_FOREIGN_KEY'
    }
  }

  if (errorCode === '23502') {
    return {
      message: 'Dados incompletos.',
      suggestion: 'Alguns campos obrigatórios estão faltando. Preencha todos os dados.',
      code: 'DATABASE_NOT_NULL'
    }
  }

  if (errorMessage.includes('unique constraint') || errorCode === '23505') {
    return {
      message: 'Este registro já existe.',
      suggestion: 'Já existe um registro com estes dados. Verifique e tente novamente.',
      code: 'DATABASE_UNIQUE'
    }
  }

  // Erros de rede
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
    return {
      message: 'Erro de conexão.',
      suggestion: 'Verifique sua internet e tente novamente.',
      code: 'NETWORK_ERROR'
    }
  }

  if (errorMessage.includes('timeout')) {
    return {
      message: 'A operação demorou muito.',
      suggestion: 'O servidor não respondeu a tempo. Tente novamente.',
      code: 'TIMEOUT'
    }
  }

  // Erros de permissão
  if (errorCode === '403' || errorMessage.includes('forbidden') || errorMessage.includes('permission denied')) {
    return {
      message: 'Você não tem permissão para esta ação.',
      suggestion: 'Entre em contato com o administrador se precisar de acesso.',
      code: 'PERMISSION_DENIED'
    }
  }

  // Erros genéricos
  if (errorCode === '500' || errorMessage.includes('internal server error')) {
    return {
      message: 'Erro interno do servidor.',
      suggestion: 'Ocorreu um erro inesperado. Tente novamente em alguns minutos.',
      code: 'SERVER_ERROR'
    }
  }

  if (errorCode === '404' || errorMessage.includes('not found')) {
    return {
      message: 'Recurso não encontrado.',
      suggestion: 'O item que você procura não existe ou foi removido.',
      code: 'NOT_FOUND'
    }
  }

  // Se não identificou o erro, retornar mensagem genérica
  return {
    message: 'Ocorreu um erro inesperado.',
    suggestion: 'Por favor, tente novamente. Se o problema persistir, entre em contato com o suporte.',
    code: 'UNKNOWN_ERROR'
  }
}

/**
 * Formata o erro para exibição ao usuário
 */
export function formatErrorForDisplay(error: any): string {
  const friendly = getFriendlyErrorMessage(error)
  
  if (friendly.suggestion) {
    return `${friendly.message} ${friendly.suggestion}`
  }
  
  return friendly.message
}

/**
 * Retorna apenas a mensagem principal sem sugestão
 */
export function getErrorMessage(error: any): string {
  return getFriendlyErrorMessage(error).message
}

/**
 * Retorna apenas a sugestão
 */
export function getErrorSuggestion(error: any): string | undefined {
  return getFriendlyErrorMessage(error).suggestion
}
