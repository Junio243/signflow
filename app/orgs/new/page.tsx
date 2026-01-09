'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function NewOrgPage() {
  const router = useRouter();
  const supabaseClient = supabase;
  
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // Campos do formulário
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [secondaryColor, setSecondaryColor] = useState('#111827');
  const [footerTemplate, setFooterTemplate] = useState('');
  const [dpoContact, setDpoContact] = useState('');
  const [address, setAddress] = useState('');
  
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Verificar sessão
  useEffect(() => {
    (async () => {
      if (!supabaseClient) {
        setInfo('Serviço de organizações indisponível.');
        setLoading(false);
        return;
      }
      const { data } = await supabaseClient.auth.getSession();
      if (!data?.session?.user?.id) {
        router.push('/login?next=/orgs/new');
        return;
      }
      setSessionUserId(data.session.user.id);
      setLoading(false);
    })();
  }, []);

  // Auto-gerar slug do nome
  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-')     // Substitui não-alfanuméricos por hífen
      .replace(/^-+|-+$/g, '');        // Remove hífens do início/fim
  }

  function handleNameChange(value: string) {
    setName(value);
    setSlug(generateSlug(value));
  }

  // Upload do logo
  async function uploadLogo(file: File): Promise<string | null> {
    if (!supabaseClient || !sessionUserId) return null;
    
    const safeName = file.name.replace(/\s+/g, '-').toLowerCase();
    const path = `new-org/${Date.now()}-${safeName}`;
    
    const { error: upErr } = await supabaseClient.storage
      .from('signflow-logos')
      .upload(path, file, { upsert: true });
    
    if (upErr) {
      console.error('Erro ao fazer upload do logo:', upErr);
      return null;
    }
    
    const { data: pub } = supabaseClient.storage
      .from('signflow-logos')
      .getPublicUrl(path);
    
    return pub?.publicUrl ?? null;
  }

  // Criar organização
  async function handleCreate() {
    if (!supabaseClient || !sessionUserId) {
      setInfo('Faça login para continuar.');
      return;
    }

    // Validações
    if (!name.trim() || name.trim().length < 3) {
      setInfo('O nome deve ter pelo menos 3 caracteres.');
      setIsSuccess(false);
      return;
    }

    if (!slug.trim()) {
      setInfo('O slug é obrigatório.');
      setIsSuccess(false);
      return;
    }

    setBusy(true);
    setInfo(null);
    setIsSuccess(false);

    try {
      // Verificar se slug já existe
      const { data: existing } = await supabaseClient
        .from('organizations')
        .select('id')
        .eq('slug', slug.trim())
        .maybeSingle();

      if (existing) {
        setInfo('Este slug já está em uso. Escolha outro.');
        setIsSuccess(false);
        setBusy(false);
        return;
      }

      // Upload do logo se houver
      let logoUrl: string | null = null;
      const logoFile = fileRef.current?.files?.[0];
      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
        if (!logoUrl) {
          setInfo('Erro ao fazer upload do logo. Tente novamente.');
          setIsSuccess(false);
          setBusy(false);
          return;
        }
      }

      // Criar organização
      const { data: org, error: orgErr } = await supabaseClient
        .from('organizations')
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          footer_template: footerTemplate.trim() || null,
          dpo_contact: dpoContact.trim() || null,
          address: address.trim() || null,
        })
        .select('id')
        .single();

      if (orgErr) {
        console.error('Erro ao criar organização:', orgErr);
        setInfo('Erro ao criar organização: ' + orgErr.message);
        setIsSuccess(false);
        setBusy(false);
        return;
      }

      // Adicionar usuário como admin
      const { error: memberErr } = await supabaseClient
        .from('organization_members')
        .insert({
          org_id: org.id,
          user_id: sessionUserId,
          role: 'admin',
        });

      if (memberErr) {
        console.error('Erro ao adicionar membro:', memberErr);
        setInfo('Organização criada, mas houve erro ao adicionar você como admin: ' + memberErr.message);
        setIsSuccess(false);
        setBusy(false);
        return;
      }

      // Redirecionar para configurações
      router.push(`/orgs/${org.id}/settings`);

    } catch (err: any) {
      console.error('Erro inesperado:', err);
      setInfo('Erro inesperado: ' + (err?.message ?? 'desconhecido'));
      setIsSuccess(false);
      setBusy(false);
    }
  }

  // Renderização
  if (!supabaseClient) {
    return (
      <div style={{ maxWidth: 980, margin: '20px auto', padding: 16 }}>
        <h1>Criar organização</h1>
        <p>Serviço indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 16 }}>Carregando…</p>;

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Criar nova organização</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>
        Preencha os dados da organização. Você será adicionado como administrador.
      </p>

      <section style={{ display: 'grid', gap: 16 }}>
        {/* Nome e Slug */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Nome da organização *
            </label>
            <input
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Minha Empresa"
              style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Slug (URL) *
            </label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="minha-empresa"
              style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
            />
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              URL: /orgs/{slug || 'slug'}
            </div>
          </div>
        </div>

        {/* Logo */}
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Logo (opcional)
          </label>
          <input
            type="file"
            ref={fileRef}
            accept="image/png,image/svg+xml,image/jpeg"
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Recomendado: PNG ou SVG com fundo transparente
          </div>
        </div>

        {/* Cores */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Cor primária
            </label>
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              style={{ width: 80, height: 40, border: 'none', cursor: 'pointer' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Cor secundária
            </label>
            <input
              type="color"
              value={secondaryColor}
              onChange={e => setSecondaryColor(e.target.value)}
              style={{ width: 80, height: 40, border: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Endereço */}
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Endereço
          </label>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Av. Paulista, 1000 — São Paulo/SP"
            style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
        </div>

        {/* Contato DPO */}
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Contato DPO (Encarregado de Dados)
          </label>
          <input
            value={dpoContact}
            onChange={e => setDpoContact(e.target.value)}
            placeholder="dpo@empresa.com.br"
            style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
        </div>

        {/* Rodapé */}
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Template de rodapé (documentos)
          </label>
          <textarea
            value={footerTemplate}
            onChange={e => setFooterTemplate(e.target.value)}
            placeholder="Documento assinado digitalmente via SignFlow. {{org}} — {{dpo_contact}}"
            style={{ 
              width: '100%', 
              minHeight: 100, 
              padding: 10, 
              border: '1px solid #e5e7eb', 
              borderRadius: 8,
              resize: 'vertical'
            }}
          />
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
            Placeholders disponíveis: {'{{org}}'}, {'{{name}}'}, {'{{dpo_contact}}'}
          </div>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={handleCreate}
            disabled={busy || !name.trim() || !slug.trim()}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              border: 'none',
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy || !name.trim() || !slug.trim() ? 0.6 : 1,
            }}
          >
            {busy ? 'Criando…' : 'Criar organização'}
          </button>
          <button
            onClick={() => router.push('/orgs')}
            disabled={busy}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: '#fff',
              color: '#374151',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </section>

      {/* Feedback */}
      {info && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: isSuccess ? '#ecfdf5' : '#fef2f2',
            color: isSuccess ? '#065f46' : '#991b1b',
            border: `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          {info}
        </div>
      )}
    </div>
  );
}
