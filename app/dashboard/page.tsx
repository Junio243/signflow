'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  FileText,
  Filter,
  Link2,
  Loader2,
  LogIn,
  RefreshCcw,
  Timer,
  Trash2,
  User,
  XCircle,
  Zap,
  Sparkles,
} from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'
import { useUserProfile } from '@/hooks/useUserProfile'

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

  // Hook do perfil do usuário
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
      setErrorMsg('Serviço de documentos indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
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
      setErrorMsg(error.message ?? 'Erro desconhecido ao consultar documentos.')
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

  const handleRefresh = async () => {
    setLoading(true)
    await fetchDocs()
    setLoading(false)
  }

  const handleQuickCreate = async () => {
    if (!supabaseClient) {
      setErrorMsg('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
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
      setErrorMsg('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
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
      'Tem certeza que deseja CANCELAR este documento? Ele passará a ser inválido para validação pública.',
    )
    if (!confirmed) return

    try {
      setActionBusyId(doc.id)
      if (!supabaseClient) {
        setFeedback('Serviço de documentos indisponível. Configure as variáveis de ambiente.')
        return
      }
      const { error } = await supabaseClient
        .from('documents')
        .update({ status: 'canceled', canceled_at: new Date().toISOString() })
        .eq('id', doc.id)
      if (error) {
        setFeedback(`Erro ao cancelar: ${error.message}`)
      } else {
        setFeedback('Documento cancelado com sucesso.')
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
      '🗑️ Tem certeza que deseja DELETAR permanentemente este documento?\n\nEsta ação não pode ser desfeita!',
    )
    if (!confirmed) return

    try {
      setActionBusyId(doc.id)
      
      const response = await fetch(`/api/documents/delete?id=${doc.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        setFeedback(`Erro ao deletar: ${result.error || 'Erro desconhecido'}`)
        return
      }

      setFeedback('✅ Documento deletado com sucesso!')
      await fetchDocs()
    } catch (error) {
      setFeedback(`Erro ao deletar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setActionBusyId(null)
    }
  }

  const handleCopyLink = async (docId: string) => {
    const url = `${window.location.origin}/validate/${docId}`
    try {
      await navigator.clipboard.writeText(url)
      setFeedback('Link de validação copiado.')
    } catch (err) {
      setFeedback('Não foi possível copiar automaticamente. Utilize o botão "Validar" e copie manualmente.')
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
        <p>Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para acessar os documentos.</p>
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
          {/* Botão de Perfil */}
          {isLogged && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              title="Editar meu perfil"
            >
              <User className="h-4 w-4" aria-hidden />
              Perfil
            </Link>
          )}

          {/* Quick Create Button */}
          <button
            type="button"
            onClick={handleQuickCreate}
            className="group relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            title="Criação rápida: ideal para documentos simples"
          >
            <Zap className="h-4 w-4" aria-hidden />
            Criação Rápida
          </button>

          {/* Advanced Create Button with NEW badge */}
          <button
            type="button"
            onClick={handleAdvancedCreate}
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md hover:from-brand-700 hover:to-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
            title="Criação avançada: configure certificado, QR Code e múltiplos signatários"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Criação Avançada
            <span className="absolute -right-1 -top-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 shadow-sm">
              NOVO
            </span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Atualizar
          </button>
        </div>
      </header>

      {!isLogged && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Você ainda não está autenticado.</p>
            <p className="mt-1 text-amber-700/80">
              Entre para criar, assinar ou cancelar documentos. O acesso é protegido com Supabase Auth.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/login?next=${encodeURIComponent('/dashboard')}`)}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
            >
              <LogIn className="h-4 w-4" aria-hidden />
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
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Não foi possível listar os documentos agora.</p>
              <p className="mt-1 text-rose-700/80">{errorMsg}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:border-rose-400"
              >
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Documentos"
          value={totalsByStatus.total}
          description="Total cadastrados"
          icon={<FileText className="h-5 w-5 text-brand-600" aria-hidden />}
        />
        <StatCard
          title="Assinados"
          value={totalsByStatus.signed}
          description="Disponíveis para validação"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />}
        />
        <StatCard
          title="Rascunhos"
          value={totalsByStatus.draft}
          description="Pendentes de assinatura"
          icon={<Clock3 className="h-5 w-5 text-slate-600" aria-hidden />}
        />
        <StatCard
          title="Cancelados / Expirados"
          value={totalsByStatus.canceled + totalsByStatus.expired}
          description="Indisponíveis"
          icon={<XCircle className="h-5 w-5 text-rose-600" aria-hidden />}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Filter className="h-4 w-4" aria-hidden />
            Filtros rápidos
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    statusFilter === option.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="relative block text-xs text-slate-400">
              <span className="sr-only">Buscar documento</span>
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="Buscar por ID, nome ou status"
              />
              <SearchIcon />
            </label>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-semibold">ID</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Nome</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Criado em</th>
                <th scope="col" className="px-4 py-3 text-left font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600" aria-hidden />
                    <p className="mt-2 text-sm">Carregando documentos…</p>
                  </td>
                </tr>
              )}

              {!loading && filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    <p className="font-medium">Nenhum documento encontrado com os filtros aplicados.</p>
                    <p className="mt-2 text-sm">Altere os filtros ou crie um novo documento.</p>
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleQuickCreate}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow hover:bg-slate-50"
                      >
                        <Zap className="h-4 w-4" aria-hidden />
                        Criação Rápida
                      </button>
                      <button
                        type="button"
                        onClick={handleAdvancedCreate}
                        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden />
                        Criação Avançada
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredDocs.map(doc => {
                  const statusKey = (doc.status ?? 'default').toLowerCase() as StatusKey
                  const meta = STATUS_META[statusKey] ?? STATUS_META.default
                  const Icon = meta.icon
                  const canDelete = ['draft', 'canceled', 'expired'].includes(statusKey)
                  
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{doc.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-slate-700">{doc.original_pdf_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.badge}`}>
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/validate/${doc.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
                          >
                            <Link2 className="h-3.5 w-3.5" aria-hidden />
                            Validar
                          </Link>
                          {doc.signed_pdf_url ? (
                            <a
                              href={doc.signed_pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
                            >
                              <Download className="h-3.5 w-3.5" aria-hidden />
                              Baixar
                            </a>
                          ) : (
                            <span className="rounded-lg border border-dashed border-slate-200 px-2.5 py-1.5 text-xs text-slate-400">
                              Sem PDF
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(doc.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden />
                            Copiar link
                          </button>
                          {(doc.status ?? '').toLowerCase() !== 'canceled' && (
                            <button
                              type="button"
                              onClick={() => cancelDoc(doc)}
                              disabled={actionBusyId === doc.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Ban className="h-3.5 w-3.5" aria-hidden />
                              {actionBusyId === doc.id ? 'Cancelando…' : 'Cancelar'}
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => deleteDoc(doc)}
                              disabled={actionBusyId === doc.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-400 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Deletar documento permanentemente"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              {actionBusyId === doc.id ? 'Deletando…' : 'Deletar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function formatDate(value: string) {
  try {
    const date = new Date(value)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch (error) {
    return value
  }
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

function SearchIcon() {
  return <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
}
