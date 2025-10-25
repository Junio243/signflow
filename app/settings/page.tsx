// app/settings/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

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

  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  // profile
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Brasília/DF');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [language, setLanguage] = useState('pt-BR');
  const [preferredSignatureId, setPreferredSignatureId] = useState<string | null>(null);

  // signatures
  const [signatures, setSignatures] = useState<SignatureRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

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
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id ?? null;
        setSessionUserId(uid);

        if (uid) {
          // profile
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();
          if (!profileErr && profileData) {
            setDisplayName(profileData.display_name || '');
            setPhone(profileData.phone || '');
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
      const { data, error } = await supabase
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
    setBusy(true);
    setInfo(null);
    try {
      const payload = {
        id: sessionUserId,
        display_name: displayName,
        phone,
        city,
        timezone,
        language,
        preferred_signature_id: preferredSignatureId || null,
      };
      const { error } = await supabase.from('profiles').upsert(payload, { returning: 'minimal' });
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
    name = 'assinatura',
    type: 'draw' | 'upload' | 'certified' = 'upload'
  ) {
    // ensure current session
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess?.session?.user?.id ?? null;
    if (!uid) {
      setInfo('Faça login primeiro.');
      return;
    }

    setBusy(true);
    setInfo(null);
    try {
      const safeName = name.replace(/\s+/g, '-').toLowerCase();
      const path = `${uid}/${Date.now()}-${safeName}`;

      // upload to storage
      const { error: upErr } = await supabase.storage
        .from('signflow-signatures')
        .upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      // get public url
      const { data: pub } = supabase.storage.from('signflow-signatures').getPublicUrl(path);
      const fileUrl = pub?.publicUrl ?? null;

      // insert row with user_id to satisfy RLS
      const { data: ins, error: insErr } = await supabase
        .from('signatures')
        .insert({
          user_id: uid,
          name,
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
    await uploadSignatureFile(f, f.name, 'upload');
    (e.target as HTMLInputElement).value = '';
  }

  // save canvas as signature
  async function saveCanvasSignature(name = 'Desenho') {
    if (!signCanvasRef.current) return;
    const cvs = signCanvasRef.current;
    const dataUrl = cvs.toDataURL('image/png');
    const blob = await (await fetch(dataUrl)).blob();
    await uploadSignatureFile(new File([blob], `${name}.png`, { type: 'image/png' }), name, 'draw');
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
      // try RPC first
      const { error: unsetErr } = await supabase.rpc('unset_user_default_signature', { p_user_id: sessionUserId });
      if (unsetErr) {
        // fallback: unset via update
        const { error: uErr } = await supabase.from('signatures').update({ is_default: false }).eq('user_id', sessionUserId);
        if (uErr) console.warn('fallback unset default error', uErr);
      }
      const { error: setErr } = await supabase.from('signatures').update({ is_default: true }).eq('id', sigId);
      if (setErr) throw setErr;

      // update profile preference
      const { error: profErr } = await supabase
        .from('profiles')
        .upsert({ id: sessionUserId, preferred_signature_id: sigId }, { returning: 'minimal' });
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
      if (sig.storage_path) {
        const { error: remErr } = await supabase.storage.from('signflow-signatures').remove([sig.storage_path]);
        if (remErr) console.warn('storage remove error', remErr);
      }
      const { error: delErr } = await supabase.from('signatures').delete().eq('id', sig.id);
      if (delErr) throw delErr;

      // if it was default, clear profile preferred_signature_id
      if (sig.is_default) {
        await supabase.from('profiles').update({ preferred_signature_id: null }).eq('id', sessionUserId);
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
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Minhas configurações</h1>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Perfil</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Nome</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          </div>
          <div>
            <label>Telefone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          </div>
          <div>
            <label>Cidade</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          </div>
          <div>
            <label>Fuso horário</label>
            <input value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={handleSaveProfile} disabled={busy} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: '#fff' }}>
            {busy ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Assinaturas</h2>

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
              <button onClick={() => saveCanvasSignature('Desenho')} disabled={busy} style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: '#fff' }}>
                Salvar desenho
              </button>
              <button onClick={clearCanvas} disabled={busy} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>
                Limpar
              </button>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>Importar assinatura (PNG/JPG)</div>
            <input type="file" accept="image/png,image/jpeg" onChange={handleFileUpload} />
            <div style={{ marginTop: 10, color: '#6b7280', fontSize: 13 }}>
              Faça upload de uma imagem PNG/JPG com a sua assinatura. Use preferencialmente fundo transparente.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h3 style={{ marginBottom: 8 }}>Galeria</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {signatures.length === 0 && <div style={{ color: '#6b7280' }}>Nenhuma assinatura ainda.</div>}
            {signatures.map((sig) => (
              <div key={sig.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, border: '1px solid #eaeaea', borderRadius: 8 }}>
                <div style={{ width: 120, height: 60, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff' }}>
                  {sig.file_url ? <img src={sig.file_url} alt={sig.name || 'assinatura'} style={{ maxHeight: '100%', maxWidth: '100%' }} /> : <div style={{ color: '#9ca3af' }}>Sem preview</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{sig.name || 'Sem nome'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{sig.created_at ? new Date(sig.created_at).toLocaleString() : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => setDefaultSignature(sig.id)} disabled={busy || sig.is_default} style={{ padding: '6px 10px', borderRadius: 8, background: sig.is_default ? '#10b981' : '#2563eb', color: '#fff' }}>
                    {sig.is_default ? 'Padrão' : 'Definir padrão'}
                  </button>
                  <button onClick={() => handleDeleteSignature(sig)} disabled={busy} style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {info && <div style={{ marginTop: 8, color: '#111' }}>{info}</div>}
    </div>
  );
}
