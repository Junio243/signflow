'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Profile = { id: string; name: string; type: 'medico'|'faculdade'|'generico'; theme: any }

export default function AppearancePage() {
  const router = useRouter()
  const supabaseClient = supabase
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  // Form
  const [name, setName] = useState('')
  const [type, setType] = useState<'medico'|'faculdade'|'generico'>('generico')
  const [color, setColor] = useState('#2563eb')
  const [footer, setFooter] = useState('Documento assinado digitalmente via SignFlow.')
  const [issuer, setIssuer] = useState('Instituição/Profissional')
  const [reg, setReg] = useState('Registro (CRM/CRP/OAB/CNPJ)')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [certificateType, setCertificateType] = useState('Certificado digital ICP-Brasil')
  const [certificateValidUntil, setCertificateValidUntil] = useState('')

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const boot = async () => {
      if (!supabaseClient) {
        setInfo('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.')
        setLoading(false)
        return
      }
      const s = await supabaseClient.auth.getSession()
      if (!s.data?.session) {
        setInfo('É necessário estar logado para criar um perfil. Acesse /login para continuar.')
        setHasSession(false)
        setLoading(false)
        return
      }
      setHasSession(true)
      const { data } = await supabaseClient.from('validation_profiles').select('id, name, type, theme').order('created_at', { ascending: false })
      setProfiles((data || []) as Profile[])
      setLoading(false)
    }
    boot()
  }, [])

  const uploadLogoIfAny = async (): Promise<{ url: string | null; ok: boolean }> => {
    if (!logoFile) return { url: null, ok: true }

    const key = `branding/${Date.now()}-${logoFile.name}`
    if (!supabaseClient) {
      setInfo('Serviço de armazenamento indisponível.');
      return { url: null, ok: false }
    }

    const up = await supabaseClient.storage.from('signflow').upload(key, logoFile, { contentType: logoFile.type, upsert: true })
    if (up.error) {
      setInfo('Não consegui subir o logo.')
      return { url: null, ok: false }
    }

    const pub = await supabaseClient.storage.from('signflow').getPublicUrl(key)
    if (pub.error || !pub.data?.publicUrl) {
      console.error('Erro ao gerar URL pública do logo:', pub.error)
      setInfo('Não consegui gerar a URL pública do logo. Tente novamente mais tarde.')
      return { url: null, ok: false }
    }

    return { url: pub.data.publicUrl, ok: true }
  }

  const createProfile = async () => {
    if (!hasSession) {
      setInfo('É necessário estar logado para criar um perfil. Acesse /login para continuar.')
      return
    }
    try {
      setInfo(null)
      const { url: logo, ok: uploaded } = await uploadLogoIfAny()
      if (!uploaded) return
      const normalizedCertificateValidUntil = certificateValidUntil.trim() || null

      const theme = {
        color,
        footer,
        issuer,
        reg,
        logo_url: logo ?? logoUrl ?? null,
        certificate_type: certificateType,
        certificate_valid_until: normalizedCertificateValidUntil,
      }
      if (!supabaseClient) {
        setInfo('Serviço de perfis indisponível.');
        return
      }
      const { error } = await supabaseClient.from('validation_profiles').insert({ name, type, theme })
      if (error) { setInfo('Erro ao salvar perfil: '+error.message); return }
      setInfo('Perfil criado!')
      setName(''); setLogoFile(null); setLogoUrl(null)
      setCertificateType('Certificado digital ICP-Brasil')
      setCertificateValidUntil('')
      const { data } = await supabaseClient.from('validation_profiles').select('id, name, type, theme').order('created_at', { ascending: false })
      setProfiles((data || []) as Profile[])
    } catch { setInfo('Falha ao criar perfil.') }
  }

  if (!supabaseClient) {
    return (
      <div style={{ maxWidth: 900, margin: '24px auto', padding: 16 }}>
        <h1>Aparência da Validação</h1>
        <p>Serviço de perfis indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      </div>
    )
  }

  if (loading) return <p style={{ padding:16 }}>Carregando…</p>

  return (
    <div style={{ maxWidth: 900, margin:'24px auto', padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1 style={{ fontSize:22, margin:0 }}>Aparência da Validação</h1>
        <button onClick={()=>router.push('/editor')}>Voltar ao Editor</button>
      </div>
      <p style={{ color:'#6b7280' }}>Crie perfis para personalizar a área de validação (ex.: Médico CRM/DF, Faculdade, Genérico com logo).</p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
          <h2 style={{ fontSize:16, marginTop:0 }}>Novo perfil</h2>
          <fieldset disabled={!hasSession} style={{ border:'none', padding:0, margin:0 }}>
            <div style={{ display:'grid', gap:8 }}>
              <input placeholder="Nome do perfil (ex.: Médico CRM/DF)" value={name} onChange={e=>setName(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <div>
                <label><input type="radio" checked={type==='medico'} onChange={()=>setType('medico')} /> Médico</label>{' '}
                <label><input type="radio" checked={type==='faculdade'} onChange={()=>setType('faculdade')} /> Faculdade</label>{' '}
                <label><input type="radio" checked={type==='generico'} onChange={()=>setType('generico')} /> Genérico</label>
              </div>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)} title="Cor do tema" />
              <input placeholder="Instituição/Profissional" value={issuer} onChange={e=>setIssuer(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <input placeholder="Registro (CRM/CRP/OAB/CNPJ)" value={reg} onChange={e=>setReg(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <input placeholder="Tipo de certificado (ex.: ICP-Brasil A3)" value={certificateType} onChange={e=>setCertificateType(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <div>
                <label style={{ display:'block', fontSize:12, color:'#6b7280', marginBottom:4 }}>Validade do certificado</label>
                <input
                  type="date"
                  value={certificateValidUntil}
                  onChange={e=>setCertificateValidUntil(e.target.value)}
                  style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8, width:'100%' }}
                />
              </div>
              <textarea placeholder="Rodapé" value={footer} onChange={e=>setFooter(e.target.value)} style={{ padding:10, border:'1px solid #e5e7eb', borderRadius:8 }} />
              <div>
                <div>Logo (opcional):</div>
                <input type="file" accept="image/*" onChange={e=>setLogoFile(e.target.files?.[0]||null)} />
              </div>
              <button onClick={createProfile} disabled={!name || !hasSession}>Salvar perfil</button>
            </div>
          </fieldset>
          {info && <p>{info}</p>}
        </div>

        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:16 }}>
          <h2 style={{ fontSize:16, marginTop:0 }}>Seus perfis</h2>
          {profiles.length === 0 ? <p style={{ color:'#6b7280' }}>Nenhum perfil ainda.</p> : (
            <ul style={{ margin:0, paddingLeft:18 }}>
              {profiles.map(p => (
                <li key={p.id} style={{ marginBottom:8 }}>
                  <strong>{p.name}</strong> — {p.type}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
