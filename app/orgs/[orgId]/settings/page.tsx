// app/orgs/[orgId]/settings/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type OrgRow = {
  id: string;
  name: string;
  slug?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  footer_template?: string;
  dpo_contact?: string;
  address?: string;
};

export default function OrgSettings({ params }: { params: { orgId: string } }) {
  const orgId = params.orgId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<OrgRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // form fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#111827');
  const [footerTemplate, setFooterTemplate] = useState('');
  const [dpoContact, setDpoContact] = useState('');
  const [address, setAddress] = useState('Brasília/DF — Plano Piloto');

  // logo upload
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: orgData, error: orgErr } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();
        if (orgErr) {
          setInfo('Organização não encontrada ou sem permissão.');
          setLoading(false);
          return;
        }
        setOrg(orgData);
        setName(orgData.name || '');
        setSlug(orgData.slug || '');
        setPrimaryColor(orgData.primary_color || '#2563eb');
        setSecondaryColor(orgData.secondary_color || '#111827');
        setFooterTemplate(orgData.footer_template || '');
        setDpoContact(orgData.dpo_contact || '');
        setAddress(orgData.address || 'Brasília/DF — Plano Piloto');

        // check membership role
        const { data: members } = await supabase
          .from('organization_members')
          .select('role')
          .eq('org_id', orgId)
          .eq('user_id', (await supabase.auth.getSession()).data?.session?.user?.id)
          .single();
        setIsAdmin(Boolean(members && (members as any).role === 'admin'));
      } catch (e) {
        console.error(e);
        setInfo('Erro ao carregar organização.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  async function uploadLogo(file: File) {
    if (!file) return;
    setBusy(true); setInfo(null);
    try {
      const path = `${orgId}/logo-${Date.now()}-${file.name.replace(/\s+/g,'-')}`;
      const { error: upErr } = await supabase.storage.from('signflow-logos').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('signflow-logos').getPublicUrl(path);
      const fileUrl = pub?.publicUrl ?? null;
      // update organization
      const { error: upd } = await supabase.from('organizations').update({ logo_url: fileUrl }).eq('id', orgId);
      if (upd) throw upd;
      setOrg({...org!, logo_url: fileUrl});
      setInfo('Logo atualizado.');
    } catch (err:any) {
      console.error(err);
      setInfo('Erro ao enviar logo: ' + (err?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveOrg() {
    if (!isAdmin) return setInfo('Apenas administradores podem editar.');
    setBusy(true); setInfo(null);
    try {
      const payload = {
        name, slug, primary_color: primaryColor, secondary_color: secondaryColor,
        footer_template: footerTemplate, dpo_contact: dpoContact, address
      };
      const { error } = await supabase.from('organizations').update(payload).eq('id', orgId);
      if (error) throw error;
      setInfo('Organização salva.');
      router.refresh();
    } catch (e:any) {
      console.error(e);
      setInfo('Erro ao salvar: ' + (e?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateMember() {
    // simple UI to invite current user as admin (for initial bootstrap)
    const uid = (await supabase.auth.getSession()).data?.session?.user?.id;
    if (!uid) return setInfo('Faça login.');
    setBusy(true); setInfo(null);
    try {
      // try RPC first
      const { error } = await supabase.rpc('add_org_member', { p_org: orgId, p_user: uid, p_role: 'admin' });
      if (error) {
        // fallback upsert
        const { error: iErr } = await supabase.from('organization_members').upsert({ org_id: orgId, user_id: uid, role: 'admin' });
        if (iErr) {
          setInfo('Erro ao criar membro: ' + iErr.message);
        } else {
          setInfo('Você foi adicionado como admin.');
          setIsAdmin(true);
        }
      } else {
        setInfo('Você foi adicionado como admin.');
        setIsAdmin(true);
      }
    } catch (e:any) {
      console.error(e);
      setInfo('Erro ao criar membro: ' + (e?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p style={{ padding: 16 }}>Carregando…</p>;
  if (!org) return <p style={{ padding: 16 }}>Organização não encontrada.</p>;

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Configurações da organização</h1>

      {!isAdmin && (
        <div style={{ padding: 12, border: '1px solid #f3f4f6', borderRadius:8, marginBottom:12 }}>
          <div style={{ fontWeight:600 }}>Atenção</div>
          <div>Você não é administrador desta organização. As configurações são somente leitura.</div>
        </div>
      )}

      <section style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', gap:16 }}>
          <div style={{ width:140, height:80, border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff' }}>
            {org.logo_url ? <img src={org.logo_url} alt="logo" style={{ maxWidth:'100%', maxHeight:'100%' }} /> : <div style={{ color:'#9ca3af' }}>Sem logo</div>}
          </div>
          <div style={{ flex:1 }}>
            <label style={{ display:'block', marginBottom:6 }}>Logo (PNG/SVG)</label>
            <input type="file" ref={fileRef} accept="image/png,image/svg+xml,image/jpeg" onChange={e=> uploadLogo(e.target.files?.[0] as File)} disabled={!isAdmin || busy} />
            <div style={{ fontSize:13, color:'#6b7280', marginTop:6 }}>Envie a logo da organização. Recomendado PNG/SVG com fundo transparente.</div>
          </div>
        </div>

        <div>
          <label>Nome da organização</label>
          <input value={name} onChange={e=>setName(e.target.value)} disabled={!isAdmin} style={{ width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:8 }} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label>Slug (url)</label>
            <input value={slug} onChange={e=>setSlug(e.target.value)} disabled={!isAdmin} style={{ width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:8 }} />
          </div>
          <div>
            <label>Endereço</label>
            <input value={address} onChange={e=>setAddress(e.target.value)} disabled={!isAdmin} style={{ width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:8 }} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label>Cor primária</label>
            <input type="color" value={primaryColor} onChange={e=>setPrimaryColor(e.target.value)} disabled={!isAdmin} style={{ width:80, height:40, border:'none', background:'none' }} />
          </div>
          <div>
            <label>Cor secundária</label>
            <input type="color" value={secondaryColor} onChange={e=>setSecondaryColor(e.target.value)} disabled={!isAdmin} style={{ width:80, height:40, border:'none', background:'none' }} />
          </div>
        </div>

        <div>
          <label>Rodapé (template)</label>
          <textarea value={footerTemplate} onChange={e=>setFooterTemplate(e.target.value)} disabled={!isAdmin} style={{ width:'100%', minHeight:120, padding:8, border:'1px solid #e5e7eb', borderRadius:8 }} />
          <div style={{ fontSize:13, color:'#6b7280', marginTop:6 }}>Use placeholders como <code>{'{{name}}'}</code>, <code>{'{{org}}'}</code>, <code>{'{{dpo_contact}}'}</code>.</div>
        </div>

        <div>
          <label>Contato DPO</label>
          <input value={dpoContact} onChange={e=>setDpoContact(e.target.value)} disabled={!isAdmin} style={{ width:'100%', padding:8, border:'1px solid #e5e7eb', borderRadius:8 }} />
        </div>

        <div>
          <button onClick={handleSaveOrg} disabled={!isAdmin || busy} style={{ padding:'8px 12px', borderRadius:8, background:'#2563eb', color:'#fff' }}>
            {busy ? 'Salvando…' : 'Salvar organização'}
          </button>
          {!isAdmin && <button onClick={handleCreateMember} style={{ marginLeft:8, padding:'6px 10px' }}>Pedir ingresso como admin</button>}
        </div>
      </section>

      {info && <div style={{ marginTop:12 }}>{info}</div>}
    </div>
  );
}
