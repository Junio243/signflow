import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  Building2,
  FileCheck2,
  FileSignature,
  Lock,
  Radar,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Workflow,
} from 'lucide-react'

export type CompanyLogo = {
  name: string
  src: string
  alt: string
  width: number
  height: number
}

export type TrustSeal = {
  title: string
  description: string
  src?: string
  icon?: LucideIcon
}

export type Benefit = {
  title: string
  description: string
  icon: LucideIcon
}

export type FeatureStory = {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  stats: string[]
}

export type Metric = {
  value: string
  label: string
}

export const companyLogos: CompanyLogo[] = [
  {
    name: 'Banco do Brasil',
    src: '/logos/banco-do-brasil.png',
    alt: 'Logo do Banco do Brasil',
    width: 170,
    height: 56,
  },
  {
    name: 'Magazine Luiza',
    src: '/logos/magazine-luiza.png',
    alt: 'Logo do Magazine Luiza',
    width: 170,
    height: 56,
  },
  {
    name: 'Hospital Israelita Albert Einstein',
    src: '/logos/hospital-einstein.png',
    alt: 'Logo do Hospital Israelita Albert Einstein',
    width: 170,
    height: 56,
  },
  {
    name: 'Gov.br',
    src: '/logos/govbr.png',
    alt: 'Logo do Gov.br',
    width: 170,
    height: 56,
  },
]

export const trustSeals: TrustSeal[] = [
  {
    title: 'ICP-Brasil',
    description: 'Assinatura digital com aderencia ao ecossistema brasileiro de certificados.',
    src: '/seals/icp-brasil.svg',
  },
  {
    title: 'ITI',
    description: 'Referencias institucionais ligadas ao ecossistema de certificacao digital.',
    src: '/seals/iti.svg',
  },
  {
    title: 'LGPD',
    description: 'Fluxos desenhados para privacidade, rastreabilidade e tratamento adequado dos dados.',
    icon: ShieldCheck,
  },
  {
    title: 'Validade juridica',
    description: 'Documentos com trilha de auditoria, integridade e validacao publica.',
    src: '/seals/assinatura-qualificada.jpg',
  },
]

export const heroMetrics: Metric[] = [
  { value: '1M+', label: 'documentos assinados' },
  { value: '50K+', label: 'usuarios ativos' },
  { value: '99,9%', label: 'uptime da plataforma' },
]

export const benefits: Benefit[] = [
  {
    title: 'Agilidade operacional para equipes',
    description: 'Envie, acompanhe e conclua assinaturas com menos atrito entre solicitante, aprovador e signatario.',
    icon: TimerReset,
  },
  {
    title: 'Seguranca juridica no centro do produto',
    description: 'Cada etapa comunica integridade do documento, identidade do signatario e lastro de auditoria.',
    icon: ShieldCheck,
  },
  {
    title: 'Controle do processo ponta a ponta',
    description: 'Centralize templates, historico, status, validacao e operacoes recorrentes em um unico ambiente.',
    icon: Workflow,
  },
  {
    title: 'Experiencia clara para empresas',
    description: 'Interface feita para times juridicos, operacionais, financeiros e comerciais trabalharem com seguranca.',
    icon: Building2,
  },
]

export const featureStories: FeatureStory[] = [
  {
    eyebrow: 'Fluxo guiado',
    title: 'Envie um documento e acompanhe cada assinatura com visibilidade real.',
    description:
      'O SignFlow organiza os documentos em uma jornada simples: upload, definicao dos participantes, assinatura e validacao final.',
    bullets: [
      'Upload de PDFs e configuracao de signatarios em poucos passos',
      'Acompanhamento do status de cada etapa com historico consolidado',
      'Experiencia preparada para operacoes pontuais ou recorrentes',
    ],
    stats: ['Upload seguro', 'Fluxo multiassinatura', 'Status rastreavel'],
  },
  {
    eyebrow: 'Validacao publica',
    title: 'Cada documento finalizado nasce pronto para ser validado e auditado.',
    description:
      'A proposta nao termina na assinatura. O produto reforca confianca com QR Code, hash, historico e checagens publicas de autenticidade.',
    bullets: [
      'Validacao acessivel por link publico e QR Code',
      'Trilha de auditoria com eventos importantes do documento',
      'Camada visual de legitimidade para reduzir duvidas do destinatario',
    ],
    stats: ['QR Code no PDF', 'Hash auditavel', 'Relatorio verificavel'],
  },
  {
    eyebrow: 'Escalabilidade',
    title: 'Estrutura pronta para times, integracoes e crescimento institucional.',
    description:
      'A home deve refletir que o SignFlow nao e uma ferramenta isolada, mas uma base profissional para processos digitais de assinatura.',
    bullets: [
      'API, webhooks e perfis de operacao para diferentes contextos',
      'Controles de certificados, historico e organizacoes no mesmo ecossistema',
      'Narrativa visual mais proxima de plataforma SaaS madura do que de ferramenta generica',
    ],
    stats: ['API pronta', 'Organizacoes', 'Controle centralizado'],
  },
]

export const complianceItems = [
  {
    title: 'Trilha de auditoria',
    description: 'Registro de eventos para apoiar compliance, verificacao e rastreabilidade documental.',
    icon: Radar,
  },
  {
    title: 'Integridade do arquivo',
    description: 'Hash, validacao e conferencia publica para reduzir contestacao e aumentar confianca.',
    icon: FileCheck2,
  },
  {
    title: 'Assinatura com lastro juridico',
    description: 'Narrativa e experiencia voltadas a documentos com contexto profissional e exigencia institucional.',
    icon: FileSignature,
  },
  {
    title: 'Controles de seguranca',
    description: 'Camadas visuais e tecnicas para privacidade, acesso e protecao da operacao.',
    icon: Lock,
  },
]

export const institutionalPillars = [
  'Plataforma brasileira para assinatura e validacao digital de documentos',
  'Foco em confianca institucional, leitura clara e reducao de friccao',
  'Experiencia preparada para empresas, operacoes internas e fluxos externos',
]

export const finalCtas = [
  {
    href: '/signup',
    label: 'Criar conta gratuita',
    primary: true,
  },
  {
    href: '/contato',
    label: 'Falar com vendas',
    primary: false,
  },
]

export const trustHighlights = [
  {
    title: 'Empresas que confiam',
    description: 'Logos reais e organizados em uma faixa de credibilidade logo apos a proposta de valor.',
    icon: BadgeCheck,
  },
  {
    title: 'Posicionamento institucional',
    description: 'Tom visual e textual mais proximo de plataforma confiavel do que de landing promocional genérica.',
    icon: Sparkles,
  },
]
