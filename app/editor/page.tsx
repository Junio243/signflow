'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  FormEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import Link from 'next/link'
import PdfEditor from '@/components/PdfEditor'
import PdfTextOverlay, { type TextAnnotation } from '@/components/PdfTextOverlay'
import { supabase } from '@/lib/supabaseClient'
import type { QrPosition, QrPage } from '@/lib/validation/documentSchemas'

// -- tipos e constantes --
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
  x?: number
  y?: number
}

type SignatureSize = { width: number; height: number } | null

type Signer = {
  name: string
  reg: string
  certificate_type: string
  certificate_valid_until: string
  certificate_issuer: string
  email: string
  logo_url: string
}

type UploadResult = {
  id: string
  signed_pdf_url?: string | null
  qr_code_url?: string | null
  validate_url?: string | null
}

type PageSize = { width: number; height: number }

type StatusMessage = { tone: 'neutral' | 'success' | 'error'; text: string }

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

// Abas do painel lateral
type SideTab = 'assinatura' | 'texto' | 'signatarios' | 'qrcode' | 'perfil'

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
const ACCESS_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ACCESS_CODE_LENGTH = 8

const MAX_PDF_SIZE_MB = 20
const MAX_SIGNATURE_SIZE_MB = 5

const bytesToMB = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(2)

const createEmptySigner = (): Signer => ({
  name: '',
  reg: '',
  certificate_type: '',
  certificate_valid_until: '',
  certificate_issuer: '',
  email: '',
  logo_url: '',
})

const PrimaryButton = ({ className = '', disabled, ...props }: ButtonProps) => (
  <button
    className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-transparent px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation ${
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
    className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation ${
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
    case 'medico': return 'bg-emerald-50 text-emerald-700'
    case 'faculdade': return 'bg-amber-50 text-amber-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const generateAccessCode = (length = ACCESS_CODE_LENGTH) => {
  const charset = ACCESS_CODE_CHARSET
  const values = new Uint32Array(length)
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values)
  } else {
    for (let i = 0; i < length; i += 1) {
      values[i] = Math.floor(Math.random() * charset.length)
    }
  }
  return Array.from(values).map(value => charset[value % charset.length]).join('')
}

export default function EditorPage() {
  const supabaseClient = supabase
  const fileInputRef = useRef<HTMLInputElement>(null)
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

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

  const [signers, setSigners] = useState<Signer[]>([createEmptySigner()])
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([])

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileFormOpen, setProfileFormOpen] = useState(false)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profileType, setProfileType] = useState<ProfileType>('generico')
  const [profileColor, setProfileColor] = useState(DEFAULT_THEME_COLOR)
  const [profileIssuer, setProfileIssuer] = useState(DEFAULT_THEME_ISSUER)
  const [profileReg, setProfileReg] = useState(DEFAULT_THEME_REG)
  const [profileFooter, setProfileFooter] = useState(DEFAULT_THEME_FOOTER)
  const [profileLogoFile, setProfileLogoFile] = useState<File | null>(null)
  const [profileLogoPreview, setProfileLogoPreview] = useState<string | null>(null)
  const [profileLogoExistingUrl, setProfileLogoExistingUrl] = useState<string | null>(null)
  const [profileFormStatus, setProfileFormStatus] = useState<StatusMessage | null>(null)
  const [profileFormBusy, setProfileFormBusy] = useState(false)
  const [profileActionBusyId, setProfileActionBusyId] = useState<string | null>(null)

  const [status, setStatus] = useState<StatusMessage | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const [qrPosition, setQrPosition] = useState<QrPosition>('bottom-left')
  const [qrPage, setQrPage] = useState<QrPage>('last')
  const [validationRequiresCode, setValidationRequiresCode] = useState(false)
  const [validationAccessCode, setValidationAccessCode] = useState('')

  // Abas do painel lateral
  const [sideTab, setSideTab] = useState<SideTab>('assinatura')

  // Drag & drop no dropzone do PDF
  const [isDraggingOver, setIsDraggingOver] = useState(false)

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
    setProfileLogoExistingUrl(null)
    setProfileLogoPreview(null)
    setProfileFormStatus(null)
    setEditingProfileId(null)
  }

  const loadProfiles = useCallback(async ({ selectId }: { selectId?: string | null } = {}) => {
    if (!supabaseClient) {
      setStatus({ tone: 'error', text: 'Serviço de perfis indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.' })
      return
    }
    const { data, error } = await supabaseClient
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

    if (list.length === 0) { setProfileId(null); return }

    if (selectId && list.some(p => p.id === selectId)) { setProfileId(selectId); return }

    setProfileId(currentId => {
      if (currentId && list.some(p => p.id === currentId)) return currentId
      return list[0].id
    })
  }, [supabaseClient])

  const selectedProfile = useMemo(
    () => profiles.find(p => p.id === profileId) ?? null,
    [profiles, profileId],
  )

  useEffect(() => {
    const boot = async () => {
      if (!supabaseClient) {
        setStatus({ tone: 'error', text: 'Serviço de autenticação indisponível.' })
        return
      }
      const session = await supabaseClient.auth.getSession()
      const userId = session.data?.session?.user?.id ?? null
      setSessionUserId(userId)
      await loadProfiles()
    }
    boot()
  }, [loadProfiles])

  useEffect(() => {
    if (!profiles.length) setProfileFormOpen(true)
  }, [profiles.length])

  useEffect(() => {
    if (!profileLogoFile) { setProfileLogoPreview(profileLogoExistingUrl ?? null); return }
    const objectUrl = URL.createObjectURL(profileLogoFile)
    setProfileLogoPreview(objectUrl)
    return () => { try { URL.revokeObjectURL(objectUrl) } catch {} }
  }, [profileLogoFile, profileLogoExistingUrl])

  // Lê dimensões de páginas do PDF
  useEffect(() => {
    if (!pdfFile) { setPdfPageCount(1); setPageSizes([]); return }
    let cancelled = false
    void (async () => {
      try {
        const ab = await pdfFile.arrayBuffer()
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf')
        try { (pdfjs as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs' } catch {}
        const loadingTask = pdfjs.getDocument({ data: ab })
        const pdf = await loadingTask.promise
        if (cancelled) { pdf.destroy?.(); return }
        const sizes: PageSize[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i)
          const vp = p.getViewport({ scale: 1 })
          sizes.push({ width: vp.width, height: vp.height })
          try { p.cleanup?.() } catch {}
        }
        setPageSizes(sizes)
        setPdfPageCount(sizes.length || 1)
        setActivePage(1)
        try { pdf.destroy?.() } catch {}
      } catch (err) {
        console.error('[Editor] Falha ao ler PDF', err)
        setStatus({ tone: 'error', text: 'Não consegui ler o PDF. Tente outro arquivo.' })
        setPageSizes([])
        setPdfPageCount(1)
      }
    })()
    return () => { cancelled = true }
  }, [pdfFile])

  useEffect(() => {
    return () => {
      if (sigPreviewUrl?.startsWith('blob:')) {
        try { URL.revokeObjectURL(sigPreviewUrl) } catch {}
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
    return () => { cancelled = true }
  }, [sigPreviewUrl, sigMode])

  // ── Drag & drop de PDF ───────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setPositions([])
      setResult(null)
      setStatus(null)
    } else {
      setError('Apenas arquivos PDF são suportados.')
    }
  }, [])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingOver(true) }
  const handleDragLeave = () => setIsDraggingOver(false)

  // ── Handlers ─────────────────────────────────────────────────────────────────
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

  const handleSubmitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (profileFormBusy) return
    if (!profileName.trim()) { setProfileFormStatus({ tone: 'error', text: 'Informe o nome do perfil.' }); return }
    setProfileFormBusy(true)
    setProfileFormStatus({ tone: 'neutral', text: editingProfileId ? 'Atualizando perfil...' : 'Salvando perfil...' })
    try {
      const client = supabaseClient
      if (!client) { setProfileFormStatus({ tone: 'error', text: 'Serviço de perfis indisponível.' }); return }
      let logoUrl: string | null = profileLogoExistingUrl
      if (profileLogoFile) {
        const storageKey = `branding/${Date.now()}-${profileLogoFile.name}`
        const upload = await client.storage.from('signflow').upload(storageKey, profileLogoFile, { contentType: profileLogoFile.type || 'image/png', upsert: true })
        if (upload.error) throw new Error(upload.error.message)
        const publicUrl = await client.storage.from('signflow').getPublicUrl(storageKey)
        logoUrl = publicUrl.data?.publicUrl ?? null
        setProfileLogoExistingUrl(logoUrl)
      }
      const theme = { color: profileColor, footer: profileFooter, issuer: profileIssuer, reg: profileReg, logo_url: logoUrl }
      if (editingProfileId) {
        const updatedId = editingProfileId
        const update = await client.from('validation_profiles').update({ name: profileName.trim(), type: profileType, theme }).eq('id', editingProfileId)
        if (update.error) throw new Error(update.error.message)
        await loadProfiles({ selectId: updatedId })
        resetProfileForm()
        setProfileFormStatus({ tone: 'success', text: 'Perfil atualizado com sucesso!' })
        setSuccess('Perfil de validação atualizado!')
      } else {
        const insert = await client.from('validation_profiles').insert({ name: profileName.trim(), type: profileType, theme }).select('id').single()
        if (insert.error) throw new Error(insert.error.message)
        const newId = insert.data?.id ?? null
        const hadNoProfiles = profiles.length === 0
        resetProfileForm()
        setProfileFormStatus({ tone: 'success', text: 'Perfil criado!' })
        setSuccess('Perfil de validação criado! Selecione-o na lista.')
        await loadProfiles({ selectId: newId })
        if (hadNoProfiles && newId) setProfileFormOpen(false)
      }
    } catch (err: any) {
      console.error('[Editor] Falha ao salvar perfil', err)
      setProfileFormStatus({ tone: 'error', text: err?.message || 'Não foi possível salvar o perfil.' })
    } finally {
      setProfileFormBusy(false)
    }
  }

  const handleEditProfile = (profile: Profile) => {
    setProfileFormOpen(true)
    setEditingProfileId(profile.id)
    setProfileName(profile.name)
    setProfileType(profile.type)
    setProfileColor(profile.theme?.color ?? DEFAULT_THEME_COLOR)
    setProfileIssuer(profile.theme?.issuer ?? DEFAULT_THEME_ISSUER)
    setProfileReg(profile.theme?.reg ?? DEFAULT_THEME_REG)
    setProfileFooter(profile.theme?.footer ?? DEFAULT_THEME_FOOTER)
    setProfileLogoFile(null)
    const existingLogo = profile.theme?.logo_url ?? null
    setProfileLogoExistingUrl(existingLogo)
    setProfileLogoPreview(existingLogo)
    setProfileFormStatus(null)
  }

  const handleDeleteProfile = async (id: string) => {
    if (profileActionBusyId) return
    const confirmed = window.confirm('Tem certeza de que deseja excluir este perfil?')
    if (!confirmed) return
    if (!supabaseClient) { setStatus({ tone: 'error', text: 'Serviço de perfis indisponível.' }); return }
    setProfileActionBusyId(id)
    setStatus({ tone: 'neutral', text: 'Excluindo perfil...' })
    try {
      const { error } = await supabaseClient.from('validation_profiles').delete().eq('id', id)
      if (error) throw new Error(error.message)
      setSuccess('Perfil excluído.')
      if (editingProfileId === id) resetProfileForm()
      if (profileId === id) setProfileId(null)
      await loadProfiles()
    } catch (err: any) {
      console.error('[Editor] Falha ao excluir perfil', err)
      setError(err?.message || 'Não foi possível excluir o perfil.')
    } finally {
      setProfileActionBusyId(null)
    }
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (sigMode !== 'draw') return
    const canvas = signCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#1f2937'
    ctx.beginPath()
    ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY)
    setSigDrawing(true); setSigHasDrawing(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (sigMode !== 'draw' || !sigDrawing) return
    const canvas = signCanvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY); ctx.stroke()
  }

  const onPointerUp = () => {
    if (sigMode !== 'draw') return
    setSigDrawing(false)
    if (sigHasDrawing && signCanvasRef.current) {
      const url = signCanvasRef.current.toDataURL('image/png')
      setSigPreviewUrl(url); setSigImgFile(null); setResult(null)
      setSignatureSize({ ...DEFAULT_SIGNATURE_CANVAS })
    }
  }

  const handlePositionsChange = useCallback((next: Pos[]) => {
    setPositions(next); setResult(null)
  }, [])

  const removePosition = (page: number) => { setPositions(current => current.filter(pos => pos.page !== page)); setResult(null) }
  const handleGoToPosition = (page: number) => setActivePage(Math.max(1, page))
  const clearPositions = () => { setPositions([]); setResult(null) }
  const handleProfileLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setProfileLogoFile(file)
    if (file) setProfileLogoExistingUrl(null)
  }
  const handlePageChange = (page: number) => setActivePage(page)
  const handleDocumentLoaded = ({ pages }: { pages: number }) => {
    if (Number.isFinite(pages) && pages > 0) setPdfPageCount(pages)
  }
  const handleSignerChange = (index: number, field: keyof Signer, value: string) => {
    setSigners(prev => { const next = prev.slice(); next[index] = { ...next[index], [field]: value }; return next })
  }
  const addSigner = () => setSigners(prev => [...prev, createEmptySigner()])
  const removeSigner = (index: number) => {
    setSigners(prev => prev.length <= 1 ? [createEmptySigner()] : prev.filter((_, idx) => idx !== index))
  }

  const computePositionsForApi = () => {
    if (!positions.length) return []
    return positions.map(pos => {
      const dims = pageSizes[pos.page - 1] ?? pageSizes[0] ?? { width: 595, height: 842 }
      const cw = dims.width; const ch = dims.height
      const nx = typeof pos.nx === 'number' && Number.isFinite(pos.nx) ? Math.max(0, Math.min(1, pos.nx)) : typeof pos.x === 'number' && Number.isFinite(pos.x) ? Math.max(0, Math.min(1, pos.x / cw)) : 0.5
      const ny = typeof pos.ny === 'number' && Number.isFinite(pos.ny) ? Math.max(0, Math.min(1, pos.ny)) : typeof pos.y === 'number' && Number.isFinite(pos.y) ? Math.max(0, Math.min(1, pos.y / ch)) : 0.5
      return { page: pos.page, nx, ny, x: nx * cw, y: ny * ch, scale: typeof pos.scale === 'number' ? pos.scale : 1, rotation: typeof pos.rotation === 'number' ? pos.rotation : 0, page_width: cw, page_height: ch }
    })
  }

  const computeSignersForMetadata = () => {
    return signers.map(signer => {
      const name = signer.name.trim()
      if (!name) return null
      return {
        name,
        reg: signer.reg.trim() || null,
        certificate_type: signer.certificate_type.trim() || null,
        certificate_valid_until: signer.certificate_valid_until.trim() || null,
        certificate_issuer: signer.certificate_issuer.trim() || null,
        email: signer.email.trim() || null,
        logo_url: signer.logo_url.trim() || null,
      }
    }).filter(Boolean) as Array<{ name: string; reg: string | null; certificate_type: string | null; certificate_valid_until: string | null; certificate_issuer: string | null; email: string | null; logo_url: string | null }>
  }

  const ensureSignatureBlob = async (): Promise<File | Blob | null> => {
    if (!sigPreviewUrl) return null
    if (sigMode === 'upload' && sigImgFile) return sigImgFile
    try { const r = await fetch(sigPreviewUrl); return await r.blob() } catch { return null }
  }

  const assinarESalvar = async () => {
    setStatus(null); setResult(null)
    if (!pdfFile) { setError('Selecione um PDF antes de continuar.'); return }
    const maxPdfBytes = MAX_PDF_SIZE_MB * 1024 * 1024
    if (pdfFile.size > maxPdfBytes) { setError(`PDF muito grande! Máximo: ${MAX_PDF_SIZE_MB}MB. Seu arquivo: ${bytesToMB(pdfFile.size)}MB.`); return }
    if (!sigPreviewUrl) { setError('Desenhe ou envie uma assinatura para continuar.'); return }
    if (!positions.length) { setError('Posicione a assinatura em ao menos uma página.'); return }
    const positionsForApi = computePositionsForApi()
    if (!positionsForApi.length) { setError('Não consegui calcular as posições da assinatura.'); return }
    const signatureBlob = await ensureSignatureBlob()
    if (!signatureBlob) { setError('Não foi possível preparar a assinatura.'); return }
    const maxSigBytes = MAX_SIGNATURE_SIZE_MB * 1024 * 1024
    if (signatureBlob.size > maxSigBytes) { setError(`Assinatura muito grande! Máximo: ${MAX_SIGNATURE_SIZE_MB}MB.`); return }
    const signersForMetadata = computeSignersForMetadata()
    if (!signersForMetadata.length) { setError('Cadastre ao menos um signatário com nome.'); return }
    const normalizedAccessCode = validationAccessCode.trim().toUpperCase()
    if (validationRequiresCode && !normalizedAccessCode) { setError('Defina um código de validação.'); return }

    setBusy(true); setInfo('Enviando arquivo…')
    try {
      const form = new FormData()
      form.append('pdf', pdfFile, pdfFile.name)
      form.append('original_pdf_name', pdfFile.name)
      form.append('positions', JSON.stringify(positionsForApi))
      form.append('signature_meta', JSON.stringify({ width: signatureSize?.width ?? DEFAULT_SIGNATURE_CANVAS.width, height: signatureSize?.height ?? DEFAULT_SIGNATURE_CANVAS.height }))
      form.append('signers', JSON.stringify(signersForMetadata))
      if (sessionUserId) form.append('user_id', sessionUserId)
      if (selectedProfile) {
        form.append('validation_profile_id', selectedProfile.id)
        form.append('validation_theme_snapshot', JSON.stringify(selectedProfile.theme || null))
      }
      form.append('qr_position', qrPosition)
      form.append('qr_page', qrPage)
      form.append('validation_requires_code', String(validationRequiresCode))
      if (validationRequiresCode) form.append('validation_access_code', normalizedAccessCode)
      if (signatureBlob instanceof File) {
        form.append('signature', signatureBlob, signatureBlob.name)
      } else {
        form.append('signature', signatureBlob, 'signature.png')
      }
      // anotações de texto
      if (textAnnotations.length > 0) {
        form.append('text_annotations', JSON.stringify(textAnnotations))
      }

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const ct = uploadRes.headers.get('content-type')
      if (!ct?.includes('application/json')) {
        const text = await uploadRes.text()
        throw new Error(`Erro do servidor (${uploadRes.status}): ${text}`)
      }
      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadJson?.error || 'Falha ao enviar PDF')
      const { id } = uploadJson as { id: string }
      setInfo('Arquivo enviado. Gerando PDF assinado…')

      const signForm = new FormData()
      signForm.append('id', id)
      const signRes = await fetch('/api/sign', { method: 'POST', body: signForm })
      const signCt = signRes.headers.get('content-type')
      if (!signCt?.includes('application/json')) {
        const text = await signRes.text()
        throw new Error(`Erro do servidor (${signRes.status}): ${text}`)
      }
      const signJson = await signRes.json()
      if (!signRes.ok) throw new Error(signJson?.error || 'Falha ao assinar documento')
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

  // Badges de resumo para cada aba
  const tabBadge: Record<SideTab, number | null> = {
    assinatura: positions.length || null,
    texto: textAnnotations.length || null,
    signatarios: signers.filter(s => s.name.trim()).length || null,
    qrcode: null,
    perfil: profiles.length || null,
  }

  const SIDE_TABS: { id: SideTab; label: string; icon: string }[] = [
    { id: 'assinatura', label: 'Assinatura', icon: '✍️' },
    { id: 'texto', label: 'Texto', icon: '🔤' },
    { id: 'signatarios', label: 'Signatários', icon: '👤' },
    { id: 'qrcode', label: 'QR Code', icon: '⬛' },
    { id: 'perfil', label: 'Perfil', icon: '🏷️' },
  ]

  if (!supabaseClient) {
    return (
      <div className="mx-auto mt-10 max-w-3xl px-4 text-amber-600">
        Serviço de edição indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-6 sm:pt-10 md:px-8">

        {/* ── Cabeçalho ── */}
        <header className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Editor de Documento</h1>
            {pdfFile && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {pdfPageCount} página{pdfPageCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Envie o PDF, adicione textos, posicione a assinatura e gere o documento assinado com QR Code.
          </p>
        </header>

        {/* ── Banner de status ── */}
        {status && (
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status.tone === 'error' ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">

          {/* ── Coluna esquerda: PDF ── */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Documento PDF</h2>
                  <p className="text-sm text-slate-500">Escolha ou arraste o arquivo que será assinado.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PrimaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                    {pdfFile ? '📄 Trocar PDF' : '📄 Selecionar PDF'}
                  </PrimaryButton>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />

              {/* Drop zone */}
              {!pdfFile && (
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition ${
                    isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-4xl">📂</span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Arraste um PDF aqui ou clique para selecionar</p>
                    <p className="mt-1 text-xs text-slate-400">Máximo {MAX_PDF_SIZE_MB} MB · somente .pdf</p>
                  </div>
                </div>
              )}

              {pdfFile && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{pdfFile.name}</p>
                    <p className="text-xs text-slate-500">{formatBytes(pdfFile.size)} · {pdfPageCount} página{pdfPageCount > 1 ? 's' : ''} · {positions.length} assinatura{positions.length !== 1 ? 's' : ''} posicionada{positions.length !== 1 ? 's' : ''}</p>
                  </div>
                  <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={busy} className="shrink-0">
                    Trocar
                  </SecondaryButton>
                </div>
              )}

              {/* Viewer do PDF */}
              <div className="mt-6">
                {pdfFile ? (
                  <PdfEditor
                    file={pdfFile}
                    signatureUrl={sigPreviewUrl}
                    signatureSize={signatureSize}
                    positions={positions}
                    onPositions={handlePositionsChange}
                    page={activePage}
                    onPageChange={handlePageChange}
                    onDocumentLoaded={handleDocumentLoaded}
                  />
                ) : (
                  <p className="text-sm text-slate-400">Selecione um PDF para visualizá-lo aqui.</p>
                )}
              </div>

              {/* Lista de assinaturas posicionadas */}
              {positions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Assinaturas posicionadas</h3>
                    <button onClick={clearPositions} disabled={busy} className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40">Limpar todas</button>
                  </div>
                  <div className="space-y-1">
                    {positions.slice().sort((a, b) => a.page - b.page).map(pos => (
                      <div key={pos.page} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        <span>
                          <span className="font-semibold text-slate-800">p. {pos.page}</span>
                          <span className="ml-2 text-slate-400">{(pos.nx * 100).toFixed(0)}% × {(pos.ny * 100).toFixed(0)}% · {(pos.scale ?? 1).toFixed(2)}× · {(pos.rotation ?? 0).toFixed(0)}°</span>
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => handleGoToPosition(pos.page)} disabled={busy} className="h-6 rounded border border-slate-200 bg-white px-2 hover:bg-slate-100">↗</button>
                          <button onClick={() => removePosition(pos.page)} disabled={busy} className="h-6 rounded border border-red-100 bg-white px-2 text-red-500 hover:bg-red-50">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── Coluna direita: painel de abas ── */}
          <div className="space-y-4">

            {/* Tabs de navegação */}
            <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              {SIDE_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSideTab(tab.id)}
                  className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-xs font-medium transition min-w-[60px] ${
                    sideTab === tab.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tabBadge[tab.id] !== null && (
                    <span className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      sideTab === tab.id ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                    }`}>
                      {tabBadge[tab.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Aba: Assinatura ── */}
            {sideTab === 'assinatura' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Assinatura</h2>
                  <p className="text-xs text-slate-500">Desenhe no navegador ou envie uma imagem transparente.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSigMode('draw')}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                      sigMode === 'draw' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >✍️ Desenhar</button>
                  <button
                    onClick={() => setSigMode('upload')}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${
                      sigMode === 'upload' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >📤 Importar</button>
                </div>

                {sigMode === 'draw' ? (
                  <div>
                    <canvas
                      ref={signCanvasRef}
                      width={DEFAULT_SIGNATURE_CANVAS.width}
                      height={DEFAULT_SIGNATURE_CANVAS.height}
                      className="w-full rounded-xl border border-slate-200 bg-white shadow-inner"
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      style={{ touchAction: 'none', cursor: 'crosshair' }}
                    />
                    <p className="mt-1 text-xs text-slate-400">Use o mouse ou o dedo para desenhar.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600">Enviar imagem (PNG recomendado)</label>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm text-slate-600" onChange={handleSignatureUpload} disabled={busy} />
                    <p className="text-xs text-slate-400">Fundo transparente garante melhor resultado.</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <SecondaryButton type="button" onClick={resetSignature} disabled={busy || (!sigPreviewUrl && !sigHasDrawing)} className="text-sm">
                    🗑 Limpar
                  </SecondaryButton>
                  {sigPreviewUrl && (
                    <span className="text-xs text-slate-400">
                      {(signatureSize?.width ?? DEFAULT_SIGNATURE_CANVAS.width).toFixed(0)} × {(signatureSize?.height ?? DEFAULT_SIGNATURE_CANVAS.height).toFixed(0)} px
                    </span>
                  )}
                </div>

                {sigPreviewUrl && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-medium text-slate-500">Pré-visualização</p>
                    <img src={sigPreviewUrl} alt="Assinatura" className="max-h-28 w-auto rounded border border-slate-200 bg-white px-3 py-2" />
                    {!positions.length && pdfFile && (
                      <p className="mt-2 text-xs text-amber-600">⚠ Clique no PDF ao lado para posicionar.</p>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── Aba: Texto ── */}
            {sideTab === 'texto' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-slate-900">Adicionar Texto</h2>
                  <p className="text-xs text-slate-500">Insira campos de texto em qualquer página do documento.</p>
                </div>
                {pdfFile ? (
                  <PdfTextOverlay
                    totalPages={pdfPageCount}
                    currentPage={activePage}
                    annotations={textAnnotations}
                    onAnnotations={setTextAnnotations}
                    onGoToPage={handleGoToPosition}
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-400 text-center">
                    Selecione um PDF para adicionar textos.
                  </p>
                )}
              </section>
            )}

            {/* ── Aba: Signatários ── */}
            {sideTab === 'signatarios' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Signatários</h2>
                    <p className="text-xs text-slate-500">Pessoas responsáveis pela assinatura do documento.</p>
                  </div>
                  <PrimaryButton type="button" onClick={addSigner} disabled={busy} className="text-xs">
                    + Adicionar
                  </PrimaryButton>
                </div>
                <div className="space-y-4">
                  {signers.map((signer, index) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-semibold text-slate-700">Signatário {index + 1}</span>
                        <button onClick={() => removeSigner(index)} disabled={busy} className="text-xs text-red-500 hover:text-red-700">Remover</button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { key: 'name', label: 'Nome completo *', placeholder: 'Dra. Maria Oliveira', type: 'text' },
                          { key: 'reg', label: 'Registro profissional', placeholder: 'CRM/DF 12345', type: 'text' },
                          { key: 'email', label: 'E-mail', placeholder: 'contato@exemplo.com', type: 'email' },
                          { key: 'certificate_type', label: 'Tipo de certificado', placeholder: 'ICP-Brasil A3', type: 'text' },
                          { key: 'certificate_issuer', label: 'Emissor', placeholder: 'AC Valid, SERPRO', type: 'text' },
                          { key: 'certificate_valid_until', label: 'Validade', placeholder: '', type: 'date' },
                        ].map(field => (
                          <div key={field.key} className="space-y-1">
                            <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{field.label}</label>
                            <input
                              type={field.type}
                              value={signer[field.key as keyof Signer]}
                              onChange={e => handleSignerChange(index, field.key as keyof Signer, e.target.value)}
                              placeholder={field.placeholder}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                              disabled={busy}
                              required={field.key === 'name'}
                            />
                          </div>
                        ))}
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Logo individual (URL)</label>
                          <input type="url" value={signer.logo_url} onChange={e => handleSignerChange(index, 'logo_url', e.target.value)} placeholder="https://exemplo.com/logo.png" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none" disabled={busy} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Aba: QR Code ── */}
            {sideTab === 'qrcode' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">QR Code de Validação</h2>
                  <p className="text-xs text-slate-500">Configure onde o QR Code será inserido no documento.</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                  <div className="flex items-start gap-3">
                    <input id="requires-code" type="checkbox" checked={validationRequiresCode}
                      onChange={e => {
                        const checked = e.target.checked
                        setValidationRequiresCode(checked)
                        if (checked && !validationAccessCode.trim()) setValidationAccessCode(generateAccessCode())
                      }}
                      disabled={busy} className="mt-0.5"
                    />
                    <label htmlFor="requires-code" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Exigir código de validação
                      <span className="block text-xs font-normal text-slate-400">O link público pedirá um código antes de mostrar os detalhes.</span>
                    </label>
                  </div>
                  {validationRequiresCode && (
                    <div className="flex gap-2">
                      <input
                        value={validationAccessCode}
                        onChange={e => setValidationAccessCode(e.target.value.toUpperCase())}
                        placeholder="Ex.: 8H2K9M7Q"
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-700 focus:border-blue-400 focus:outline-none"
                        disabled={busy}
                      />
                      <button onClick={() => setValidationAccessCode(generateAccessCode())} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50">
                        Gerar
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Posição</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'bottom-left', label: '↙ Inferior Esq.' },
                      { val: 'bottom-right', label: '↘ Inferior Dir.' },
                      { val: 'top-left', label: '↖ Superior Esq.' },
                      { val: 'top-right', label: '↗ Superior Dir.' },
                    ].map(opt => (
                      <label key={opt.val} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        qrPosition === opt.val ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                        <input type="radio" name="qr-position" checked={qrPosition === opt.val as QrPosition} onChange={() => setQrPosition(opt.val as QrPosition)} disabled={busy} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Páginas</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'last', label: 'Última' },
                      { val: 'first', label: 'Primeira' },
                      { val: 'all', label: 'Todas' },
                    ].map(opt => (
                      <label key={opt.val} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                        qrPage === opt.val ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                        <input type="radio" name="qr-page" checked={qrPage === opt.val as QrPage} onChange={() => setQrPage(opt.val as QrPage)} disabled={busy} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
                  O QR Code ficará no canto <strong>{qrPosition === 'bottom-left' ? 'inferior esquerdo' : qrPosition === 'bottom-right' ? 'inferior direito' : qrPosition === 'top-left' ? 'superior esquerdo' : 'superior direito'}</strong> da{' '}
                  <strong>{qrPage === 'last' ? 'última página' : qrPage === 'first' ? 'primeira página' : 'todas as páginas'}</strong>.
                </div>
              </section>
            )}

            {/* ── Aba: Perfil de validação ── */}
            {sideTab === 'perfil' && (
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Perfil de Validação</h2>
                    <p className="text-xs text-slate-500">Personalize o carimbo com dados do profissional ou instituição.</p>
                  </div>
                  <SecondaryButton type="button" onClick={() => { resetProfileForm(); setProfileFormOpen(true) }} disabled={profileFormBusy} className="text-xs">
                    + Novo
                  </SecondaryButton>
                </div>

                {profiles.length > 0 ? (
                  <ul className="space-y-2">
                    {profiles.map(profile => (
                      <li key={profile.id}>
                        <div className="flex flex-col gap-2">
                          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                            profileId === profile.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                          }`}>
                            <input type="radio" name="profile" value={profile.id} checked={profileId === profile.id} onChange={() => setProfileId(profile.id)} className="mt-0.5" />
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${profileBadge(profile.type)}`}>{PROFILE_TYPE_LABEL[profile.type]}</span>
                                <span className="truncate text-sm font-semibold text-slate-900">{profile.name}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">{profile.theme?.issuer || '—'} · {profile.theme?.reg || '—'}</p>
                            </div>
                          </label>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditProfile(profile)} disabled={profileFormBusy || profileActionBusyId === profile.id} className="flex-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs text-slate-600 hover:bg-slate-50">Editar</button>
                            <button onClick={() => handleDeleteProfile(profile.id)} disabled={profileFormBusy || profileActionBusyId === profile.id} className="flex-1 rounded-lg border border-red-100 bg-white py-1.5 text-xs text-red-500 hover:bg-red-50">Excluir</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-400">Nenhum perfil cadastrado. Crie o primeiro.</p>
                )}

                {profileFormOpen && (
                  <form onSubmit={handleSubmitProfile} className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">{editingProfileId ? 'Editar perfil' : 'Novo perfil'}</h3>
                      <button type="button" onClick={() => { setProfileFormOpen(false); resetProfileForm() }} disabled={profileFormBusy} className="text-xs text-slate-400 hover:text-slate-600">✕ Fechar</button>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Nome do perfil</label>
                      <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Ex.: Médico CRM/DF" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" disabled={profileFormBusy} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Tipo</label>
                      <div className="flex gap-3 text-sm">
                        {(['medico', 'faculdade', 'generico'] as ProfileType[]).map(t => (
                          <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="radio" name="profile-type" checked={profileType === t} onChange={() => setProfileType(t)} disabled={profileFormBusy} />
                            {PROFILE_TYPE_LABEL[t]}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Cor tema</label>
                        <input type="color" value={profileColor} onChange={e => setProfileColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-slate-300" disabled={profileFormBusy} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Logo (imagem)</label>
                        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProfileLogoChange} disabled={profileFormBusy} className="block w-full text-xs text-slate-600" />
                        {profileLogoPreview && <img src={profileLogoPreview} alt="logo" className="mt-1 h-10 w-auto rounded border border-slate-200 bg-white object-contain p-1" />}
                      </div>
                    </div>

                    {[
                      { key: 'issuer', label: 'Instituição / Profissional', state: profileIssuer, setState: setProfileIssuer },
                      { key: 'reg', label: 'Registro', state: profileReg, setState: setProfileReg },
                    ].map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{field.label}</label>
                        <input value={field.state} onChange={e => field.setState(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" disabled={profileFormBusy} />
                      </div>
                    ))}

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Rodapé</label>
                      <textarea value={profileFooter} onChange={e => setProfileFooter(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none" disabled={profileFormBusy} />
                    </div>

                    {profileFormStatus && (
                      <div className={`rounded-lg border px-3 py-2 text-xs ${
                        profileFormStatus.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : profileFormStatus.tone === 'error' ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}>{profileFormStatus.text}</div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <PrimaryButton type="submit" disabled={profileFormBusy} className="flex-1 text-sm">
                        {profileFormBusy ? (editingProfileId ? 'Atualizando…' : 'Salvando…') : (editingProfileId ? 'Atualizar' : 'Salvar perfil')}
                      </PrimaryButton>
                    </div>
                  </form>
                )}
              </section>
            )}

            {/* ── Resultado ── */}
            {result && (
              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <h2 className="text-base font-semibold text-emerald-800">✅ Documento assinado!</h2>
                <div className="space-y-2">
                  {result.signed_pdf_url && (
                    <Link href={result.signed_pdf_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50">
                      📥 Baixar PDF assinado <span className="text-xs text-blue-400">Abrir ↗</span>
                    </Link>
                  )}
                  {result.qr_code_url && (
                    <Link href={result.qr_code_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50">
                      🔲 Ver QR Code <span className="text-xs text-blue-400">Abrir ↗</span>
                    </Link>
                  )}
                  {result.validate_url && (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      Link de validação:
                      <Link href={result.validate_url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate font-medium text-blue-600">{result.validate_url}</Link>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ── Barra de ação inferior ── */}
        <div className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-5 py-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {result
              ? '✅ Documento assinado. Compartilhe os links acima.'
              : !pdfFile ? '📄 Selecione um PDF para começar'
              : !sigPreviewUrl ? '✍️ Adicione uma assinatura'
              : !positions.length ? '📌 Posicione a assinatura no PDF'
              : `🚀 Pronto para gerar — ${positions.length} assinatura${positions.length > 1 ? 's' : ''}, ${textAnnotations.length} texto${textAnnotations.length !== 1 ? 's' : ''}`
            }
          </div>
          <div className="flex flex-wrap gap-2">
            {positions.length > 0 && (
              <SecondaryButton type="button" onClick={clearPositions} disabled={busy}>Limpar posições</SecondaryButton>
            )}
            <PrimaryButton type="button" onClick={assinarESalvar} disabled={disableAction} className="min-w-[180px]">
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                  Processando…
                </span>
              ) : '🖊 Gerar PDF assinado'}
            </PrimaryButton>
          </div>
        </div>

      </div>
    </div>
  )
}
