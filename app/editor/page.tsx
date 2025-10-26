'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  FormEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import Link from 'next/link'
import { PDFDocument } from 'pdf-lib'

import PdfEditor from '@/components/PdfEditor'
import { supabase } from '@/lib/supabaseClient'

type ProfileType = 'medico' | 'faculdade' | 'generico'

type ProfileTheme = {
  color?: string | null
  issuer?: string | null
  reg?: string | null
  footer?: string | null
  logo_url?: string | null
} | null

type Profile = {
  id: string
  name: string
  type: ProfileType
  theme: ProfileTheme
}

type Pos = {
  page: number
  nx: number
  ny: number
  scale: number
  rotation: number
}

type SignatureSize = { width: number; height: number } | null

type UploadResult = {
  id: string
  signed_pdf_url?: string | null
  qr_code_url?: string | null
  validate_url?: string | null
}

type PageSize = { width: number; height: number }

type StatusMessage = { tone: 'neutral' | 'success' | 'error'; text: string }

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

const PROFILE_TYPE_LABEL: Record<ProfileType, string> = {
  medico: 'Médico',
  faculdade: 'Faculdade',
  generico: 'Genérico',
}

const DEFAULT_SIGNATURE_CANVAS = { width: 400, height: 180 }
const DEFAULT_THEME_COLOR = '#2563eb'
const DEFAULT_THEME_ISSUER = 'Instituição/Profissional'
const DEFAULT_THEME_REG = 'Registro (CRM/CRP/OAB/CNPJ)'
const DEFAULT_THEME_FOOTER = 'Documento assinado digitalmente via SignFlow.'

const PrimaryButton = ({ className = '', disabled, ...props }: ButtonProps) => (
  <button
    className={`inline-flex h-10 items-center justify-center rounded-lg border border-transparent px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
      disabled
        ? 'bg-slate-300 text-slate-600'
        : 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600'
    } ${className}`}
    disabled={disabled}
    {...props}
  />
)

const SecondaryButton = ({ className = '', disabled, ...props }: ButtonProps) => (
  <button
    className={`inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
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

function profileBadge(type: ProfileType) {
  switch (type) {
    case 'medico':
      return 'bg-emerald-50 text-emerald-700'
    case 'faculdade':
      return 'bg-amber-50 text-amber-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default function EditorPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfPageCount, setPdfPageCount] = useState(1)
  const [pageSizes, setPageSizes] = useState<PageSize[]>([])
  const [activePage, setActivePage] = useState(1)
  const [positions, setPositions] = useState<Pos[]>([])

  const [sigMode, setSigMode] = useState<'draw' | 'upload'>('draw')
  const [sigDrawing, setSigDrawing] = useState(false)
  const [sigHasDrawing, setSigHasDrawing] = useState(false)
  const [sigImgFile, setSigImgFile] = useState<File | null>(null)
  const [sigPreviewUrl, setSigPreviewUrl] = useState<string | null>(null)
  const [signatureSize, setSignatureSize] = useState<SignatureSize>(null)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileType, setProfileType] = useState<ProfileType>('generico')
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
    setProfileLogoPreview(null)
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

  const selectedProfile = useMemo(
    () => profiles.find(p => p.id === profileId) ?? null,
    [profiles, profileId],
  )

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
    if (!profiles.length) {
      setProfileFormOpen(true)
    }
  }, [profiles.length])

  useEffect(() => {
    if (!profileLogoFile) {
      setProfileLogoPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(profileLogoFile)
    setProfileLogoPreview(objectUrl)
    return () => {
      try {
        URL.revokeObjectURL(objectUrl)
      } catch {
        /* noop */
      }
    }
  }, [profileLogoFile])

  useEffect(() => {
    if (!pdfFile) {
      setPdfPageCount(1)
      setPageSizes([])
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
        setActivePage(1)
      } catch (err) {
        console.error('[Editor] Falha ao ler PDF', err)
        setStatus({ tone: 'error', text: 'Não consegui ler o PDF para prévia. Tente outro arquivo.' })
        setPageSizes([])
        setPdfPageCount(1)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pdfFile])

  useEffect(() => () => {
    if (sigPreviewUrl?.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(sigPreviewUrl)
      } catch {
        /* noop */
      }
    }
  }, [sigPreviewUrl])

  useEffect(() => {
    if (!sigPreviewUrl || sigMode !== 'upload') return

    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      setSignatureSize({ width: img.naturalWidth || DEFAULT_SIGNATURE_CANVAS.width, height: img.naturalHeight || DEFAULT_SIGNATURE_CANVAS.height })
    }
    img.src = sigPreviewUrl

    return () => {
      cancelled = true
    }
  }, [sigPreviewUrl, sigMode])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setPdfFile(file)
    setPositions([])
    setResult(null)
    setStatus(null)
  }

  const handleSignatureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    if (!file) return

    const url = URL.createObjectURL(file)
    setSigMode('upload')
    setSigImgFile(file)
    setSigPreviewUrl(url)
    setSignatureSize(null)
    setSigHasDrawing(false)
    setResult(null)
  }

  const resetSignature = () => {
    setSigImgFile(null)
    setSigPreviewUrl(null)
    setSigHasDrawing(false)
    setSignatureSize(null)
    setResult(null)

    if (sigMode === 'draw' && signCanvasRef.current) {
      const ctx = signCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.clearRect(0, 0, DEFAULT_SIGNATURE_CANVAS.width, DEFAULT_SIGNATURE_CANVAS.height)
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

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (sigMode !== 'draw') return
    const canvas = signCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#1f2937'
    ctx.beginPath()
    ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
    setSigDrawing(true)
    setSigHasDrawing(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (sigMode !== 'draw' || !sigDrawing) return
    const canvas = signCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
    ctx.stroke()
  }

  const onPointerUp = () => {
    if (sigMode !== 'draw') return
    setSigDrawing(false)
    if (sigHasDrawing && signCanvasRef.current) {
      const url = signCanvasRef.current.toDataURL('image/png')
      setSigPreviewUrl(url)
      setSigImgFile(null)
      setResult(null)
      setSignatureSize({ ...DEFAULT_SIGNATURE_CANVAS })
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
      const cw = dims.width
      const ch = dims.height
      const nx = typeof pos.nx === 'number' ? pos.nx : 0.5
      const ny = typeof pos.ny === 'number' ? pos.ny : 0.5

      return {
        page: pos.page,
        nx,
        ny,
        x: nx * cw,
        y: ny * ch,
        scale: typeof pos.scale === 'number' ? pos.scale : 1,
        rotation: typeof pos.rotation === 'number' ? pos.rotation : 0,
        page_width: cw,
        page_height: ch,
      }
    })
  }

  const ensureSignatureBlob = async (): Promise<File | Blob | null> => {
    if (!sigPreviewUrl) return null
    if (sigMode === 'upload' && sigImgFile) return sigImgFile

    try {
      const response = await fetch(sigPreviewUrl)
      return await response.blob()
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
      setError('Desenhe ou envie uma assinatura para continuar.')
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
      form.append(
        'signature_meta',
        JSON.stringify({
          width: signatureSize?.width ?? DEFAULT_SIGNATURE_CANVAS.width,
          height: signatureSize?.height ?? DEFAULT_SIGNATURE_CANVAS.height,
        }),
      )

      if (sessionUserId) {
        form.append('user_id', sessionUserId)
      }
      if (selectedProfile) {
        form.append('validation_profile_id', selectedProfile.id)
        form.append('validation_theme_snapshot', JSON.stringify(selectedProfile.theme || null))
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
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">1) Arquivo PDF</h2>
                  {pdfFile && (
                    <SecondaryButton onClick={() => fileInputRef.current?.click()}>
                      Trocar PDF
                    </SecondaryButton>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  Envie o documento que deseja assinar. Aceitamos arquivos até 10MB.
                </p>
              </div>

              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {pdfFile ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-medium text-slate-700">{pdfFile.name}</p>
                    <p className="text-slate-500">{formatBytes(pdfFile.size)}</p>
                    <SecondaryButton onClick={() => fileInputRef.current?.click()} className="mt-2">
                      Escolher outro arquivo
                    </SecondaryButton>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-slate-500">
                    <p>
                      Arraste o PDF para cá ou
                      <button
                        type="button"
                        className="ml-1 font-medium text-blue-600 underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        clique para selecionar
                      </button>
                    </p>
                    <p>O arquivo será processado localmente para gerar a pré-visualização.</p>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200">
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
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
                <span>
                  Página {activePage} de {pdfPageCount}
                </span>
                <span>{positions.length} assinatura(s) posicionada(s)</span>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">2) Assinatura</h2>
              <p className="text-sm text-slate-500">
                Desenhe a assinatura abaixo ou envie uma imagem PNG transparente.
              </p>

              <div className="mt-4 flex gap-2">
                <SecondaryButton
                  className={sigMode === 'draw' ? 'border-blue-500 text-blue-600' : ''}
                  onClick={() => {
                    setSigMode('draw')
                    resetSignature()
                  }}
                >
                  Desenhar
                </SecondaryButton>
                <SecondaryButton
                  className={sigMode === 'upload' ? 'border-blue-500 text-blue-600' : ''}
                  onClick={() => {
                    setSigMode('upload')
                    resetSignature()
                  }}
                >
                  Enviar imagem
                </SecondaryButton>
              </div>

              {sigMode === 'draw' ? (
                <div className="mt-4 space-y-3">
                  <canvas
                    ref={signCanvasRef}
                    width={DEFAULT_SIGNATURE_CANVAS.width}
                    height={DEFAULT_SIGNATURE_CANVAS.height}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                    className="h-36 w-full touch-none rounded-lg border border-slate-200 bg-white shadow-inner"
                  />
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>Use o mouse ou o dedo para assinar.</span>
                    <button
                      type="button"
                      className="font-medium text-blue-600 underline"
                      onClick={resetSignature}
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} />
                  {sigPreviewUrl && (
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <img src={sigPreviewUrl} alt="Prévia da assinatura" className="mx-auto max-h-32 object-contain" />
                    </div>
                  )}
                </div>
              )}

              {sigPreviewUrl && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  A assinatura está pronta! Clique no PDF para posicionar.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">3) Aparência da validação</h2>
                <SecondaryButton onClick={() => setProfileFormOpen(o => !o)}>
                  {profileFormOpen ? 'Fechar formulário' : 'Novo perfil'}
                </SecondaryButton>
              </div>
              <p className="text-sm text-slate-500">
                Escolha como o documento aparecerá na página pública de validação. Você pode cadastrar diferentes temas para cada área.
              </p>

              {profileFormOpen && (
                <form className="mt-4 space-y-3 rounded-lg border border-slate-200 p-4" onSubmit={handleCreateProfile}>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Nome do perfil</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                      value={profileName}
                      onChange={event => setProfileName(event.target.value)}
                      placeholder="Hospital São Lucas"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Tipo</label>
                    <select
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                      value={profileType}
                      onChange={event => setProfileType(event.target.value as ProfileType)}
                    >
                      {(['medico', 'faculdade', 'generico'] as ProfileType[]).map(type => (
                        <option key={type} value={type}>
                          {PROFILE_TYPE_LABEL[type]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Cor principal</label>
                      <input
                        type="color"
                        className="mt-1 h-10 w-full rounded-md border border-slate-300"
                        value={profileColor}
                        onChange={event => setProfileColor(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Registro</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                        value={profileReg}
                        onChange={event => setProfileReg(event.target.value)}
                        placeholder="CRM 12345"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Responsável / Instituição</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                      value={profileIssuer}
                      onChange={event => setProfileIssuer(event.target.value)}
                      placeholder="Dr. Fulano de Tal"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Rodapé</label>
                    <textarea
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
                      value={profileFooter}
                      onChange={event => setProfileFooter(event.target.value)}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Logo (opcional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0] ?? null
                        setProfileLogoFile(file)
                      }}
                    />
                    {profileLogoPreview && (
                      <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                        <img src={profileLogoPreview} alt="Prévia da logo" className="mx-auto max-h-20 object-contain" />
                      </div>
                    )}
                  </div>

                  <PrimaryButton type="submit" disabled={profileFormBusy} className="w-full">
                    {profileFormBusy ? 'Salvando…' : 'Criar perfil'}
                  </PrimaryButton>

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
                              <p className="text-xs text-slate-500">{theme.issuer}</p>
                            )}
                            {theme.reg && (
                              <p className="text-xs text-slate-400">{theme.reg}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {theme.color && (
                              <span className="flex items-center gap-2 text-xs text-slate-500">
                                <span
                                  className="inline-block h-4 w-4 rounded-full border border-slate-300"
                                  style={{ backgroundColor: theme.color as string }}
                                />
                                {theme.color}
                              </span>
                            )}
                            <input
                              type="radio"
                              name="validation-profile"
                              className="h-4 w-4"
                              checked={profileId === profile.id}
                              onChange={() => setProfileId(profile.id)}
                            />
                          </div>
                        </label>
                      )
                    })}
                  </div>

                  {selectedProfile?.theme && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">Prévia rápida</p>
                      {selectedProfile.theme.issuer && (
                        <div>
                          <span className="font-semibold text-slate-700">Responsável:</span>{' '}
                          {selectedProfile.theme.issuer}
                        </div>
                      )}
                      {selectedProfile.theme.reg && (
                        <div>
                          <span className="font-semibold text-slate-700">Registro:</span>{' '}
                          {selectedProfile.theme.reg}
                        </div>
                      )}
                      {selectedProfile.theme.footer && (
                        <div>
                          <span className="font-semibold text-slate-700">Rodapé:</span>{' '}
                          {selectedProfile.theme.footer}
                        </div>
                      )}
                      {selectedProfile.theme.logo_url && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">Logo:</span>
                          <div className="flex h-12 items-center justify-center rounded border border-slate-200 bg-white px-3">
                            <img
                              src={selectedProfile.theme.logo_url}
                              alt={`Logo de ${selectedProfile.name}`}
                              className="max-h-10 object-contain"
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
              <PrimaryButton className="mt-4 w-full" onClick={assinarESalvar} disabled={disableAction}>
                {busy ? 'Processando…' : 'Assinar & gerar documento'}
              </PrimaryButton>
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
              <Link href="/dashboard" className="text-xs font-medium uppercase tracking-wide text-emerald-900 underline">
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
