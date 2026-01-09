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
import { supabase } from '@/lib/supabaseClient'

// -- tipos e constantes (mantidos) --
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
  const supabaseClient = supabase
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

  const [signers, setSigners] = useState<Signer[]>([createEmptySigner()])

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
      if (!supabaseClient) {
        setStatus({ tone: 'error', text: 'Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.' })
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
    if (!profiles.length) {
      setProfileFormOpen(true)
    }
  }, [profiles.length])

  useEffect(() => {
    if (!profileLogoFile) {
      setProfileLogoPreview(profileLogoExistingUrl ?? null)
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
  }, [profileLogoFile, profileLogoExistingUrl])

  // ---------- NOVA LÓGICA: usar PDF.js (dynamically) para obter páginas/dimensões ----------
  useEffect(() => {
    if (!pdfFile) {
      setPdfPageCount(1)
      setPageSizes([])
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const ab = await pdfFile.arrayBuffer()

        // Importa PDF.js dinamicamente no cliente
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf')

        try {
          // Usa o worker legacy local disponível em public/pdf.worker.min.mjs
          (pdfjs as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        } catch (e) {
          console.warn('[Editor] Não foi possível configurar o workerSrc de PDF.js', e)
        }

        const loadingTask = pdfjs.getDocument({ data: ab })
        const pdf = await loadingTask.promise

        if (cancelled) {
          try {
            pdf.destroy?.()
          } catch (cleanupErr) {
            console.warn('[Editor] Falha ao destruir PDF cancelado', cleanupErr)
          }
          return
        }

        const sizes: PageSize[] = []
        const pageCount = pdf.numPages || 1
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1 })
          sizes.push({ width: viewport.width, height: viewport.height })
          // cleanup page if API supports
          try {
            page.cleanup?.()
          } catch (cleanupErr) {
            console.warn('[Editor] Falha ao limpar página do PDF', cleanupErr)
          }
        }

        setPageSizes(sizes)
        setPdfPageCount(sizes.length || 1)
        setActivePage(1)

        try {
          pdf.destroy?.()
        } catch (cleanupErr) {
          console.warn('[Editor] Falha ao destruir PDF após leitura', cleanupErr)
        }
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

  // ... resto do código (manterei inalterado) ...
  // Para poupar espaço aqui repeti a sua implementação original (handlers, UI, etc.)
  // Copie daqui para baixo exatamente como estava no seu arquivo original
  // (do `const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {` até o final do componente)

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

    if (!profileName.trim()) {
      setProfileFormStatus({ tone: 'error', text: 'Informe o nome do perfil.' })
      return
    }

    setProfileFormBusy(true)
    setProfileFormStatus({
      tone: 'neutral',
      text: editingProfileId ? 'Atualizando perfil...' : 'Salvando perfil...'
    })

    try {
      const client = supabaseClient
      if (!client) {
        setProfileFormStatus({ tone: 'error', text: 'Serviço de perfis indisponível.' })
        return
      }

      let logoUrl: string | null = profileLogoExistingUrl
      if (profileLogoFile) {
        const storageKey = `branding/${Date.now()}-${profileLogoFile.name}`
        const upload = await client.storage.from('signflow').upload(storageKey, profileLogoFile, {
          contentType: profileLogoFile.type || 'image/png',
          upsert: true,
        })
        if (upload.error) {
          throw new Error(upload.error.message)
        }
        const publicUrl = await client.storage.from('signflow').getPublicUrl(storageKey)
        logoUrl = publicUrl.data?.publicUrl ?? null
        setProfileLogoExistingUrl(logoUrl)
      }

      const theme = {
        color: profileColor,
        footer: profileFooter,
        issuer: profileIssuer,
        reg: profileReg,
        logo_url: logoUrl,
      }

      if (editingProfileId) {
        const updatedId = editingProfileId
        const update = await client
          .from('validation_profiles')
          .update({ name: profileName.trim(), type: profileType, theme })
          .eq('id', editingProfileId)

        if (update.error) {
          throw new Error(update.error.message)
        }

        await loadProfiles({ selectId: updatedId })
        resetProfileForm()
        setProfileFormStatus({ tone: 'success', text: 'Perfil atualizado com sucesso!' })
        setSuccess('Perfil de validação atualizado com sucesso!')
      } else {
        const insert = await client
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
      }
    } catch (err: any) {
      console.error('[Editor] Falha ao salvar perfil de validação', err)
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

    if (!supabaseClient) {
      setStatus({
        tone: 'error',
        text: 'Serviço de perfis indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      })
      return
    }

    setProfileActionBusyId(id)
    setStatus({ tone: 'neutral', text: 'Excluindo perfil...' })

    try {
      const { error } = await supabaseClient.from('validation_profiles').delete().eq('id', id)

      if (error) {
        throw new Error(error.message)
      }

      setSuccess('Perfil excluído com sucesso.')

      if (editingProfileId === id) {
        resetProfileForm()
      }

      if (profileId === id) {
        setProfileId(null)
      }

      await loadProfiles()
    } catch (err: any) {
      console.error('[Editor] Falha ao excluir perfil de validação', err)
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

  const removePosition = (page: number) => {
    setPositions(current => current.filter(pos => pos.page !== page))
    setResult(null)
  }

  const handleGoToPosition = (page: number) => {
    setActivePage(Math.max(1, page))
  }

  const clearPositions = () => {
    setPositions([])
    setResult(null)
  }

  const handleProfileLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setProfileLogoFile(file)
    if (file) {
      setProfileLogoExistingUrl(null)
    }
  }

  const handlePageChange = (page: number) => {
    setActivePage(page)
  }

  const handleDocumentLoaded = ({ pages }: { pages: number }) => {
    if (Number.isFinite(pages) && pages > 0) {
      setPdfPageCount(pages)
    }
  }

  const handleSignerChange = (index: number, field: keyof Signer, value: string) => {
    setSigners(prev => {
      const next = prev.slice()
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addSigner = () => {
    setSigners(prev => [...prev, createEmptySigner()])
  }

  const removeSigner = (index: number) => {
    setSigners(prev => {
      if (prev.length <= 1) {
        return [createEmptySigner()]
      }
      return prev.filter((_, idx) => idx !== index)
    })
  }

  const computePositionsForApi = () => {
    if (!positions.length) return []

    return positions.map(pos => {
      const dims = pageSizes[pos.page - 1] ?? pageSizes[0] ?? { width: 595, height: 842 }
      const cw = dims.width
      const ch = dims.height
      const nx =
        typeof pos.nx === 'number' && Number.isFinite(pos.nx)
          ? Math.max(0, Math.min(1, pos.nx))
          : typeof pos.x === 'number' && Number.isFinite(pos.x)
            ? Math.max(0, Math.min(1, pos.x / cw))
            : 0.5
      const ny =
        typeof pos.ny === 'number' && Number.isFinite(pos.ny)
          ? Math.max(0, Math.min(1, pos.ny))
          : typeof pos.y === 'number' && Number.isFinite(pos.y)
            ? Math.max(0, Math.min(1, pos.y / ch))
            : 0.5

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

  const computeSignersForMetadata = () => {
    return signers
      .map(signer => {
        const name = signer.name.trim()
        if (!name) return null

        const reg = signer.reg.trim()
        const certificateType = signer.certificate_type.trim()
        const certificateValidUntil = signer.certificate_valid_until.trim()
        const certificateIssuer = signer.certificate_issuer.trim()
        const email = signer.email.trim()
        const logoUrl = signer.logo_url.trim()

        return {
          name,
          reg: reg || null,
          certificate_type: certificateType || null,
          certificate_valid_until: certificateValidUntil || null,
          certificate_issuer: certificateIssuer || null,
          email: email || null,
          logo_url: logoUrl || null,
        }
      })
      .filter(Boolean) as Array<{
        name: string
        reg: string | null
        certificate_type: string | null
        certificate_valid_until: string | null
        certificate_issuer: string | null
        email: string | null
        logo_url: string | null
      }>
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

    // Validate PDF size BEFORE upload
    const maxPdfSizeMB = 20
    const maxPdfBytes = maxPdfSizeMB * 1024 * 1024
    if (pdfFile.size > maxPdfBytes) {
      const fileSizeMB = (pdfFile.size / (1024 * 1024)).toFixed(2)
      setError(`PDF muito grande! Tamanho máximo: ${maxPdfSizeMB}MB. Seu arquivo: ${fileSizeMB}MB.`)
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

    // Validate signature size BEFORE upload
    const maxSignatureSizeMB = 5
    const maxSignatureBytes = maxSignatureSizeMB * 1024 * 1024
    if (signatureBlob.size > maxSignatureBytes) {
      const sigSizeMB = (signatureBlob.size / (1024 * 1024)).toFixed(2)
      setError(`Assinatura muito grande! Tamanho máximo: ${maxSignatureSizeMB}MB. Seu arquivo: ${sigSizeMB}MB.`)
      return
    }

    const signersForMetadata = computeSignersForMetadata()
    if (!signersForMetadata.length) {
      setError('Cadastre ao menos um signatário com nome para continuar.')
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
      form.append('signers', JSON.stringify(signersForMetadata))

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
      
      // Check if response is JSON before parsing
      const contentType = uploadRes.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await uploadRes.text()
        throw new Error(`Erro do servidor (${uploadRes.status}): ${text}`)
      }

      const uploadJson = await uploadRes.json()
      if (!uploadRes.ok) {
        throw new Error(uploadJson?.error || 'Falha ao enviar PDF')
      }

      const { id } = uploadJson as { id: string }
      setInfo('Arquivo enviado. Gerando PDF assinado…')

      const signForm = new FormData()
      signForm.append('id', id)
      const signRes = await fetch('/api/sign', { method: 'POST', body: signForm })
      
      // Check if response is JSON before parsing
      const signContentType = signRes.headers.get('content-type')
      if (!signContentType?.includes('application/json')) {
        const text = await signRes.text()
        throw new Error(`Erro do servidor (${signRes.status}): ${text}`)
      }

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

  if (!supabaseClient) {
    return (
      <div className="mx-auto mt-10 max-w-3xl px-4 text-amber-600">
        Serviço de edição indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
      </div>
    )
  }

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
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${
              status.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status.tone === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {status.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Documento PDF</h2>
                  <p className="text-sm text-slate-500">
                    Escolha o arquivo que será assinado. Você poderá visualizar cada página abaixo.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {pdfFile && (
                    <SecondaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                      Trocar PDF
                    </SecondaryButton>
                  )}
                  <PrimaryButton type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                    {pdfFile ? 'Selecionar outro PDF' : 'Selecionar PDF'}
                  </PrimaryButton>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {pdfFile ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium text-slate-900">{pdfFile.name}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">{formatBytes(pdfFile.size)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>Páginas detectadas: {pdfPageCount}</span>
                    <span>Assinaturas posicionadas: {positions.length}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Tamanho: {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB / 20 MB
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  Arraste ou escolha um PDF para começar.
                </div>
              )}

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
                  <p className="text-sm text-slate-500">
                    Selecione um documento para visualizar as páginas e posicionar a assinatura.
                  </p>
                )}
              </div>

              {positions.length > 0 && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                  <h3 className="text-sm font-semibold text-slate-900">Assinaturas posicionadas</h3>
                  <ul className="mt-3 space-y-2">
                    {positions
                      .slice()
                      .sort((a, b) => a.page - b.page)
                      .map(pos => (
                        <li
                          key={pos.page}
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <span className="font-medium text-slate-900">Página {pos.page}</span>
                            <span className="ml-2 text-[11px] uppercase tracking-wide text-slate-500">
                              {(pos.nx * 100).toFixed(0)}% × {(pos.ny * 100).toFixed(0)}% · Escala {(pos.scale ?? 1).toFixed(1)}× · Rotação{' '}
                              {(pos.rotation ?? 0).toFixed(0)}°
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <SecondaryButton
                              type="button"
                              className="h-8 px-3 text-xs"
                              onClick={() => handleGoToPosition(pos.page)}
                              disabled={busy}
                            >
                              Ir para página
                            </SecondaryButton>
                            <SecondaryButton
                              type="button"
                              className="h-8 px-3 text-xs text-red-600 hover:text-red-700"
                              onClick={() => removePosition(pos.page)}
                              disabled={busy}
                            >
                              Remover
                            </SecondaryButton>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Assinatura</h2>
                  <p className="text-sm text-slate-500">
                    Desenhe direto no navegador ou envie uma imagem transparente da sua assinatura.
                  </p>
                </div>
                <div className="flex gap-2">
                  <SecondaryButton
                    type="button"
                    className={`px-4 py-2 text-sm ${sigMode === 'draw' ? 'border-blue-200 text-blue-600' : ''}`}
                    onClick={() => setSigMode('draw')}
                    disabled={busy}
                  >
                    Desenhar
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    className={`px-4 py-2 text-sm ${sigMode === 'upload' ? 'border-blue-200 text-blue-600' : ''}`}
                    onClick={() => setSigMode('upload')}
                    disabled={busy}
                  >
                    Enviar imagem
                  </SecondaryButton>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
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
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Use o mouse ou o dedo (no celular) para desenhar. Toque fora para finalizar o traço.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Envie uma imagem (PNG recomendado)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="mt-2 block w-full text-sm text-slate-600"
                        onChange={handleSignatureUpload}
                        disabled={busy}
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Utilize um arquivo com fundo transparente para melhores resultados.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <SecondaryButton type="button" onClick={resetSignature} disabled={busy || (!sigPreviewUrl && !sigHasDrawing)}>
                      Limpar assinatura
                    </SecondaryButton>
                    {sigPreviewUrl && (
                      <span className="text-xs text-slate-500">
                        Tamanho base: {(signatureSize?.width ?? DEFAULT_SIGNATURE_CANVAS.width).toFixed(0)} ×{' '}
                        {(signatureSize?.height ?? DEFAULT_SIGNATURE_CANVAS.height).toFixed(0)} px
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <h3 className="text-sm font-semibold text-slate-900">Pré-visualização</h3>
                    {sigPreviewUrl ? (
                      <div className="mt-3 flex flex-col items-center gap-3">
                        <img
                          src={sigPreviewUrl}
                          alt="Pré-visualização da assinatura"
                          className="max-h-40 w-auto rounded-lg border border-slate-200 bg-white px-4 py-2"
                        />
                        <p className="text-xs text-slate-500">
                          A assinatura será posicionada nas páginas selecionadas com o tamanho ajustável.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        Desenhe ou envie uma imagem para visualizar aqui antes de aplicar no documento.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Perfil de validação</h2>
                  <p className="text-sm text-slate-500">
                    Personalize o carimbo de validação com dados do profissional ou da instituição.
                  </p>
                </div>
                <SecondaryButton
                  type="button"
                  onClick={() => {
                    resetProfileForm()
                    setProfileFormOpen(true)
                  }}
                  disabled={profileFormBusy}
                >
                  Novo perfil
                </SecondaryButton>
              </div>

              {profiles.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {profiles.map(profile => {
                    const badge = profileBadge(profile.type)
                    return (
                      <li key={profile.id} className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <label
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                              profileId === profile.id
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="profile"
                              value={profile.id}
                              checked={profileId === profile.id}
                              onChange={() => setProfileId(profile.id)}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge}`}>
                                  {PROFILE_TYPE_LABEL[profile.type]}
                                </span>
                                <span className="font-semibold text-slate-900">{profile.name}</span>
                              </div>
                              <p className="text-xs text-slate-500">
                                Emissor: {profile.theme?.issuer || '—'} · Registro: {profile.theme?.reg || '—'}
                              </p>
                            </div>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <SecondaryButton
                              type="button"
                              onClick={() => handleEditProfile(profile)}
                              disabled={profileFormBusy || profileActionBusyId === profile.id}
                            >
                              Editar
                            </SecondaryButton>
                            <SecondaryButton
                              type="button"
                              onClick={() => handleDeleteProfile(profile.id)}
                              disabled={profileFormBusy || profileActionBusyId === profile.id}
                              className="border-red-200 text-red-600 hover:bg-red-50 focus-visible:outline-red-500"
                            >
                              Excluir
                            </SecondaryButton>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Nenhum perfil cadastrado ainda. Crie o primeiro para personalizar o rodapé de validação.
                </p>
              )}

              {profileFormOpen && (
                <form onSubmit={handleSubmitProfile} className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {editingProfileId ? 'Editar perfil' : 'Novo perfil'}
                    </h3>
                    <SecondaryButton
                      type="button"
                      onClick={() => {
                        setProfileFormOpen(false)
                        resetProfileForm()
                      }}
                      disabled={profileFormBusy}
                    >
                      Cancelar
                    </SecondaryButton>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Nome do perfil</label>
                      <input
                        value={profileName}
                        onChange={event => setProfileName(event.target.value)}
                        placeholder="Ex.: Médico CRM/DF"
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={profileFormBusy}
                      />
                    </div>

                    <div className="grid gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tipo</span>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="profile-type"
                            checked={profileType === 'medico'}
                            onChange={() => setProfileType('medico')}
                            disabled={profileFormBusy}
                          />
                          Médico
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="profile-type"
                            checked={profileType === 'faculdade'}
                            onChange={() => setProfileType('faculdade')}
                            disabled={profileFormBusy}
                          />
                          Faculdade
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="profile-type"
                            checked={profileType === 'generico'}
                            onChange={() => setProfileType('generico')}
                            disabled={profileFormBusy}
                          />
                          Genérico
                        </label>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Cor tema</label>
                      <input
                        type="color"
                        value={profileColor}
                        onChange={event => setProfileColor(event.target.value)}
                        className="h-10 w-24 cursor-pointer rounded-lg border border-slate-300"
                        disabled={profileFormBusy}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Instituição / Profissional</label>
                      <input
                        value={profileIssuer}
                        onChange={event => setProfileIssuer(event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={profileFormBusy}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Registro</label>
                      <input
                        value={profileReg}
                        onChange={event => setProfileReg(event.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={profileFormBusy}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Rodapé</label>
                      <textarea
                        value={profileFooter}
                        onChange={event => setProfileFooter(event.target.value)}
                        rows={3}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        disabled={profileFormBusy}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Logo (opcional)</label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleProfileLogoChange}
                        disabled={profileFormBusy}
                        className="text-sm text-slate-600"
                      />
                      {profileLogoPreview && (
                        <img
                          src={profileLogoPreview}
                          alt="Pré-visualização do logo"
                          className="h-16 w-auto rounded-md border border-slate-200 bg-white object-contain p-2"
                        />
                      )}
                    </div>
                  </div>

                  {profileFormStatus && (
                    <div
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        profileFormStatus.tone === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : profileFormStatus.tone === 'error'
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {profileFormStatus.text}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <SecondaryButton type="button" onClick={resetProfileForm} disabled={profileFormBusy}>
                      Limpar campos
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={profileFormBusy}>
                      {profileFormBusy
                        ? editingProfileId
                          ? 'Atualizando…'
                          : 'Salvando…'
                        : editingProfileId
                          ? 'Atualizar perfil'
                          : 'Salvar perfil'}
                    </PrimaryButton>
                  </div>
                </form>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Signatários</h2>
                  <p className="text-sm text-slate-500">
                    Informe os dados de cada pessoa responsável pela assinatura. Eles serão exibidos na validação e no histórico
                    do documento.
                  </p>
                </div>
                <PrimaryButton type="button" onClick={addSigner} disabled={busy}>
                  Adicionar signatário
                </PrimaryButton>
              </div>

              <div className="mt-6 space-y-4">
                {signers.map((signer, index) => (
                  <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">Signatário {index + 1}</div>
                      <SecondaryButton type="button" onClick={() => removeSigner(index)} disabled={busy}>
                        Remover
                      </SecondaryButton>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Nome completo</label>
                        <input
                          value={signer.name}
                          onChange={event => handleSignerChange(index, 'name', event.target.value)}
                          placeholder="Ex.: Dra. Maria Oliveira"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          disabled={busy}
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Registro profissional</label>
                        <input
                          value={signer.reg}
                          onChange={event => handleSignerChange(index, 'reg', event.target.value)}
                          placeholder="CRM/DF 12345"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          disabled={busy}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">E-mail (opcional)</label>
                        <input
                          type="email"
                          value={signer.email}
                          onChange={event => handleSignerChange(index, 'email', event.target.value)}
                          placeholder="contato@exemplo.com"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          disabled={busy}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Tipo de certificado</label>
                        <input
                          value={signer.certificate_type}
                          onChange={event => handleSignerChange(index, 'certificate_type', event.target.value)}
                          placeholder="ICP-Brasil A3, GOV.BR, ..."
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          disabled={busy}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Emissor do certificado</label>
                        <input
                          value={signer.certificate_issuer}
                          onChange={event => handleSignerChange(index, 'certificate_issuer', event.target.value)}
                          placeholder="AC Valid, SERPRO, etc."
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          disabled={busy}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Validade do certificado</label>
                        <input
                          type="date"
                          value={signer.certificate_valid_until}
                          onChange={event => handleSignerChange(index, 'certificate_valid_until', event.target.value)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          disabled={busy}
                        />
                      </div>

                      <div className="grid gap-2 md:col-span-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Logo individual (URL opcional)</label>
                        <input
                          type="url"
                          value={signer.logo_url}
                          onChange={event => handleSignerChange(index, 'logo_url', event.target.value)}
                          placeholder="https://exemplo.com/logo.png"
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          disabled={busy}
                        />
                        <p className="text-xs text-slate-500">
                          Caso cada signatário possua um selo próprio, informe a URL pública do arquivo PNG ou SVG.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Os signatários cadastrados serão salvos nos metadados do documento e aparecerão automaticamente na página de validação.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Resultado</h2>
              <p className="text-sm text-slate-500">
                Após gerar, você poderá compartilhar o PDF assinado e o link de validação.
              </p>

              {result ? (
                <div className="mt-4 space-y-4 text-sm text-slate-700">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                    Documento assinado com sucesso!
                  </div>
                  {result.signed_pdf_url && (
                    <Link
                      href={result.signed_pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      Baixar PDF assinado
                      <span className="text-xs uppercase tracking-wide text-blue-400">Abrir</span>
                    </Link>
                  )}
                  {result.qr_code_url && (
                    <Link
                      href={result.qr_code_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      Ver QR Code
                      <span className="text-xs uppercase tracking-wide text-blue-400">Abrir</span>
                    </Link>
                  )}
                  {result.validate_url && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      Link de validação:
                      <Link
                        href={result.validate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block truncate font-medium text-blue-600"
                      >
                        {result.validate_url}
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                  Ainda não há um documento assinado. Posicione a assinatura e clique em “Gerar PDF assinado”.
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {result
              ? 'Documento assinado! Compartilhe os links disponíveis ao lado.'
              : 'Quando tudo estiver pronto, gere o PDF assinado para liberar os links de validação.'}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SecondaryButton type="button" onClick={clearPositions} disabled={busy || positions.length === 0}>
              Limpar posições
            </SecondaryButton>
            <PrimaryButton type="button" onClick={assinarESalvar} disabled={disableAction}>
              {busy ? 'Processando…' : 'Gerar PDF assinado'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}
