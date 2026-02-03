'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, ArrowLeft, FileKey, Trash2, Download } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type Certificate = {
  id: string
  user_id: string
  certificate_name: string
  certificate_type: 'auto' | 'icp-brasil' | 'custom'
  is_active: boolean
  created_at: string
  expires_at: string | null
}

export default function CertificatesPage() {
  const router = useRouter()
  const [isLogged, setIsLogged] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Upload form state
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [certificateName, setCertificateName] = useState('')
  const [certificatePassword, setCertificatePassword] = useState('')
  const [certificateType, setCertificateType] = useState<'icp-brasil' | 'custom'>('custom')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!feedback && !error) return
    const timeout = setTimeout(() => {
      setFeedback(null)
      setError(null)
    }, 5000)
    return () => clearTimeout(timeout)
  }, [feedback, error])

  const checkAuth = async () => {
    if (!supabase) {
      setError('Serviço de autenticação indisponível')
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getSession()
    const session = data?.session

    if (!session) {
      router.push('/login?next=/certificates')
      return
    }

    setIsLogged(true)
    await loadCertificates()
    setLoading(false)
  }

  const loadCertificates = async () => {
    if (!supabase) return

    try {
      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setCertificates((data || []) as Certificate[])
    } catch (err) {
      console.error('Erro ao carregar certificados:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar certificados')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar extensão
    const validExtensions = ['.p12', '.pfx', '.pem']
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    
    if (!validExtensions.includes(extension)) {
      setError(`Formato inválido. Use: ${validExtensions.join(', ')}`)
      return
    }

    // Validar tamanho (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Arquivo muito grande. Máximo: 5MB')
      return
    }

    setCertificateFile(file)
    
    // Sugerir nome baseado no arquivo
    if (!certificateName) {
      const name = file.name.replace(/\.(p12|pfx|pem)$/i, '')
      setCertificateName(name)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFeedback(null)

    if (!certificateFile) {
      setError('Selecione um arquivo de certificado')
      return
    }

    if (!certificateName.trim()) {
      setError('Informe um nome para o certificado')
      return
    }

    if (!certificatePassword) {
      setError('Informe a senha do certificado')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('certificate', certificateFile)
      formData.append('name', certificateName.trim())
      formData.append('password', certificatePassword)
      formData.append('type', certificateType)

      const response = await fetch('/api/certificates/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer upload do certificado')
      }

      setFeedback('✅ Certificado enviado com sucesso!')
      
      // Limpar formulário
      setCertificateFile(null)
      setCertificateName('')
      setCertificatePassword('')n      
      // Recarregar lista
      await loadCertificates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (certId: string) => {
    const confirmed = window.confirm(
      '⚠️ Tem certeza que deseja deletar este certificado?\n\n' +
      'Documentos já assinados não serão afetados, mas você não poderá mais usar este certificado para novas assinaturas.'
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/certificates/delete?id=${certId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao deletar certificado')
      }

      setFeedback('Certificado deletado com sucesso')
      await loadCertificates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar')
    }
  }

  const handleSetActive = async (certId: string) => {
    try {
      const response = await fetch('/api/certificates/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: certId }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao ativar certificado')
      }

      setFeedback('Certificado ativado com sucesso')
      await loadCertificates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-20">
        <p className="text-slate-500">Carregando...</p>
      </div>
    )
  }

  if (!isLogged) {
    return null
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gerenciar Certificados</h1>
          <p className="text-sm text-slate-500">Faça upload e gerencie seus certificados digitais</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      {/* Feedback/Error */}
      {feedback && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{feedback}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Upload Form */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Enviar Novo Certificado</h2>
        
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Tipo de Certificado */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de Certificado
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="custom"
                  checked={certificateType === 'custom'}
                  onChange={(e) => setCertificateType(e.target.value as 'custom')}
                  className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-600"
                />
                <span className="text-sm text-slate-600">Certificado Próprio</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="icp-brasil"
                  checked={certificateType === 'icp-brasil'}
                  onChange={(e) => setCertificateType(e.target.value as 'icp-brasil')}
                  className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-600"
                />
                <span className="text-sm text-slate-600">ICP-Brasil (e-CPF/e-CNPJ)</span>
              </label>
            </div>
          </div>

          {/* Nome do Certificado */}
          <div>
            <label htmlFor="cert-name" className="mb-2 block text-sm font-medium text-slate-700">
              Nome do Certificado *
            </label>
            <input
              id="cert-name"
              type="text"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              placeholder="Ex: Meu Certificado A1"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
              required
            />
          </div>

          {/* Arquivo */}
          <div>
            <label htmlFor="cert-file" className="mb-2 block text-sm font-medium text-slate-700">
              Arquivo do Certificado * (.p12, .pfx, .pem)
            </label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="cert-file"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                Escolher Arquivo
              </label>
              <input
                id="cert-file"
                type="file"
                accept=".p12,.pfx,.pem"
                onChange={handleFileChange}
                className="hidden"
              />
              {certificateFile && (
                <span className="text-sm text-slate-600">{certificateFile.name}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Máximo: 5MB</p>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="cert-password" className="mb-2 block text-sm font-medium text-slate-700">
              Senha do Certificado *
            </label>
            <input
              id="cert-password"
              type="password"
              value={certificatePassword}
              onChange={(e) => setCertificatePassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              🔒 A senha é criptografada e armazenada com segurança
            </p>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={uploading || !certificateFile}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando...' : 'Enviar Certificado'}
          </button>
        </form>
      </section>

      {/* Lista de Certificados */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Meus Certificados</h2>

        {certificates.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <FileKey className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="font-medium">Nenhum certificado cadastrado</p>
            <p className="mt-1 text-sm">Envie seu primeiro certificado usando o formulário acima</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className={[
                  'flex items-center justify-between rounded-xl border p-4 transition',
                  cert.is_active
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-slate-300',
                ].join(' ')}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={[
                      'flex h-12 w-12 items-center justify-center rounded-xl',
                      cert.is_active ? 'bg-emerald-100' : 'bg-slate-100',
                    ].join(' ')}
                  >
                    <FileKey
                      className={[
                        'h-6 w-6',
                        cert.is_active ? 'text-emerald-600' : 'text-slate-400',
                      ].join(' ')}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{cert.certificate_name}</p>
                      {cert.is_active && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {cert.certificate_type === 'icp-brasil' ? 'ICP-Brasil' : 'Certificado Próprio'} •{' '}
                      Adicionado em {new Date(cert.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {cert.expires_at && (
                      <p className="text-xs text-amber-600">
                        Expira em {new Date(cert.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!cert.is_active && (
                    <button
                      onClick={() => handleSetActive(cert.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Ativar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(cert.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Deletar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Informações */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 text-sm font-semibold text-blue-900">📊 Sobre Certificados</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• <strong>Certificado Próprio:</strong> Criado por você, requer validação manual no Adobe Reader</li>
          <li>• <strong>ICP-Brasil:</strong> Reconhecido automaticamente, selo verde no Adobe Reader</li>
          <li>• Apenas um certificado pode estar ativo por vez</li>
          <li>• Documentos já assinados não são afetados ao trocar certificados</li>
        </ul>
      </section>
    </div>
  )
}
