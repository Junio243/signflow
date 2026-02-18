'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DashboardSkeleton } from '@/components/ui/PageSkeleton';

type Profile = { id: string; name: string; type: 'medico' | 'faculdade' | 'generico'; theme: any };

export default function AppearancePage() {
  const router = useRouter();
  const supabaseClient = supabase;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [type, setType] = useState<'medico' | 'faculdade' | 'generico'>('generico');
  const [color, setColor] = useState('#2563eb');
  const [footer, setFooter] = useState('Documento assinado digitalmente via SignFlow.');
  const [issuer, setIssuer] = useState('Instituição/Profissional');
  const [reg, setReg] = useState('Registro (CRM/CRP/OAB/CNPJ)');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [certificateType, setCertificateType] = useState('Certificado digital ICP-Brasil');
  const [certificateValidUntil, setCertificateValidUntil] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [info, setInfo] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const boot = async () => {
      if (!supabaseClient) {
        setInfo({ type: 'error', message: 'Serviço de autenticação indisponível.' });
        setLoading(false);
        return;
      }
      const s = await supabaseClient.auth.getSession();
      if (!s.data?.session) {
        setInfo({ type: 'info', message: 'Você precisa estar logado para criar perfis. Acesse /login.' });
        setHasSession(false);
        setLoading(false);
        return;
      }
      setHasSession(true);
      const { data } = await supabaseClient
        .from('validation_profiles')
        .select('id, name, type, theme')
        .order('created_at', { ascending: false });
      setProfiles((data || []) as Profile[]);
      setLoading(false);
    };
    boot();
  }, []);

  const uploadLogoIfAny = async (): Promise<{ url: string | null; ok: boolean }> => {
    if (!logoFile) return { url: null, ok: true };
    if (!supabaseClient) return { url: null, ok: false };
    const key = `branding/${Date.now()}-${logoFile.name}`;
    const up = await supabaseClient.storage.from('signflow').upload(key, logoFile, { contentType: logoFile.type, upsert: true });
    if (up.error) { setInfo({ type: 'error', message: 'Não foi possível enviar o logo.' }); return { url: null, ok: false }; }
    const pub = supabaseClient.storage.from('signflow').getPublicUrl(key);
    if (!pub.data?.publicUrl) return { url: null, ok: false };
    return { url: pub.data.publicUrl, ok: true };
  };

  const createProfile = async () => {
    if (!hasSession) { setInfo({ type: 'error', message: 'Faça login para criar perfis.' }); return; }
    try {
      setSaving(true);
      setInfo(null);
      const { url: logo, ok: uploaded } = await uploadLogoIfAny();
      if (!uploaded) { setSaving(false); return; }
      const theme = {
        color, footer, issuer, reg,
        logo_url: logo ?? logoUrl ?? null,
        certificate_type: certificateType,
        certificate_valid_until: certificateValidUntil.trim() || null,
      };
      if (!supabaseClient) { setSaving(false); return; }
      const { error } = await supabaseClient.from('validation_profiles').insert({ name, type, theme });
      if (error) { setInfo({ type: 'error', message: `Erro ao salvar: ${error.message}` }); setSaving(false); return; }
      setInfo({ type: 'success', message: 'Perfil criado com sucesso!' });
      setName(''); setLogoFile(null); setLogoUrl(null);
      setCertificateType('Certificado digital ICP-Brasil'); setCertificateValidUntil('');
      const { data } = await supabaseClient.from('validation_profiles').select('id, name, type, theme').order('created_at', { ascending: false });
      setProfiles((data || []) as Profile[]);
    } catch { setInfo({ type: 'error', message: 'Falha inesperada ao criar perfil.' }); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <DashboardSkeleton />
      </div>
    );
  }

  const alertClass = info?.type === 'success' ? 'alert-success' : info?.type === 'error' ? 'alert-error' : 'alert-info';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aparência</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Personalize perfis de validação e o tema da interface.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => router.push('/editor')}
            className="btn btn-secondary text-sm"
          >
            ← Voltar ao Editor
          </button>
        </div>
      </div>

      {/* Seção: Tema */}
      <div className="card mb-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Tema da interface</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Escolha entre claro, escuro ou o tema do seu sistema operacional.
        </p>
        <ThemeToggle />
      </div>

      {/* Feedback */}
      {info && (
        <div className={`alert ${alertClass} mb-4`} role="alert">
          {info.message}
        </div>
      )}

      {/* Grid: Novo perfil + Perfis existentes */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Formulário */}
        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Novo perfil de validação</h2>
          <fieldset disabled={!hasSession || saving} className="space-y-3">
            <input
              placeholder="Nome do perfil (ex.: Médico CRM/DF)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />

            <div className="flex flex-wrap gap-4 text-sm">
              {(['medico', 'faculdade', 'generico'] as const).map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-1.5">
                  <input type="radio" checked={type === t} onChange={() => setType(t)} className="accent-brand-600" />
                  <span className="capitalize">{t === 'medico' ? 'Médico' : t === 'faculdade' ? 'Faculdade' : 'Genérico'}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 dark:text-slate-400">Cor do tema:</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-slate-200" />
              <span className="text-xs text-slate-400">{color}</span>
            </div>

            <input placeholder="Instituição/Profissional" value={issuer} onChange={(e) => setIssuer(e.target.value)} className="input" />
            <input placeholder="Registro (CRM/CRP/OAB/CNPJ)" value={reg} onChange={(e) => setReg(e.target.value)} className="input" />
            <input placeholder="Tipo de certificado (ex.: ICP-Brasil A3)" value={certificateType} onChange={(e) => setCertificateType(e.target.value)} className="input" />

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Validade do certificado</label>
              <input type="date" value={certificateValidUntil} onChange={(e) => setCertificateValidUntil(e.target.value)} className="input" />
            </div>

            <textarea placeholder="Texto do rodapé" value={footer} onChange={(e) => setFooter(e.target.value)} rows={2} className="input resize-none" />

            <div>
              <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Logo (opcional, PNG/JPG)</label>
              <input type="file" accept="image/png,image/jpeg" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
            </div>

            <button
              onClick={createProfile}
              disabled={!name || !hasSession || saving}
              className="btn btn-primary w-full"
            >
              {saving ? 'Salvando…' : 'Salvar perfil'}
            </button>
          </fieldset>
        </div>

        {/* Lista de perfis */}
        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Seus perfis</h2>
          {profiles.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum perfil criado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {profiles.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{p.type}</p>
                  </div>
                  <div
                    className="h-5 w-5 rounded-full border border-slate-300"
                    style={{ background: p.theme?.color ?? '#2563eb' }}
                    title={`Cor: ${p.theme?.color ?? '#2563eb'}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
