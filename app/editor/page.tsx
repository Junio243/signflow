'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, ChangeEvent, FormEvent, PointerEvent as ReactPointerEvent } from 'react'
import Link from 'next/link'
import PdfEditor from '@/components/PdfEditor'
import { supabase } from '@/lib/supabaseClient'
import { PDFDocument } from 'pdf-lib'

const DEFAULT_SIGNATURE_CANVAS = { width: 400, height: 180 }
const DEFAULT_THEME_COLOR = '#2563eb'
const DEFAULT_THEME_ISSUER = 'Instituição/Profissional'
const DEFAULT_THEME_REG = 'Registro (CRM/CRP/OAB/CNPJ)'
const DEFAULT_THEME_FOOTER = 'Documento assinado digitalmente via SignFlow.'

type Profile = { id: string; name: string; type: 'medico'|'faculdade'|'generico'; theme: any }

const PROFILE_TYPE_LABEL: Record<Profile['type'], string> = {
  medico: 'Médico',
  faculdade: 'Faculdade',
  generico: 'Genérico',
}

const PROFILE_TYPES: Profile['type'][] = ['medico', 'faculdade', 'generico']

type Pos = {
  page: number
  nx: number
  ny: number
  scale: number
  rotation: number
  x?: number
  y?: number
}

type SignatureSize = { width: number; height: number } | null

type UploadResult = { id: string; signed_pdf_url?: string | null; qr_code_url?: string | null; validate_url?: string | null }

type PageSize = { width: number; height: number }

type StatusMessage = { tone: 'neutral' | 'success' | 'error'; text: string }

const Button = ({ className = '', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
      disabled
        ? 'bg-slate-300 text-slate-600'
        : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600'
    } ${className}`}
    disabled={disabled}
    {...props}
  />
)

const SecondaryButton = ({ className = '', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
      disabled
        ? 'border-slate-200 bg-slate-100 text-slate-500'
        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-400'
    } ${className}`}
    disabled={disabled}
    {...props}
  />
)

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(2)} MB`
}

function profileBadge(type: Profile['type']) {
  switch (type) {
    case 'medico': return 'bg-emerald-50 text-emerald-700'
    case 'faculdade': return 'bg-amber-50 text-amber-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export default function EditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [positions, setPositions] = useState<Pos[]>([])
  const [activePage, setActivePage] = useState(1)
  const [pageSizes, setPageSizes] = useState<PageSize[]>([])
  const [pdfPageCount, setPdfPageCount] = useState(1)

  const [sigMode, setSigMode] = useState<'draw'|'upload'>('draw')
  const [sigDrawing, setSigDrawing] = useState(false)
  const [sigHasDrawing, setSigHasDrawing] = useState(false)
  const [sigImgFile, setSigImgFile] = useState<File | null>(null)
  const [sigPreviewUrl, setSigPreviewUrl] = useState<string | null>(null)
  const [signatureSize, setSignatureSize] = useState<SignatureSize>(null)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileType, setProfileType] = useState<Profile['type']>('generico')
  const [profileColor, setProfileColor] = useState(DEFAULT_THEME_COLOR)
  const [profileIssuer, setProfileIssuer] = useState(DEFAULT_THEME_ISSUER)
  const [profileReg, setProfileReg] = useState(DEFAULT_THEME_REG)
  const [profileFooter, setProfileFooter] = useState(DEFAULT_THEME_FOOTER)
  const [profileLogoFile, setProfileLogoFile] = useState<File | null>(null)
  const [profileLogoPreview, setProfileLogoPreview] = useState<string | null>(null)
  const [profileFormStatus, setProfileFormStatus] = useState<StatusMessage | null>(null)
  const [profileFormBusy, setProfileFormBusy] = useState(false)

  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const setInfo = (text: string) => setStatus({ tone: 'neutral', text })
  const setError = (text: string) => setStatus({ tone: 'error', text })
  const setSuccess = (text: string) => setStatus({ tone: 'success', text })

  const resetProfileForm = () => {
    setProfileName('')
    setProfileType('generico')
    setProfileColor(DEFAULT_THEME_COLOR)
    setProfileIssuer(DEFAULT_THEME_ISSUER)
    setProfileReg(DEFAULT_THEME_REG)
    setProfileFooter(DEFAULT_THEME_FOOTER)
    setProfileLogoFile(null)
    setProfileFormStatus(null)
  }

  const loadProfiles = useCallback(async ({ selectId }: { selectId?: string | null } = {}) => {
    const { data, error } = await supabase
      .from('validation_profiles')
      .select('id, name, type, theme')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Editor] Falha ao carregar perfis de validação', error)
      setStatus({ tone: 'error', text: 'Não foi possível carregar os perfis de validação.' })
      return
    }

    const list = (data || []) as Profile[]
    setProfiles(list)

    if (list.length === 0) {
      setProfileId(null)
      return
    }

    if (selectId && list.some(p => p.id === selectId)) {
      setProfileId(selectId)
      return
    }

    if (profileId && list.some(p => p.id === profileId)) {
      setProfileId(profileId)
      return
    }

    setProfileId(list[0].id)
  }, [profileId])

  const selectedProfile = useMemo(() => profiles.find(p => p.id === profileId) ?? null, [profiles, profileId])
  const hasProfiles = profiles.length > 0

  useEffect(() => {
    const boot = async () => {
      const session = await supabase.auth.getSession()
      const userId = session.data?.session?.user?.id ?? null
      setSessionUserId(userId)
      await loadProfiles()
    }
    boot()
  }, [loadProfiles])

  useEffect(() => {
    if (!hasProfiles) {
      setProfileFormOpen(true)
    }
  }, [hasProfiles])

  useEffect(() => {
    if (!profileLogoFile) {
      setProfileLogoPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(profileLogoFile)
    setProfileLogoPreview(objectUrl)
    return () => {
      try { URL.revokeObjectURL(objectUrl) } catch { /* noop */ }
    }
  }, [profileLogoFile])

  useEffect(() => {
    if (!pdfFile) {
      setPageSizes([])
      setPdfPageCount(1)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const ab = await pdfFile.arrayBuffer()
        const doc = await PDFDocument.load(ab)
        if (cancelled) return
        const sizes = doc.getPages().map(p => ({ width: p.getWidth(), height: p.getHeight() }))
        setPageSizes(sizes)
        setPdfPageCount(sizes.length || 1)
      } catch (err) {
        console.error('[Editor] Falha ao ler PDF', err)
        setStatus({ tone: 'error', text: 'Não consegui ler o PDF para prévia. Tente outro arquivo.' })
        setPageSizes([])
        setPdfPageCount(1)
      }
    })()
    return () => { cancelled = true }
  }, [pdfFile])

  useEffect(() => {
    if (!sigPreviewUrl) {
      setSignatureSize(null)
      return
    }
    let revoked = false
    const img = new Image()
    img.onload = () => {
      if (!revoked) setSignatureSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      if (!revoked) setSignatureSize(null)
    }
    img.src = sigPreviewUrl
    return () => { revoked = true }
  }, [sigPreviewUrl])

  useEffect(() => () => {
    if (sigPreviewUrl?.startsWith('blob:')) {
      try { URL.revokeObjectURL(sigPreviewUrl) } catch { /* noop */ }
    }
  }, [sigPreviewUrl])

  const resetSignature = () => {
    setSigImgFile(null)
    setSigPreviewUrl(null)
    setSigHasDrawing(false)
    setSignatureSize(null)
    if (sigMode === 'draw' && signCanvasRef.current) {
      const ctx = signCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, signCanvasRef.current.width, signCanvasRef.current.height)
      }
    }
  }

  const handleCreateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (profileFormBusy) return
    if (!profileName.trim()) {
      setProfileFormStatus({ tone: 'error', text: 'Informe o nome do perfil.' })
      return
    }

    setProfileFormBusy(true)
    setProfileFormStatus({ tone: 'neutral', text: 'Salvando perfil...' })

    try {
      let logoUrl: string | null = null
      if (profileLogoFile) {
        const storageKey = `branding/${Date.now()}-${profileLogoFile.name}`
        const upload = await supabase.storage.from('signflow').upload(storageKey, profileLogoFile, {
          contentType: profileLogoFile.type || 'image/png',
          upsert: true,
        })
        if (upload.error) {
          throw new Error(upload.error.message)
        }
        const publicUrl = await supabase.storage.from('signflow').getPublicUrl(storageKey)
        logoUrl = publicUrl.data?.publicUrl ?? null
      }

      const theme = {
        color: profileColor,
        footer: profileFooter,
        issuer: profileIssuer,
        reg: profileReg,
        logo_url: logoUrl,
      }

      const insert = await supabase
        .from('validation_profiles')
        .insert({ name: profileName.trim(), type: profileType, theme })
        .select('id')
        .single()

      if (insert.error) {
        throw new Error(insert.error.message)
      }

      const newId = insert.data?.id ?? null
      const hadNoProfiles = profiles.length === 0

      resetProfileForm()
      setProfileFormStatus({ tone: 'success', text: 'Perfil criado com sucesso!' })
      setSuccess('Perfil de validação criado com sucesso! Selecione-o na lista abaixo.')

      await loadProfiles({ selectId: newId })

      if (hadNoProfiles && newId) {
        setProfileFormOpen(false)
      }
    } catch (err: any) {
      console.error('[Editor] Falha ao criar perfil de validação', err)
      setProfileFormStatus({ tone: 'error', text: err?.message || 'Não foi possível criar o perfil.' })
    } finally {
      setProfileFormBusy(false)
    }
  }

  const onPdfChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setPdfFile(file)
    setPositions([])
    setActivePage(1)
    setResult(null)
    if (!file) {
      setStatus(null)
      return
    }
    if (!file.type.includes('pdf')) {
      setError('Envie um arquivo PDF (application/pdf).')
      return
    }
    setInfo('PDF carregado. Posicione a assinatura nas páginas desejadas.')
  }

  const onSignatureUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSigImgFile(file)
    setSigHasDrawing(!!file)
    setResult(null)
    if (sigPreviewUrl?.startsWith('blob:')) {
      try { URL.revokeObjectURL(sigPreviewUrl) } catch { /* noop */ }
    }
    if (file) {
      const url = URL.createObjectURL(file)
      setSigPreviewUrl(url)
    } else {
      setSigPreviewUrl(null)
    }
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (sigMode !== 'draw') return
    const canvas = signCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setSigDrawing(true)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#1f2937'
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (sigMode !== 'draw') return
    if (!sigDrawing) return
    const canvas = signCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
    if (!sigHasDrawing) setSigHasDrawing(true)
  }

  const onPointerUp = () => {
    if (sigMode !== 'draw') return
    setSigDrawing(false)
    if (sigHasDrawing && signCanvasRef.current) {
      const url = signCanvasRef.current.toDataURL('image/png')
      setSigPreviewUrl(url)
      setResult(null)
    }
  }

  const handlePositionsChange = useCallback((next: Pos[]) => {
    setPositions(next)
    setResult(null)
  }, [])

  const computePositionsForApi = () => {
    if (!positions.length) return []
    return positions.map(pos => {
      const dims = pageSizes[pos.page - 1] ?? pageSizes[0] ?? { width: 595, height: 842 }
      const nx = typeof pos.nx === 'number' ? pos.nx : 0.5
      const ny = typeof pos.ny === 'number' ? pos.ny : 0.5
      const centerX = typeof pos.x === 'number' ? pos.x : nx * dims.width
      const centerY = typeof pos.y === 'number' ? pos.y : dims.height - ny * dims.height
      return {
        page: pos.page,
        nx,
        ny,
        x: centerX,
        y: centerY,
        scale: typeof pos.scale === 'number' ? pos.scale : 1,
        rotation: typeof pos.rotation === 'number' ? pos.rotation : 0,
        page_width: dims.width,
        page_height: dims.height,
      }
    })
  }

  const ensureSignatureBlob = async (): Promise<File | Blob | null> => {
    if (!sigPreviewUrl) return null
    if (sigMode === 'upload' && sigImgFile) return sigImgFile
    try {
      const response = await fetch(sigPreviewUrl)
      const blob = await response.blob()
      return blob
    } catch (err) {
      console.error('[Editor] Falha ao converter assinatura', err)
      return null
    }
  }

  const assinarESalvar = async () => {
    setStatus(null)
    setResult(null)

    if (!pdfFile) {
      setError('Selecione um PDF antes de continuar.')
      return
    }
    if (!sigPreviewUrl) {
      setError('Desenhe ou envie uma assinatura.')
      return
    }
    if (!positions.length) {
      setError('Posicione a assinatura ao menos em uma página clicando na prévia.')
      return
    }

    const positionsForApi = computePositionsForApi()
    if (!positionsForApi.length) {
      setError('Não consegui calcular as posições da assinatura.')
      return
    }

    const signatureBlob = await ensureSignatureBlob()
    if (!signatureBlob) {
      setError('Não foi possível preparar a assinatura.')
      return
    }

    setBusy(true)
    setInfo('Enviando arquivo…')

    try {
      const form = new FormData()
      form.append('pdf', pdfFile, pdfFile.name)
      form.append('original_pdf_name', pdfFile.name)
      form.append('positions', JSON.stringify(positionsForApi))
      form.append('signature_meta', JSON.stringify({
        width: signatureSize?.width ?? DEFAULT_SIGNATURE_CANVAS.width,
        height: signatureSize?.height ?? DEFAULT_SIGNATURE_CANVAS.height,
      }))
      if (sessionUserId) form.append('user_id', sessionUserId)
      if (selectedProfile) {
        form.append('validation_theme_snapshot', JSON.stringify(selectedProfile.theme || null))
        form.append('validation_profile_id', selectedProfile.id)
      }
      if (signatureBlob instanceof File) {
        form.append('signature', signatureBlob, signatureBlob.name)
      } else {
        form.append('signature', signatureBlob, 'signature.png')
      }

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) {
        throw new Error(uploadJson?.error || 'Falha ao enviar PDF')
      }
      const { id } = uploadJson as { id: string }
      setInfo('Arquivo enviado. Gerando PDF assinado…')

      const signForm = new FormData()
      signForm.append('id', id)
      const signRes = await fetch('/api/sign', { method: 'POST', body: signForm })
      const signJson = await signRes.json()
      if (!signRes.ok) {
        throw new Error(signJson?.error || 'Falha ao assinar documento')
      }

      setResult(signJson as UploadResult)
      setSuccess('Documento assinado com sucesso!')
      setPositions([])
    } catch (err: any) {
      console.error('[Editor] Erro ao assinar', err)
      setError(err?.message || 'Erro inesperado ao assinar.')
    } finally {
      setBusy(false)
    }
  }

  const disableAction = busy || !pdfFile || !sigPreviewUrl || positions.length === 0

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-10 md:px-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-slate-900">Editor de Documento</h1>
          <p className="text-slate-600">
            Envie o PDF, desenhe ou importe a assinatura, posicione nas páginas e gere o arquivo assinado com QR Code.
          </p>
        </header>

        {status && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              status.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status.tone === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr,1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Prévia interativa</h2>
              <div className="text-sm text-slate-500">Página {activePage} de {pdfPageCount}</div>
            </div>

            {pdfFile ? (
              <PdfEditor
                file={pdfFile}
                signatureUrl={sigPreviewUrl}
                signatureSize={signatureSize}
                positions={positions}
                onPositions={handlePositionsChange}
                page={activePage}
                onPageChange={setActivePage}
                onDocumentLoaded={({ pages }) => setPdfPageCount(pages)}
              />
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                <div className="text-sm text-slate-500">Envie um PDF para visualizar e posicionar a assinatura.</div>
              </div>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-3 text-xs text-slate-500 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-600">Arquivo</dt>
                <dd className="mt-1 text-slate-500">{pdfFile ? pdfFile.name : '—'}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-600">Tamanho</dt>
                <dd className="mt-1 text-slate-500">{formatBytes(pdfFile?.size)}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-600">Páginas</dt>
                <dd className="mt-1 text-slate-500">{pdfPageCount}</dd>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-600">Assinatura</dt>
                <dd className="mt-1 text-slate-500">{sigPreviewUrl ? 'Carregada' : '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3">
                <h2 className="text-lg font-semibold text-slate-900">1) PDF</h2>
                <SecondaryButton onClick={() => fileInputRef.current?.click()} disabled={busy}>
                  Selecionar arquivo
                </SecondaryButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={onPdfChange}
                />
              </div>
              <p className="text-sm text-slate-500">
                Aceitamos PDFs com múltiplas páginas. Clique na prévia para definir onde a assinatura ficará.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                <h2 className="text-lg font-semibold text-slate-900">2) Assinatura</h2>
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    className={`rounded-md px-3 py-1.5 transition ${sigMode === 'draw' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
                    onClick={() => { setSigMode('draw'); resetSignature() }}
                    disabled={busy}
                  >
                    Desenhar
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-3 py-1.5 transition ${sigMode === 'upload' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
                    onClick={() => { setSigMode('upload'); resetSignature() }}
                    disabled={busy}
                  >
                    Importar
                  </button>
                </div>
              </div>

              {sigMode === 'draw' ? (
                <div className="space-y-3">
                  <canvas
                    ref={signCanvasRef}
                    width={DEFAULT_SIGNATURE_CANVAS.width}
                    height={DEFAULT_SIGNATURE_CANVAS.height}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={() => setSigDrawing(false)}
                    className="h-48 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Assine com o mouse ou touchscreen.</span>
                    <SecondaryButton onClick={resetSignature} disabled={busy || (!sigHasDrawing && !sigPreviewUrl)}>
                      Limpar
                    </SecondaryButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 hover:bg-slate-100">
                    <span className="font-medium text-slate-600">Clique para enviar assinatura</span>
                    <span className="text-xs text-slate-400">PNG ou JPG com fundo transparente recomendado</span>
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onSignatureUpload} />
                  </label>
                  {sigPreviewUrl && (
                    <div>
                      <div className="text-xs font-medium text-slate-600">Prévia</div>
                      <img
                        src={sigPreviewUrl}
                        alt="Assinatura"
                        className="mt-2 h-32 w-full rounded-lg border border-slate-200 bg-white object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">3) Aparência da validação</h2>
                <SecondaryButton
                  type="button"
                  onClick={() => setProfileFormOpen(open => !open)}
                  disabled={profileFormBusy}
                >
                  {profileFormOpen ? 'Ocultar formulário' : 'Novo perfil'}
                </SecondaryButton>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Personalize a página pública de validação. Você também pode gerenciar tudo em{' '}
                <Link href="/appearance" className="text-blue-600 underline">/appearance</Link>.
              </p>

              {profileFormOpen && (
                <form
                  onSubmit={handleCreateProfile}
                  className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Nome do perfil
                      </label>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Ex.: Médico CRM/DF"
                        value={profileName}
                        onChange={e => setProfileName(e.target.value)}
                        disabled={profileFormBusy}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {PROFILE_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                              profileType === type
                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                            onClick={() => setProfileType(type)}
                            aria-pressed={profileType === type}
                            disabled={profileFormBusy}
                          >
                            {PROFILE_TYPE_LABEL[type]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Cor principal
                      </label>
                      <input
                        type="color"
                        className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300"
                        value={profileColor}
                        onChange={e => setProfileColor(e.target.value)}
                        disabled={profileFormBusy}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Registro
                      </label>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="CRM/CRP/OAB/CNPJ"
                        value={profileReg}
                        onChange={e => setProfileReg(e.target.value)}
                        disabled={profileFormBusy}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Emitido por
                      </label>
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        placeholder="Instituição/Profissional"
                        value={profileIssuer}
                        onChange={e => setProfileIssuer(e.target.value)}
                        disabled={profileFormBusy}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Rodapé
                      </label>
                      <textarea
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        rows={3}
                        value={profileFooter}
                        onChange={e => setProfileFooter(e.target.value)}
                        disabled={profileFormBusy}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Logo (opcional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:hover:bg-blue-700"
                        onChange={e => setProfileLogoFile(e.target.files?.[0] ?? null)}
                        disabled={profileFormBusy}
                      />
                      {profileLogoPreview && (
                        <div className="mt-2 flex h-20 items-center justify-center rounded border border-dashed border-slate-300 bg-white p-2">
                          <img
                            src={profileLogoPreview}
                            alt="Prévia do logo"
                            className="max-h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="submit" className="px-4" disabled={profileFormBusy || !profileName.trim()}>
                      {profileFormBusy ? 'Salvando…' : 'Salvar novo perfil'}
                    </Button>
                    <SecondaryButton type="button" onClick={resetProfileForm} disabled={profileFormBusy}>
                      Limpar
                    </SecondaryButton>
                  </div>
                  {profileFormStatus && (
                    <div
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        profileFormStatus.tone === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : profileFormStatus.tone === 'error'
                            ? 'border-rose-200 bg-rose-50 text-rose-700'
                            : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {profileFormStatus.text}
                    </div>
                  )}
                </form>
              )}

              {profiles.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Nenhum perfil cadastrado ainda. Utilize o formulário acima para criar o primeiro.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="grid gap-2">
                    {profiles.map(profile => {
                      const theme = (profile.theme || {}) as Record<string, any>
                      return (
                        <label
                          key={profile.id}
                          className={`flex cursor-pointer flex-col gap-3 rounded-lg border p-3 text-sm transition md:flex-row md:items-center md:justify-between ${
                            profileId === profile.id
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-800">{profile.name}</span>
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${profileBadge(profile.type)}`}>
                                {PROFILE_TYPE_LABEL[profile.type]}
                              </span>
                            </div>
                            {theme.issuer && (
                              <div className="text-xs text-slate-500">
                                {theme.issuer}
                                {theme.reg ? ` — ${theme.reg}` : ''}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {theme.color && (
                              <span
                                className="h-6 w-6 rounded-full border border-slate-200"
                                style={{ backgroundColor: theme.color as string }}
                                aria-label={`Cor ${theme.color}`}
                              />
                            )}
                            <input
                              type="radio"
                              className="sr-only"
                              name="validation_profile"
                              checked={profileId === profile.id}
                              onChange={() => setProfileId(profile.id)}
                            />
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  {selectedProfile && (
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-slate-700">Cor:</span>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-5 w-5 rounded-full border border-slate-300"
                            style={{ backgroundColor: (selectedProfile.theme?.color as string) || DEFAULT_THEME_COLOR }}
                          />
                          <span>{selectedProfile.theme?.color || DEFAULT_THEME_COLOR}</span>
                        </span>
                      </div>
                      {selectedProfile.theme?.issuer && (
                        <div>
                          <span className="font-semibold text-slate-700">Emitido por:</span>{' '}
                          {selectedProfile.theme.issuer}
                          {selectedProfile.theme?.reg && (
                            <span className="text-slate-500"> — {selectedProfile.theme.reg}</span>
                          )}
                        </div>
                      )}
                      {selectedProfile.theme?.footer && (
                        <div>
                          <span className="font-semibold text-slate-700">Rodapé:</span>{' '}
                          {selectedProfile.theme.footer}
                        </div>
                      )}
                      {selectedProfile.theme?.logo_url && (
                        <div>
                          <span className="font-semibold text-slate-700">Logo:</span>
                          <div className="mt-2 flex h-16 items-center justify-center rounded border border-slate-200 bg-white p-2">
                            <img
                              src={selectedProfile.theme.logo_url}
                              alt={`Logo de ${selectedProfile.name}`}
                              className="max-h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">4) Finalizar</h2>
              <p className="text-sm text-slate-500">
                Conferiu tudo? Clique para gerar o PDF assinado e obter o link de validação com QR Code.
              </p>
              <Button className="mt-4 w-full" onClick={assinarESalvar} disabled={disableAction}>
                {busy ? 'Processando…' : 'Assinar & gerar documento'}
              </Button>
              <p className="mt-2 text-xs text-slate-500">
                O arquivo é processado em segundos. A prévia acima continuará disponível para ajustes.
              </p>
            </div>
          </section>
        </div>

        {result && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Documento pronto!</h2>
            <ul className="mt-3 space-y-2">
              {result.signed_pdf_url && (
                <li>
                  <span className="font-medium">PDF Assinado:</span>{' '}
                  <a className="underline" href={result.signed_pdf_url} target="_blank" rel="noreferrer">
                    Abrir PDF
                  </a>
                </li>
              )}
              {result.validate_url && (
                <li>
                  <span className="font-medium">Validação pública:</span>{' '}
                  <a className="underline" href={result.validate_url} target="_blank" rel="noreferrer">
                    {result.validate_url}
                  </a>
                </li>
              )}
              {result.qr_code_url && (
                <li>
                  <span className="font-medium">QR Code:</span>{' '}
                  <a className="underline" href={result.qr_code_url} target="_blank" rel="noreferrer">
                    Baixar QR
                  </a>
                </li>
              )}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/dashboard`} className="text-xs font-medium uppercase tracking-wide text-emerald-900 underline">
                Ir para o dashboard
              </Link>
              <Link href={`/validate/${result.id}`} className="text-xs font-medium uppercase tracking-wide text-emerald-900 underline">
                Abrir validação pública
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
