// app/orgs/[orgId]/templates/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type TemplateRow = {
  id: string;
  name: string;
  file_url?: string;
  placeholders?: any;
  storage_path?: string | null;
  created_at?: string;
};

export default function OrgTemplates({ params }: { params: { orgId: string } }) {
  const orgId = params.orgId;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const placeholdersRef = useRef<HTMLTextAreaElement | null>(null);

  const placeholdersExample = '[{"name":"nome","label":"Nome"}]';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('templates')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });
        setTemplates((data || []) as TemplateRow[]);
      } catch (e) {
        console.error(e);
        setInfo('Erro ao carregar templates.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  async function handleUpload() {
    const name = nameRef.current?.value?.trim() || '';
    const file = fileRef.current?.files?.[0] || null;
    const placeholdersTxt = placeholdersRef.current?.value || '[]';
    if (!name) {
      setInfo('Informe o nome do template.');
      return;
    }
    if (!file) {
      setInfo('Selecione um arquivo PDF.');
      return;
    }

    setBusy(true);
    setInfo(null);

    try {
      const safeName = name.replace(/\s+/g, '-').toLowerCase();
      const path = `${orgId}/${Date.now()}-${safeName}.pdf`;

      const { error: upErr } = await supabase.storage
        .from('signflow-templates')
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('signflow-templates').getPublicUrl(path);
      const fileUrl = pub?.publicUrl ?? null;

      // parse placeholders JSON safely
      let placeholders = [];
      try {
        placeholders = JSON.parse(placeholdersTxt);
        if (!Array.isArray(placeholders)) placeholders = [];
      } catch (err) {
        placeholders = [];
      }

      const createdBy = (await supabase.auth.getSession()).data?.session?.user?.id ?? null;

      const { data: ins, error: insErr } = await supabase
        .from('templates')
        .insert({
          org_id: orgId,
          name,
          storage_path: path,
          file_url: fileUrl,
          placeholders,
          created_by: createdBy
        })
        .select()
        .single();

      if (insErr) throw insErr;

      setTemplates(prev => [ins as TemplateRow, ...prev]);
      setInfo('Template criado.');
      if (fileRef.current) fileRef.current.value = '';
      if (nameRef.current) nameRef.current.value = '';
      if (placeholdersRef.current) placeholdersRef.current.value = '[]';
    } catch (err: any) {
      console.error(err);
      setInfo('Erro ao criar template: ' + (err?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(t: TemplateRow) {
    if (!confirm('Remover template?')) return;
    setBusy(true);
    setInfo(null);
    try {
      // attempt to remove storage object if we have storage_path
      if (t.storage_path) {
        const { error: delErr } = await supabase.storage.from('signflow-templates').remove([t.storage_path]);
        if (delErr) console.warn('Erro ao remover arquivo do storage:', delErr);
      }
      const { error } = await supabase.from('templates').delete().eq('id', t.id);
      if (error) throw error;
      setTemplates(prev => prev.filter(x => x.id !== t.id));
      setInfo('Template removido.');
    } catch (err: any) {
      console.error(err);
      setInfo('Erro ao remover: ' + (err?.message ?? 'desconhecido'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p style={{ padding: 16 }}>Carregando…</p>;
  }

  return (
    <div style={{ maxWidth: 980, margin: '24px auto', padding: 16 }}>
      <h1 style={{ fontSize: 22 }}>Templates da organização</h1>

      <section style={{ marginTop: 12, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Criar template</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            ref={nameRef}
            placeholder="Nome do template"
            style={{ padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <input type="file" accept="application/pdf" ref={fileRef} />
          <label style={{ fontSize: 13, color: '#6b7280' }}>
            Placeholders (JSON) — ex: <span style={{ fontFamily: 'monospace' }}>{placeholdersExample}</span>
          </label>
          <textarea
            ref={placeholdersRef}
            defaultValue={'[]'}
            style={{ minHeight: 120, padding: 8, border: '1px solid #e5e7eb', borderRadius: 8 }}
          />
          <div>
            <button
              onClick={handleUpload}
              disabled={busy}
              style={{ padding: '8px 12px', borderRadius: 8, background: '#2563eb', color: '#fff' }}
            >
              {busy ? 'Enviando…' : 'Criar template'}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h3>Templates existentes</h3>
        {templates.length === 0 && <div style={{ color: '#6b7280' }}>Nenhum template ainda.</div>}
        <div style={{ display: 'grid', gap: 10 }}>
          {templates.map(t => (
            <div key={t.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, border: '1px solid #eaeaea', borderRadius: 8 }}>
              <div style={{ width: 120, height: 80, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#fff' }}>
                {t.file_url ? (
                  <iframe src={t.file_url} title={t.name} style={{ width: '100%', height: '100%', border: 0 }} />
                ) : (
                  <div style={{ color: '#9ca3af' }}>Sem preview</div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{t.created_at ? new Date(t.created_at).toLocaleString() : ''}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <a href={t.file_url} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>Abrir</a>
                <button onClick={() => handleDelete(t)} disabled={busy} style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #e5e7eb' }}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {info && <div style={{ marginTop: 12 }}>{info}</div>}
    </div>
  );
}
