/**
 * Sistema de Internacionalização (i18n) do SignFlow
 * Suporta: Português (PT), Inglês (EN) e Espanhol (ES)
 */

export type Locale = 'pt' | 'en' | 'es'

export const SUPPORTED_LOCALES: Locale[] = ['pt', 'en', 'es']

export const LOCALE_NAMES: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
}

export type TranslationKeys = {
  // Header/Navigation
  nav: {
    dashboard: string
    contact: string
    howItWorks: string
    security: string
    pricing: string
    support: string
    signIn: string
    signUp: string
    signOut: string
    myProfile: string
    certificates: string
    sign: string
    history: string
    verify: string
    organizations: string
    settings: string
  }
  
  // Common
  common: {
    loading: string
    error: string
    success: string
    save: string
    cancel: string
    delete: string
    edit: string
    back: string
    next: string
    submit: string
    optional: string
    required: string
    email: string
    password: string
    name: string
    phone: string
  }
  
  // Auth
  auth: {
    loginTitle: string
    loginSubtitle: string
    signupTitle: string
    signupSubtitle: string
    forgotPassword: string
    rememberMe: string
    noAccount: string
    hasAccount: string
    magicLink: string
    createAccount: string
  }
  
  // Pricing
  pricing: {
    title: string
    subtitle: string
    monthly: string
    annually: string
    perMonth: string
    perYear: string
    freePlan: string
    proPlan: string
    businessPlan: string
    enterprisePlan: string
    currentPlan: string
    upgrade: string
    selectPlan: string
    popular: string
    contactSales: string
  }
  
  // Features
  features: {
    unlimitedSignatures: string
    advancedSecurity: string
    prioritySupport: string
    api: string
    customBranding: string
    teams: string
    sso: string
    audit: string
  }
  
  // Footer
  footer: {
    rights: string
    privacy: string
    terms: string
    about: string
    docs: string
  }
}

export const translations: Record<Locale, TranslationKeys> = {
  pt: {
    nav: {
      dashboard: 'Dashboard',
      contact: 'Contato',
      howItWorks: 'Como Funciona',
      security: 'Segurança',
      pricing: 'Preços',
      support: 'Suporte/Ajuda',
      signIn: 'Entrar',
      signUp: 'Criar conta',
      signOut: 'Sair',
      myProfile: 'Meu perfil',
      certificates: 'Certificados',
      sign: 'Assinar',
      history: 'Histórico',
      verify: 'Verificar',
      organizations: 'Organizações',
      settings: 'Configurações',
    },
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      back: 'Voltar',
      next: 'Próximo',
      submit: 'Enviar',
      optional: 'opcional',
      required: 'obrigatório',
      email: 'E-mail',
      password: 'Senha',
      name: 'Nome',
      phone: 'Telefone',
    },
    auth: {
      loginTitle: 'Acesse sua conta',
      loginSubtitle: 'Entre para gerenciar seus documentos e assinaturas',
      signupTitle: 'Crie sua conta grátis',
      signupSubtitle: 'Comece a assinar documentos digitalmente',
      forgotPassword: 'Esqueceu a senha?',
      rememberMe: 'Lembrar de mim',
      noAccount: 'Não tem conta?',
      hasAccount: 'Já tem conta?',
      magicLink: 'Receber link mágico por e-mail',
      createAccount: 'Criar conta',
    },
    pricing: {
      title: 'Planos e Preços',
      subtitle: 'Escolha o plano ideal para suas necessidades',
      monthly: 'Mensal',
      annually: 'Anual',
      perMonth: '/mês',
      perYear: '/ano',
      freePlan: 'Grátis',
      proPlan: 'Profissional',
      businessPlan: 'Empresarial',
      enterprisePlan: 'Enterprise',
      currentPlan: 'Plano atual',
      upgrade: 'Fazer upgrade',
      selectPlan: 'Selecionar plano',
      popular: 'Mais popular',
      contactSales: 'Falar com vendas',
    },
    features: {
      unlimitedSignatures: 'Assinaturas ilimitadas',
      advancedSecurity: 'Segurança avançada',
      prioritySupport: 'Suporte prioritário',
      api: 'Acesso à API',
      customBranding: 'Marca personalizada',
      teams: 'Equipes e permissões',
      sso: 'SSO e integrações',
      audit: 'Auditoria completa',
    },
    footer: {
      rights: 'Todos os direitos reservados',
      privacy: 'Privacidade',
      terms: 'Termos de Uso',
      about: 'Sobre',
      docs: 'Documentação',
    },
  },
  
  en: {
    nav: {
      dashboard: 'Dashboard',
      contact: 'Contact',
      howItWorks: 'How It Works',
      security: 'Security',
      pricing: 'Pricing',
      support: 'Support/Help',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      myProfile: 'My Profile',
      certificates: 'Certificates',
      sign: 'Sign',
      history: 'History',
      verify: 'Verify',
      organizations: 'Organizations',
      settings: 'Settings',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      optional: 'optional',
      required: 'required',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      phone: 'Phone',
    },
    auth: {
      loginTitle: 'Access your account',
      loginSubtitle: 'Sign in to manage your documents and signatures',
      signupTitle: 'Create your free account',
      signupSubtitle: 'Start signing documents digitally',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      magicLink: 'Receive magic link by email',
      createAccount: 'Create account',
    },
    pricing: {
      title: 'Plans & Pricing',
      subtitle: 'Choose the perfect plan for your needs',
      monthly: 'Monthly',
      annually: 'Annually',
      perMonth: '/month',
      perYear: '/year',
      freePlan: 'Free',
      proPlan: 'Professional',
      businessPlan: 'Business',
      enterprisePlan: 'Enterprise',
      currentPlan: 'Current plan',
      upgrade: 'Upgrade',
      selectPlan: 'Select plan',
      popular: 'Most popular',
      contactSales: 'Contact sales',
    },
    features: {
      unlimitedSignatures: 'Unlimited signatures',
      advancedSecurity: 'Advanced security',
      prioritySupport: 'Priority support',
      api: 'API access',
      customBranding: 'Custom branding',
      teams: 'Teams & permissions',
      sso: 'SSO & integrations',
      audit: 'Complete audit',
    },
    footer: {
      rights: 'All rights reserved',
      privacy: 'Privacy',
      terms: 'Terms of Service',
      about: 'About',
      docs: 'Documentation',
    },
  },
  
  es: {
    nav: {
      dashboard: 'Panel',
      contact: 'Contacto',
      howItWorks: 'Cómo Funciona',
      security: 'Seguridad',
      pricing: 'Precios',
      support: 'Soporte/Ayuda',
      signIn: 'Iniciar sesión',
      signUp: 'Crear cuenta',
      signOut: 'Cerrar sesión',
      myProfile: 'Mi perfil',
      certificates: 'Certificados',
      sign: 'Firmar',
      history: 'Historial',
      verify: 'Verificar',
      organizations: 'Organizaciones',
      settings: 'Configuración',
    },
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      back: 'Volver',
      next: 'Siguiente',
      submit: 'Enviar',
      optional: 'opcional',
      required: 'requerido',
      email: 'Correo electrónico',
      password: 'Contraseña',
      name: 'Nombre',
      phone: 'Teléfono',
    },
    auth: {
      loginTitle: 'Accede a tu cuenta',
      loginSubtitle: 'Inicia sesión para administrar tus documentos y firmas',
      signupTitle: 'Crea tu cuenta gratis',
      signupSubtitle: 'Comienza a firmar documentos digitalmente',
      forgotPassword: '¿Olvidaste tu contraseña?',
      rememberMe: 'Recuérdame',
      noAccount: '¿No tienes cuenta?',
      hasAccount: '¿Ya tienes cuenta?',
      magicLink: 'Recibir enlace mágico por correo',
      createAccount: 'Crear cuenta',
    },
    pricing: {
      title: 'Planes y Precios',
      subtitle: 'Elige el plan perfecto para tus necesidades',
      monthly: 'Mensual',
      annually: 'Anual',
      perMonth: '/mes',
      perYear: '/año',
      freePlan: 'Gratis',
      proPlan: 'Profesional',
      businessPlan: 'Empresarial',
      enterprisePlan: 'Enterprise',
      currentPlan: 'Plan actual',
      upgrade: 'Actualizar',
      selectPlan: 'Seleccionar plan',
      popular: 'Más popular',
      contactSales: 'Contactar ventas',
    },
    features: {
      unlimitedSignatures: 'Firmas ilimitadas',
      advancedSecurity: 'Seguridad avanzada',
      prioritySupport: 'Soporte prioritario',
      api: 'Acceso a API',
      customBranding: 'Marca personalizada',
      teams: 'Equipos y permisos',
      sso: 'SSO e integraciones',
      audit: 'Auditoría completa',
    },
    footer: {
      rights: 'Todos los derechos reservados',
      privacy: 'Privacidad',
      terms: 'Términos de Uso',
      about: 'Acerca de',
      docs: 'Documentación',
    },
  },
}

/**
 * Hook para obter traduções
 */
export function useTranslations(locale: Locale = 'pt'): TranslationKeys {
  return translations[locale] || translations.pt
}

/**
 * Função helper para obter tradução
 */
export function t(locale: Locale, key: string): string {
  const keys = key.split('.')
  let value: any = translations[locale] || translations.pt
  
  for (const k of keys) {
    value = value?.[k]
    if (value === undefined) break
  }
  
  return value || key
}
