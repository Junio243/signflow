'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, FileText, Loader2, Plus } from 'lucide-react'

import { supabase } from '@/lib/supabaseClient'

type Doc = { id: string; title?: string | null; status?: string | null; created_at?: string | null }

const formatDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed)
  } catch (error) {
    console.warn('Não foi possível formatar a data do documento.', error)
    return parsed.toLocaleString()
  }
}

const getStatusStyle = (status: string) => {
  const normalized = status.toLowerCase()
  if (normalized.includes('assin')) return 'bg-emerald-50 text-emerald-600'
  if (normalized.includes('pend') || normalized.includes('process')) return 'bg-amber-50 text-amber-600'
  return 'bg-slate-100 text-slate-600'
}

const getStatusLabel = (status: string) => {
  const trimmed = status.trim()
  if (!trimmed) return 'Sem status'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export default function DashboardPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [docs, setDocs] = useState<Doc[]>([])
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error(sessionError)
          setInfo('Não foi possível validar sua sessão agora. Tente novamente em instantes.')
          return
        }

        if (!sessionData?.session) {
          router.replace('/login')
          return
        }

        const { data, error } = await supabase
          .from('documents')
          .select('id,title,status,created_at')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error(error)
          setInfo('Seu acesso está OK, mas não consegui listar documentos agora.')
          return
        }

        setDocs(data || [])
      } catch (error) {
        console.error(error)
        setInfo('Não foi possível conectar ao Supabase. Verifique as variáveis de ambiente e tente novamente.')
      } finally {
        setChecking(false)
      }
    }

    run()
  }, [router])

  const inProgressCount = useMemo(
    () => docs.filter(doc => (doc.status || '').toLowerCase().includes('pend')).length,
    [docs]
  )

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border bg-white px-5 py-3 text-slate-600 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
          <span>Carregando seu dashboard…</span>
        </div>
      </main>
    )
  }

  const lastDoc = docs[0]

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <header className="rounded-3xl border bg-white px-6 py-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-400">SignFlow</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Bem-vindo ao seu painel</h1>
              <p className="mt-2 max-w-xl text-slate-600">
                Acompanhe os documentos enviados, monitore o status das assinaturas e volte rapidamente ao editor.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/editor"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-sky-700"
              >
                <Plus className="h-4 w-4" />
                Novo documento
              </Link>
              <Link
                href="/validate/demo"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Ver validação
              </Link>
            </div>
          </div>
        </header>

        {info && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p className="text-sm leading-relaxed">{info}</p>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Documentos carregados</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{docs.length}</p>
            <p className="mt-1 text-xs text-slate-400">Últimos 50 documentos mais recentes.</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Último envio</p>
            <p className="mt-2 text-lg font-medium text-slate-900">
              {lastDoc?.created_at ? formatDate(lastDoc.created_at) : 'Ainda sem uploads'}
            </p>
            <p className="mt-1 text-xs text-slate-400">Atualizado em tempo real após novos envios.</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Em andamento</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{inProgressCount}</p>
            <p className="mt-1 text-xs text-slate-400">Documentos marcados como pendentes ou em processamento.</p>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Últimos documentos</h2>
            {docs.length > 0 && (
              <Link
                href="/editor"
                className="text-sm font-medium text-sky-600 transition hover:text-sky-700"
              >
                Enviar novo PDF
              </Link>
            )}
          </div>

          {docs.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-white px-10 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">Nenhum documento por aqui ainda</h3>
              <p className="mt-2 text-sm text-slate-500">
                Faça upload do seu primeiro PDF e acompanhe o status da assinatura por aqui.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-sky-700"
                >
                  <Plus className="h-4 w-4" />
                  Enviar PDF
                </Link>
                <Link
                  href="/validate/demo"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Ver exemplo de validação
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {docs.map(doc => (
                <article
                  key={doc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-sky-100 p-2 text-sky-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {doc.title?.trim() || 'Documento sem título'}
                        </h3>
                        <p className="text-sm text-slate-500">
                          ID: <span className="font-mono text-xs text-slate-500">{doc.id}</span>
                        </p>
                        {doc.created_at && (
                          <p className="mt-1 text-xs text-slate-400">Criado em {formatDate(doc.created_at)}</p>
                        )}
                      </div>
                    </div>
                    {doc.status && (
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(doc.status)}`}>
                        {getStatusLabel(doc.status)}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
