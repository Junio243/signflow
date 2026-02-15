// app/settings/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { generateSignatureName, getSignatureDisplay } from '@/lib/formatName';

type SignatureRow = {
  id: string;
  user_id?: string | null;
  name?: string | null;
  storage_path?: string | null;
  file_url?: string | null;
  type?: 'draw' | 'upload' | 'certified';
  is_default?: boolean;
  created_at?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const supabaseClient = supabase;

  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // profile
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('Brasília/DF');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [language, setLanguage] = useState('pt-BR');
  const [preferredSignatureId, setPreferredSignatureId] = useState<string | null>(null);

  // signatures
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ 
    displayName?: string; 
    phone?: string; 
    email?: string; 
    cep?: string 
  }>({});

  const cityOptions = useMemo(() => {
    const baseOptions = [
      'Brasília/DF',
      'São Paulo/SP',
      'Rio de Janeiro/RJ',
      'Belo Horizonte/MG',
      'Curitiba/PR',
      'Porto Alegre/RS',
      'Salvador/BA',
      'Recife/PE',
      'Fortaleza/CE',
      'Manaus/AM',
      'Florianópolis/SC',
    ];
    if (city && !baseOptions.includes(city)) {
      return [city, ...baseOptions];
    }
    return baseOptions;
  }, [city]);

  const timezoneOptions = useMemo(() => {
    const baseOptions = [
      'America/Sao_Paulo',
      'America/Bahia',
      'America/Recife',
      'America/Fortaleza',
      'America/Belem',
      'America/Manaus',
      'America/Cuiaba',
      'America/Porto_Velho',
      'America/Rio_Branco',
    ];
    if (timezone && !baseOptions.includes(timezone)) {
      return [timezone, ...baseOptions];
    }
    return baseOptions;
  }, [timezone]);

  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  const cepRegex = /^\d{5}-\d{3}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function formatBrazilianPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) {
      return digits.length === 2 ? `(${digits})` : `(${digits}`;
    }
    const ddd = digits.slice(0, 2);
    const remaining = digits.slice(2);
    if (remaining.length <= 4) {
      return `(${ddd}) ${remaining}`;
    }
    if (remaining.length <= 8) {
      return `(${ddd}) ${remaining.slice(0, remaining.length - 4)}-${remaining.slice(-4)}`;
    }
    return `(${ddd}) ${remaining.slice(0, 5)}-${remaining.slice(5)}`;
  }

  function formatCEP(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  function validateDisplayName(value: string): boolean {
    const trimmed = value.trim();
    let message = '';
    
    if (!trimmed) {
      message = 'Informe seu nome.';
    } else if (trimmed.length < 2) {
      message = 'Nome muito curto (mínimo 2 caracteres).';
    } else if (trimmed.length > 100) {
      message = 'Nome muito longo (máximo 100 caracteres).';
    } else if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(trimmed)) {
      message = 'Use apenas letras e espaços.';
    }
    
    setFormErrors(prev => ({ ...prev, displayName: message }));
    return message === '';
  }

  function validatePhone(value: string) {
    const digits = value.replace(/\D/g, '');
    let message = '';
    if (!digits) {
      message = 'Informe o telefone com DDD.';
    } else if (digits.length !== 10 && digits.length !== 11) {
      message = 'O telefone deve ter 10 ou 11 dígitos.';
    } else if (!phoneRegex.test(value)) {
      message = 'Use o formato (11) 98888-7777.';
    }
    setFormErrors((prev) => ({ ...prev, phone: message }));
    return message === '';
  }

  function validateCep(value: string) {
    const formatted = formatCEP(value);
    const digits = formatted.replace(/\D/g, '');
    let message = '';
    if (!digits) {
      message = 'Informe o CEP.';
    } else if (digits.length !== 8) {
      message = 'O CEP deve ter 8 dígitos.';
    } else if (!cepRegex.test(formatted)) {
      message = 'Use o formato 00000-000.';
    }
    setFormErrors((prev) => ({ ...prev, cep: message }));
    return message === '';
  }

  function validateEmail(value: string) {
    const normalized = value.trim().toLowerCase();
    let message = '';
    if (!normalized) {
      message = 'Informe o e-mail.';
    } else if (!emailRegex.test(normalized)) {
      message = 'E-mail inválido.';
    }
    setFormErrors((prev) => ({ ...prev, email: message }));
    return message === '';
  }

  function handlePhoneInput(value: string) {
    const formatted = formatBrazilianPhone(value);
    setPhone(formatted);
    validatePhone(formatted);
  }

  function handleCepInput(value: string) {
    const formatted = formatCEP(value);
    setCep(formatted);
    validateCep(formatted);
  }

  function handleEmailInput(value: string) {
    const normalized = value.replace(/\s+/g, '').toLowerCase();
    setEmail(normalized);
    validateEmail(normalized);
  }

  function handleDisplayNameInput(value: string) {
    setDisplayName(value);
    if (value.trim()) {
      validateDisplayName(value);
    }
  }

  const hasErrors = Object.values(formErrors).some((msg) => Boolean(msg));
  const isSaveDisabled = busy || hasErrors || !displayName.trim() || !phone || !email || !cep;

  // drawing canvas
  const signCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }> | null>(null);
  const strokesRef = useRef<Array<Array<{ x: number; y: number }>>>([]);

  // load session/profile/signatures
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!supabaseClient) {
          setInfo('Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.');
          setSessionUserId(null);
          return;
        }
        const { data: sess } = await supabaseClient.auth.getSession();
        const uid = sess?.session?.user?.id ?? null;
        setSessionUserId(uid);

        if (uid) {
          // profile
          const { data: profileData, error: profileErr } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();
          if (!profileErr && profileData) {
            setDisplayName(profileData.display_name || '');
            handlePhoneInput(profileData.phone || '');
            handleEmailInput(profileData.email || '');
            handleCepInput(profileData.cep || '');
            setCity(profileData.city || 'Brasília/DF');
            setTimezone(profileData.timezone || 'America/Sao_Paulo');
            setLanguage(profileData.language || 'pt-BR');
            setPreferredSignatureId(profileData.preferred_signature_id || null);
          }
          await fetchSignatures(uid);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fetch signatures
  async function fetchSignatures(uid: string) {
    try {
      if (!supabaseClient) {
        setInfo('Serviço de assinaturas indisponível.');
        return;
      }
      const { data, error } = await supabaseClient
        .from('signatures')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSignatures((data || []) as SignatureRow[]);
    } catch (e: any) {
      console.error(e);
      setInfo('Erro ao carregar assinaturas: ' + (e?.message ?? 'desconhecido'));
    }
  }

  // save profile
  async function handleSaveProfile() {
    if (!sessionUserId) {
      setInfo('Faça login primeiro.');
      return;
    }
    const normalizedPhone = formatBrazilianPhone(phone);
    const normalizedCep = formatCEP(cep);
    const normalizedEmail = email.replace(/\s+/g, '').toLowerCase();
    const normalizedDisplayName = displayName.trim();

    const nameValid = validateDisplayName(normalizedDisplayName);
    const phoneValid = validatePhone(normalizedPhone);
    const emailValid = validateEmail(normalizedEmail);
    const cepValid = validateCep(normalizedCep);

    setPhone(normalizedPhone);
    setCep(normalizedCep);
    setEmail(normalizedEmail);
    setDisplayName(normalizedDisplayName);

    if (!nameValid || !phoneValid || !emailValid || !cepValid) {
      setInfo('Corrija os campos destacados antes de salvar.');
      return;
    }

    setBusy(true);
    setInfo(null);
    try {
      if (!supabaseClient) {
        setInfo('Serviço de perfil indisponível.');
        return;
      }
      const payload = {
        id: sessionUserId,
        display_name: normalizedDisplayName,
        phone: normalizedPhone,
        email: normalizedEmail,
        cep: normalizedCep,
        city,
        timezone,
        language,
        preferred_signature_id: preferredSignatureId || null,
      };
      const { error } = await supabaseClient.from('profiles').upsert(payload);
      if (error) throw error;
      setInfo('Perfil salvo.');
    } catch (e: any) {
      console.error(e);
      setInfo('Erro ao salvar perfil: ' + (e?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  // ------------------ Drawing canvas handlers ------------------
  useEffect(() => {
    const cvs = signCanvasRef.current;
    if (!cvs) return;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const cssW = Math.min(640, cvs.parentElement ? cvs.parentElement.clientWidth : 640);
      const cssH = 160;
      cvs.style.width = `${cssW}px`;
      cvs.style.height = `${cssH}px`;
      cvs.width = Math.floor(cssW * ratio);
      cvs.height = Math.floor(cssH * ratio);
      const ctx = cvs.getContext('2d')!;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#111';

      // redraw saved strokes (CSS pixels)
      strokesRef.current.forEach((stroke) => {
        if (!stroke || stroke.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          const p = stroke[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const canvasCtx = () => {
    const cvs = signCanvasRef.current!;
    return cvs.getContext('2d')!;
  };

  function onCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvasCtx().beginPath();
    canvasCtx().moveTo(x, y);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    currentStrokeRef.current = [{ x, y }];
  }
  function onCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !currentStrokeRef.current) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    currentStrokeRef.current.push({ x, y });
    canvasCtx().lineTo(x, y);
    canvasCtx().stroke();
  }
  function onCanvasPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    if (currentStrokeRef.current && currentStrokeRef.current.length) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = null;
    }
  }
  function clearCanvas() {
    const cvs = signCanvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    strokesRef.current = [];
  }

  // ------------------ Upload / DB functions ------------------
  // robust uploadSignatureFile: obtains session just before upload to satisfy RLS
  async function uploadSignatureFile(
    file: File,
    type: 'draw' | 'upload' | 'certified' = 'upload',
    customName?: string
  ) {
    // ensure current session
    if (!supabaseClient) {
      setInfo('Serviço de assinaturas indisponível.');
      return;
    }
    const { data: sess } = await supabaseClient.auth.getSession();
    const uid = sess?.session?.user?.id ?? null;
    if (!uid) {
      setInfo('Faça login primeiro.');
      return;
    }

    setBusy(true);
    setInfo(null);
    try {
      // Gerar nome automático se não fornecido
      const signatureName = customName || generateSignatureName(type, type === 'upload' ? file.name : undefined);
      const safeName = signatureName.replace(/\s+/g, '-').toLowerCase();
      const path = `${uid}/${Date.now()}-${safeName}`;

      // upload to storage
      const { error: upErr } = await supabaseClient.storage
        .from('signflow-signatures')
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      // get public url
      const { data: pub } = supabaseClient.storage.from('signflow-signatures').getPublicUrl(path);
      const fileUrl = pub?.publicUrl ?? null;

      // insert row with user_id to satisfy RLS
      const { data: ins, error: insErr } = await supabaseClient
        .from('signatures')
        .insert({
          user_id: uid,
          name: signatureName,
          storage_path: path,
          file_url: fileUrl,
          type,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      // if first signature, set default
      if ((signatures?.length || 0) === 0) {
        await setDefaultSignature(ins.id);
      } else {
        await fetchSignatures(uid);
      }

      setInfo('Assinatura enviada.');
    } catch (err: any) {
      console.error(err);
      setInfo('Falha ao enviar assinatura: ' + (err?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    await uploadSignatureFile(f, 'upload');
    (e.target as HTMLInputElement).value = '';
  }

  // save canvas as signature
  async function saveCanvasSignature() {
    if (!signCanvasRef.current) return;
    const cvs = signCanvasRef.current;
    const dataUrl = cvs.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    const name = generateSignatureName('draw');
    await uploadSignatureFile(new File([blob], `${name}.png`, { type: 'image/png' }), 'draw', name);
    clearCanvas();
  }

  // set default signature
  async function setDefaultSignature(sigId: string) {
    if (!sessionUserId) {
      setInfo('Faça login primeiro.');
      return;
    }
    setBusy(true);
    setInfo(null);
    try {
      if (!supabaseClient) {
        setInfo('Serviço de assinaturas indisponível.');
        return;
      }
      // try RPC first
      const { error: unsetErr } = await supabaseClient.rpc('unset_user_default_signature', { p_user_id: sessionUserId });
      if (unsetErr) {
        // fallback: unset via update
        const { error: uErr } = await supabaseClient
          .from('signatures')
          .update({ is_default: false })
          .eq('user_id', sessionUserId);
        if (uErr) console.warn('fallback unset default error', uErr);
      }
      const { error: setErr } = await supabaseClient.from('signatures').update({ is_default: true }).eq('id', sigId);
      if (setErr) throw setErr;

      // update profile preference
      const { error: profErr } = await supabaseClient
        .from('profiles')
        .upsert({ id: sessionUserId, preferred_signature_id: sigId });
      if (profErr) console.warn('profile update error', profErr);

      setPreferredSignatureId(sigId);
      await fetchSignatures(sessionUserId);
      setInfo('Assinatura definida como padrão.');
    } catch (e: any) {
      console.error(e);
      setInfo('Erro ao definir padrão: ' + (e?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  // delete signature
  async function handleDeleteSignature(sig: SignatureRow) {
    if (!sessionUserId) {
      setInfo('Faça login primeiro.');
      return;
    }
    if (!confirm('Deseja remover esta assinatura?')) return;
    setBusy(true);
    setInfo(null);
    try {
      if (!supabaseClient) {
        setInfo('Serviço de assinaturas indisponível.');
        return;
      }
      if (sig.storage_path) {
        const { error: remErr } = await supabaseClient.storage.from('signflow-signatures').remove([sig.storage_path]);
        if (remErr) console.warn('storage remove error', remErr);
      }
      const { error: delErr } = await supabaseClient.from('signatures').delete().eq('id', sig.id);
      if (delErr) throw delErr;

      // if it was default, clear profile preferred_signature_id
      if (sig.is_default) {
        await supabaseClient.from('profiles').update({ preferred_signature_id: null }).eq('id', sessionUserId);
        setPreferredSignatureId(null);
      }

      await fetchSignatures(sessionUserId);
      setInfo('Assinatura removida.');
    } catch (e: any) {
      console.error(e);
      setInfo('Erro ao remover: ' + (e?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  // ------------------ UI ------------------
  if (!supabaseClient) {
    return (
      <div style={{ maxWidth: 900, margin: '20px auto', padding: 16 }}>
        <h1>Configurações</h1>
        <p>Serviço de autenticação indisponível. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
      </div>
    );
  }

  if (loading) return <p style={{ padding: 16 }}>Carregando…</p>;
  if (!sessionUserId) {
    return (
      <div style={{ maxWidth: 900, margin: '20px auto', padding: 16 }}>
        <h1>Configurações</h1>
        <p>Você precisa entrar para acessar suas configurações.</p>
        <button onClick={() => router.push('/login')} style={{ padding: '8px 12px', borderRadius: 8 }}>
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Perfil e Assinaturas</h1>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Dados do perfil</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
              Nome completo
              <span style={{ color: '#dc2626', marginLeft: 4 }} aria-label="campo obrigatório">*</span>
            </label>
            <input
              value={displayName}
              onChange={(e) => handleDisplayNameInput(e.target.value)}
              onBlur={() => validateDisplayName(displayName)}
              placeholder="Seu nome completo"
              aria-invalid={Boolean(formErrors.displayName)}
              aria-required="true"
              style={{ 
                width: '100%', 
                padding: 8, 
                border: `1px solid ${formErrors.displayName ? '#dc2626' : '#e5e7eb'}`, 
                borderRadius: 8 
              }}
            />
            {formErrors.displayName && (
              <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{formErrors.displayName}</p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
              Telefone
              <span style={{ color: '#dc2626', marginLeft: 4 }} aria-label="campo obrigatório">*</span>
            </label>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => handlePhoneInput(e.target.value)}
              onBlur={() => validatePhone(phone)}
              maxLength={16}
              placeholder="(11) 98888-7777"
              aria-invalid={Boolean(formErrors.phone)}
              aria-required="true"
              style={{
                width: '100%',
                padding: 8,
                border: `1px solid ${formErrors.phone ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: 8,
              }}
            />
            {formErrors.phone && (
              <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{formErrors.phone}</p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
              E-mail
              <span style={{ color: '#dc2626', marginLeft: 4 }} aria-label="campo obrigatório">*</span>
            </label>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => handleEmailInput(e.target.value)}
              onBlur={() => validateEmail(email)}
              placeholder="nome@exemplo.com"
              aria-invalid={Boolean(formErrors.email)}
              aria-required="true"
              style={{
                width: '100%',
                padding: 8,
                border: `1px solid ${formErrors.email ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: 8,
              }}
            />
            {formErrors.email && (
              <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{formErrors.email}</p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>
              CEP
              <span style={{ color: '#dc2626', marginLeft: 4 }} aria-label="campo obrigatório">*</span>
            </label>
            <input
              value={cep}
              inputMode="numeric"
              maxLength={9}
              onChange={(e) => handleCepInput(e.target.value)}
              onBlur={() => validateCep(cep)}
              placeholder="00000-000"
              aria-invalid={Boolean(formErrors.cep)}
              aria-required="true"
              style={{
                width: '100%',
                padding: 8,
                border: `1px solid ${formErrors.cep ? '#dc2626' : '#e5e7eb'}`,
                borderRadius: 8,
              }}
            />
            {formErrors.cep && (
              <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{formErrors.cep}</p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Cidade</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
            >
              {cityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Fuso horário</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
            >
              {timezoneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button
            onClick={handleSaveProfile}
            disabled={isSaveDisabled}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#fff',
              opacity: isSaveDisabled ? 0.6 : 1,
              cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Gerenciar assinaturas</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Desenhar assinatura</div>
            <canvas
              ref={signCanvasRef}
              onPointerDown={onCanvasPointerDown}
              onPointerMove={onCanvasPointerMove}
              onPointerUp={onCanvasPointerUp}
              onPointerCancel={() => {
                drawingRef.current = false;
              }}
              style={{ width: '100%', height: 160, border: '1px dashed #94a3b8', borderRadius: 8, background: '#fff', touchAction: 'none' }}
            />
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button 
                onClick={saveCanvasSignature} 
                disabled={busy} 
                style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                Salvar desenho
              </button>
              <button 
                onClick={clearCanvas} 
                disabled={busy} 
                style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb', cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                Limpar
              </button>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Importar assinatura (PNG/JPG)</div>
            <input 
              type="file" 
              accept="image/png,image/jpeg" 
              onChange={handleFileUpload} 
              disabled={busy}
              style={{ marginBottom: 8 }}
            />
            <div style={{ color: '#6b7280', fontSize: 13 }}>
              Faça upload de uma imagem PNG/JPG com a sua assinatura. Use preferencialmente fundo transparente.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Minhas assinaturas</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {signatures.length === 0 && (
              <div style={{ color: '#6b7280', padding: 16, textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 8 }}>
                Nenhuma assinatura cadastrada. Crie uma desenhando ou fazendo upload.
              </div>
            )}
            {signatures.map((sig) => {
              const display = getSignatureDisplay(sig);
              return (
                <div 
                  key={sig.id} 
                  style={{ 
                    display: 'flex', 
                    gap: 12, 
                    alignItems: 'center', 
                    padding: 12, 
                    border: sig.is_default ? '2px solid #10b981' : '1px solid #e5e7eb', 
                    borderRadius: 8,
                    background: sig.is_default ? '#f0fdf4' : '#fff'
                  }}
                >
                  <div style={{ 
                    width: 120, 
                    height: 60, 
                    border: '1px solid #e5e7eb', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    overflow: 'hidden', 
                    background: '#fff',
                    borderRadius: 4
                  }}>
                    {sig.file_url ? (
                      <img 
                        src={sig.file_url} 
                        alt={display.name} 
                        style={{ maxHeight: '100%', maxWidth: '100%' }} 
                      />
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: 12 }}>Sem preview</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{display.icon}</span>
                      <span>{display.name}</span>
                      {sig.is_default && (
                        <span style={{ 
                          fontSize: 11, 
                          background: '#10b981', 
                          color: '#fff', 
                          padding: '2px 6px', 
                          borderRadius: 4,
                          fontWeight: 600
                        }}>
                          PADRÃO
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{display.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {!sig.is_default && (
                      <button 
                        onClick={() => setDefaultSignature(sig.id)} 
                        disabled={busy} 
                        style={{ 
                          padding: '6px 10px', 
                          borderRadius: 8, 
                          background: '#2563eb', 
                          color: '#fff',
                          fontSize: 13,
                          cursor: busy ? 'not-allowed' : 'pointer',
                          border: 'none'
                        }}
                      >
                        Definir como padrão
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteSignature(sig)} 
                      disabled={busy} 
                      style={{ 
                        padding: '6px 10px', 
                        borderRadius: 8, 
                        background: '#fff', 
                        border: '1px solid #e5e7eb',
                        fontSize: 13,
                        cursor: busy ? 'not-allowed' : 'pointer',
                        color: '#dc2626'
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {info && (
        <div style={{ 
          marginTop: 8, 
          padding: 12, 
          background: info.includes('Erro') || info.includes('Falha') ? '#fee2e2' : '#dbeafe',
          color: info.includes('Erro') || info.includes('Falha') ? '#dc2626' : '#1e40af',
          borderRadius: 8,
          fontSize: 14
        }}>
          {info}
        </div>
      )}
    </div>
  );
}
