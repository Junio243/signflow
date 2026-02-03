'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { History, ArrowLeft, Download, Eye, FileText, Calendar, Shield, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Signature {
  id: string
  original_document_name: string
  signed_document_path: string
  document_hash: string
  signature_type: string
  signature_data: any
  signed_at: string
  status: string
  certificate_id: string
  certificates: {
    certificate_name: string
    issuer: string
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const [isLogged, setIsLogged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [loadingSignatures, setLoadingSignatures] = useState(true)
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isLogged) {
      fetchSignatures()
    }
  }, [isLogged, filter])

  const checkAuth = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    if (!data?.session) {
      router.push('/login?next=/history')
      return
    }

    setIsLogged(true)
    setLoading(false)
  }

  const fetchSignatures = async () => {
    if (!supabase) return

    try {
      setLoadingSignatures(true)
      
      let query = supabase
        .from('signatures')
        .select(`
          *,
          certificates (
            certificate_name,
            issuer
          )
        `)
        .order('signed_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setSignatures(data || [])
    } catch (err) {
      console.error('Erro ao buscar assinaturas:', err)
    } finally {
      setLoadingSignatures(false)
    }
  }

  const handleDownload = async (signature: Signature) => {
    if (!supabase) return

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(signature.signed_document_path, 3600)

      if (error) throw error
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (err) {
      console.error('Erro ao baixar documento:', err)
      alert('Erro ao baixar documento')
    }
  }

  const getSignatureTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      visual: 'Visual',
      digital: 'Digital',
      both: 'Visual + Digital',
    }
    return types[type] || type
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Concluído' },
      failed: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Falhou' },
      processing: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Processando' },
    }
    const style = styles[status] || styles.completed
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>
        {status === 'completed' && <CheckCircle className="h-3 w-3" />}
        {style.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!isLogged) return null

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-2.5">
            <History className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Histórico de Assinaturas</h1>
            <p className="text-sm text-slate-500">Todos os documentos que você assinou</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      {/* Filtros */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <span className="text-sm font-medium text-slate-700">Filtrar por:</span>
        <div className="flex gap-2">
          {['all', 'completed', 'failed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                filter === f
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              ].join(' ')}
            >
              {f === 'all' ? 'Todos' : f === 'completed' ? 'Concluídos' : 'Falhos'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de assinaturas */}
      {loadingSignatures ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : signatures.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhuma assinatura encontrada</h3>
          <p className="text-sm text-slate-500 mb-4">Você ainda não assinou nenhum documento</p>
          <Link
            href="/sign"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Assinar Documento
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <h3 className="text-base font-semibold text-slate-900 truncate">
                      {sig.original_document_name}
                    </h3>
                    {getStatusBadge(sig.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        {format(new Date(sig.signed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span>{sig.certificates?.certificate_name || 'Certificado'}</span>
                    </div>

                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Tipo:</span> {getSignatureTypeLabel(sig.signature_type)}
                    </div>

                    {sig.signature_data?.signerName && (
                      <div className="text-sm text-slate-600">
                        <span className="font-medium">Assinante:</span> {sig.signature_data.signerName}
                      </div>
                    )}
                  </div>
                </div>

                {sig.status === 'completed' && (
                  <button
                    onClick={() => handleDownload(sig)}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
