'use client';
import { useEffect, useState } from 'react';
import PdfEditor from '@/components/PdfEditor';
import { Card, Input, Label } from '@/components/Ui';
import { createClient } from '@supabase/supabase-js';

export default function Editor({ params }: { params: { id: string } }){
  const [pdf, setPdf] = useState<File|null>(null);
  const [sig, setSig] = useState<File|null>(null);
  const [positions, setPositions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(()=>{ if(params.id==='new') setPositions([]); },[params.id]);

  async function handleUpload(){
    if(!pdf) return alert('Envie um PDF.');
    setSaving(true);
    const fd = new FormData();
    fd.append('pdf', pdf);
    if(sig) fd.append('signature', sig);
    fd.append('original_pdf_name', name || pdf.name);
    fd.append('positions', JSON.stringify(positions));
    const { data: { session } } = await supabase.auth.getSession();
    const headers: any = {};
    if (session?.access_token) headers['authorization'] = 'Bearer ' + session.access_token;
    const res = await fetch('/api/upload', { method:'POST', body: fd, headers });
    const data = await res.json();
    if(!res.ok) { setSaving(false); return alert(data.error || 'Falhou'); }
    const res2 = await fetch('/api/sign', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: data.id }) });
    const data2 = await res2.json();
    setSaving(false);
    if(!res2.ok) return alert(data2.error || 'Falhou ao assinar');
    window.location.href = `/validate/${data.id}`;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>PDF</Label>
            <Input
              type="file"
              accept="application/pdf"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPdf(e.target.files?.[0] || null)
              }
            />
          </div>
          <div>
            <Label>Assinatura (PNG/JPG)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSig(e.target.files?.[0] || null)
              }
            />
          </div>
        </div>
        <PdfEditor file={pdf} signature={sig} positions={positions} onPositions={setPositions} />
      </Card>
      <Card>
        <div className="space-y-2">
          <Label>Nome do arquivo</Label>
          <Input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            placeholder="Contrato.pdf"
          />
          <button className="btn w-full" onClick={handleUpload} disabled={saving}>Aplicar assinatura + Gerar QR</button>
          <p className="text-xs text-slate-500">O QR será inserido na última página, canto inferior esquerdo.</p>
        </div>
      </Card>
    </div>
  );
}
