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

  // ---------- NOVA LÓGICA: usar PDF.js (dynamically) para obter páginas/dimensões ----------
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

        // Importa PDF.js dinamicamente no cliente
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf')

        // Tenta carregar worker dinamicamente (fallback silencioso)
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const worker = await import('pdfjs-dist/build/pdf.worker.entry')
          // Em alguns bundlers o default contém o path; em outros, o módulo é função. Ajustamos defensivamente:
          // @ts-ignore
          pdfjs.GlobalWorkerOptions.workerSrc = worker?.default ?? worker
        } catch (e) {
          // fallback: se não conseguir importar, não falha — PDF.js funcionará (sem worker) ou use um CDN worker.
          console.warn('[Editor] Não foi possível carregar pdf.worker.entry dinamicamente', e)
        }

        const loadingTask = pdfjs.getDocument({ data: ab })
        const pdf = await loadingTask.promise

        if (cancelled) {
          try { pdf.destroy?.() } catch {}
          return
        }

        const sizes: PageSize[] = []
        const pageCount = pdf.numPages || 1
        for (let i = 1; i <= pageCount; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1 })
          sizes.push({ width: viewport.width, height: viewport.height })
          // cleanup page if API supports
          try { page.cleanup?.() } catch {}
        }

        setPageSizes(sizes)
        setPdfPageCount(sizes.length || 1)
        setActivePage(1)

        try { pdf.destroy?.() } catch {}
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

  // --- Início: handlers & render (usar o bloco já existente no seu arquivo) ---
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
        {/* ... aqui continua todo o JSX padrão (status, seções, PdfEditor, etc.) ... */}
        {/* Use a versão original do seu JSX daqui para baixo sem alterações */}
      </div>
    </div>
  )
}
