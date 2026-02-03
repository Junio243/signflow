'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  CheckSquare,
  Clock3,
  Copy,
  Download,
  FileKey,
  FileSignature,
  FileText,
  Filter,
  Link2,
  Loader2,
  LogIn,
  RefreshCcw,
  Square,
  Timer,
  Trash2,
  User,
  XCircle,
  Zap,
  Sparkles,
  History,
  ShieldCheck,
  PenTool,
} from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'
import { useUserProfile } from '@/hooks/useUserProfile'
import BatchSignModal from '@/components/BatchSignModal'

// ... (resto do código continua igual até a parte do header)

const STATUS_META = {
  signed: {
    label: 'Assinado',
    icon: CheckCircle2,
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  draft: {
    label: 'Rascunho',
    icon: Clock3,
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
  canceled: {
    label: 'Cancelado',
    icon: Ban,
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  expired: {
    label: 'Expirado',
    icon: Timer,
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  default: {
    label: '—',
    icon: FileText,
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
  },
} as const

type StatusKey = keyof typeof STATUS_META
type StatusFilter = 'all' | Exclude<StatusKey, 'default'>

type Doc = {
  id: string
  status: string | null
  created_at: string
  signed_pdf_url: string | null
  qr_code_url: string | null
  original_pdf_name?: string | null
  canceled_at?: string | null
}

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'signed', label: 'Assinados' },
  { value: 'draft', label: 'Rascunhos' },
  { value: 'canceled', label: 'Cancelados' },
  { value: 'expired', label: 'Expirados' },
]

export default function DashboardPage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [isLogged, setIsLogged] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [showBatchSignModal, setShowBatchSignModal] = useState(false)

  const { profile, loading: profileLoading } = useUserProfile()

  const fetchSession = useCallback(async () => {
    if (!supabaseClient) {
      setErrorMsg('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      setIsLogged(false)
      setUserEmail(null)
      return null
    }
    const { data } = await supabaseClient.auth.getSession()
    const session = data?.session ?? null
    setIsLogged(!!session)
    setUserEmail(session?.user?.email ?? null)
    return session
  }, [supabaseClient])

  const fetchDocs = useCallback(async () => {
    setErrorMsg(null)
    if (!supabaseClient) {
      setErrorMsg('Serviço de documentos indisponível')
      return
    }
    let { data, error } = await supabaseClient
      .from('documents')
      .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name, canceled_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      const message = String(error.message || '')
      const missingColumn = message.includes('does not exist') || message.includes('não existe')
      if (missingColumn) {
        const retry = await supabaseClient
          .from('documents')
          .select('id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name, canceled_at')
          .order('created_at', { ascending: false })
          .limit(200)
        data = retry.data
        error = retry.error
      }
    }

    if (error) {
      setErrorMsg(error.message ?? 'Erro ao consultar documentos')
      return
    }

    setDocs((data ?? []) as Doc[])
  }, [])

  useEffect(() => {
    let active = true

    const init = async () => {
      if (!supabaseClient) {
        setLoading(false)
        return
      }

      setLoading(true)

      try {
        await fetchSession()
        if (!active) return

        await fetchDocs()
      } catch (err) {
        if (active) {
          setErrorMsg(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    init()

    const channel = supabaseClient
      ?.channel('realtime-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchDocs())
      .subscribe()

    return () => {
      active = false
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [fetchDocs, fetchSession, supabaseClient])

  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timeout)
  }, [feedback])

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  const toggleSelectAll = () => {
    const draftDocs = filteredDocs.filter(d => (d.status ?? '').toLowerCase() === 'draft')
    if (selectedDocs.length === draftDocs.length && draftDocs.length > 0) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(draftDocs.map(d => d.id))
    }
  }

  const getSelectedDocuments = () => {
    return docs.filter(doc => selectedDocs.includes(doc.id))
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchDocs()
    setLoading(false)
  }

  const handleQuickCreate = async () => {
    if (!supabaseClient) {
      setErrorMsg('Serviço indisponível')
      return
    }
    const { data } = await supabaseClient.auth.getSession()
    if (!data?.session) {
      router.push(`/login?next=${encodeURIComponent('/editor')}`)
      return
    }
    router.push('/editor')
  }

  const handleAdvancedCreate = async () => {
    if (!supabaseClient) {
      setErrorMsg('Serviço indisponível')
      return
    }
    const { data } = await supabaseClient.auth.getSession()
    if (!data?.session) {
      router.push(`/login?next=${encodeURIComponent('/create-document')}`)
      return
    }
    router.push('/create-document')
  }

  const cancelDoc = async (doc: Doc) => {
    if (!isLogged) {
      router.push(`/login?next=${encodeURIComponent('/dashboard')}`)
      return
    }

    const confirmed = window.confirm(
      'Tem certeza que deseja CANCELAR este documento?'
    )
    if (!confirmed) return

    try {
      setActionBusyId(doc.id)
      if (!supabaseClient) {
        setFeedback('Serviço indisponível')
        return
      }
      const { error } = await supabaseClient
        .from('documents')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', doc.id)
      if (error) {
        setFeedback(`Erro: ${error.message}`)
      } else {
        setFeedback('Documento cancelado')
        await fetchDocs()
      }
    } finally {
      setActionBusyId(null)
    }
  }

  const deleteDoc = async (doc: Doc) => {
    if (!isLogged) {
      router.push(`/login?next=${encodeURIComponent('/dashboard')}`)
      return
    }

    const confirmed = window.confirm(
      '🗑️ Tem certeza que deseja DELETAR permanentemente este documento?'
    )
    if (!confirmed) return

    try {
      setActionBusyId(doc.id)
      
      const response = await fetch(`/api/documents/delete?id=${doc.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        setFeedback(`Erro: ${result.error}`)
        return
      }

      setFeedback('✅ Deletado')
      await fetchDocs()
    } catch (error) {
      setFeedback(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`)
    } finally {
      setActionBusyId(null)
    }
  }

  const handleCopyLink = async (docId: string) => {
    const url = `${window.location.origin}/validate/${docId}`
    try {
      await navigator.clipboard.writeText(url)
      setFeedback('Link copiado')
    } catch (err) {
      setFeedback('Não foi possível copiar')
    }
  }

  const filteredDocs = useMemo(() => {
    const normalizedFilter = statusFilter === 'all' ? null : statusFilter
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return docs.filter(doc => {
      const status = (doc.status ?? '').toLowerCase() as StatusKey
      const matchesStatus = normalizedFilter ? status === normalizedFilter : true

      if (!matchesStatus) return false
      if (!normalizedSearch) return true

      const idMatch = doc.id.toLowerCase().includes(normalizedSearch)
      const nameMatch = (doc.original_pdf_name ?? '').toLowerCase().includes(normalizedSearch)
      const statusMatch = status.includes(normalizedSearch)
      return idMatch || nameMatch || statusMatch
    })
  }, [docs, searchTerm, statusFilter])

  const totalsByStatus = useMemo(() => {
    return docs.reduce(
      (acc, doc) => {
        const status = (doc.status ?? 'default').toLowerCase() as StatusKey
        acc.total += 1
        if (status in acc) acc[status as Exclude<StatusKey, 'default'>] += 1
        return acc
      },
      { total: 0, signed: 0, draft: 0, canceled: 0, expired: 0 } as Record<'total' | Exclude<StatusKey, 'default'>, number>,
    )
  }, [docs])

  const statusOptions = useMemo(() => STATUS_FILTERS, [])

  if (!supabaseClient) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h1 className="text-xl font-semibold">Dashboard indisponível</h1>
        <p>Configure as variáveis de ambiente</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Acompanhe documentos, status de assinatura e ações rápidas.</p>
          {isLogged && (
            <div className="mt-2 space-y-1">
              {profileLoading ? (
                <p className="text-xs text-slate-400">Carregando perfil...</p>
              ) : profile ? (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    👋 Olá, {profile.full_name || 'Usuário'}!
                  </p>
                  <p className="text-xs text-slate-400">✉️ {userEmail}</p>
                </>
              ) : (
                <p className="text-xs text-slate-400">✉️ {userEmail}</p>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isLogged && (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                title="Editar meu perfil"
              >
                <User className="h-4 w-4" />
                Perfil
              </Link>
              
              <Link
                href="/certificates"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                title="Gerenciar certificados digitais"
              >
                <FileKey className="h-4 w-4" />
                Certificados
              </Link>

              <Link
                href="/sign"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-100"
                title="Assinar documento PDF"
              >
                <PenTool className="h-4 w-4" />
                Assinar
              </Link>

              <Link
                href="/history"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                title="Histórico de assinaturas"
              >
                <History className="h-4 w-4" />
                Histórico
              </Link>

              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                title="Verificar assinatura"
              >
                <ShieldCheck className="h-4 w-4" />
                Verificar
              </Link>
            </>
          )}

          {selectedDocs.length > 0 && (
            <button
              onClick={() => setShowBatchSignModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              <FileSignature className="h-4 w-4" />
              Assinar {selectedDocs.length}
            </button>
          )}

          <button
            type="button"
            onClick={handleQuickCreate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            title="Criação rápida"
          >
            <Zap className="h-4 w-4" />
            Rápida
          </button>

          <button
            type="button"
            onClick={handleAdvancedCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-brand-700 hover:to-brand-800"
            title="Criação avançada"
          >
            <Sparkles className="h-4 w-4" />
            Avançada
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600"
          >
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </header>

      {!isLogged && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Você não está autenticado</p>
            <button
              type="button"
              onClick={() => router.push(`/login?next=${encodeURIComponent('/dashboard')}`)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-amber-700"
            >
              <LogIn className="h-4 w-4" />
              Fazer login
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          {feedback}
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold">Erro</p>
              <p className="mt-1 text-rose-700/80">{errorMsg}</p>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Documentos"
          value={totalsByStatus.total}
          description="Total cadastrados"
          icon={<FileText className="h-5 w-5 text-brand-600" />}
        />
        <StatCard
          title="Assinados"
          value={totalsByStatus.signed}
          description="Disponíveis"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        />
        <StatCard
          title="Rascunhos"
          value={totalsByStatus.draft}
          description="Pendentes"
          icon={<Clock3 className="h-5 w-5 text-slate-600" />}
        />
        <StatCard
          title="Cancelados"
          value={totalsByStatus.canceled + totalsByStatus.expired}
          description="Indisponíveis"
          icon={<XCircle className="h-5 w-5 text-rose-600" />}
        />
      </section>

      {/* Resto da página continua igual... (tabela de documentos) */}
      
      {showBatchSignModal && (
        <BatchSignModal
          selectedDocuments={getSelectedDocuments()}
          onClose={() => {
            setShowBatchSignModal(false)
            setSelectedDocs([])
          }}
          onSuccess={() => {
            fetchDocs()
            setSelectedDocs([])
          }}
        />
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: number
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  )
}
