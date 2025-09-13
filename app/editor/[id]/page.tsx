'use client';

import { useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Label, Input, cn } from '@/components/Ui';

type Position = {
  page: number;     // 1-based
  nx: number;       // 0..1 (largura, 0 = esquerda, 1 = direita)
  ny: number;       // 0..1 (altura, 0 = topo, 1 = base)
  scale: number;    // 1.0 = largura base ~240pt no PDF final
  rotation: number; // graus
};

export default function EditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [pdf, setPdf] = useState<File | null>(null);
  const [sig, setSig] = useState<File | null>(null);

  // exemplo simples de posição padrão (você pode trocar por algo interativo depois)
  const [positions] = useState<Position[]>([
    { page: 1, nx: 0.5, ny: 0.2, scale: 1, rotation: 0 },
  ]);

  const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPdf(e.currentTarget.files?.[0] ?? null);
  };

  const handleSigChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSig(e.currentTarget.files?.[0] ?? null);
  };

  const handleUploadAndSign = async () => {
    if (!pdf) {
      alert('Envie um PDF primeiro.');
      return;
    }

    try {
      // 1) /api/upload → cria registro e sobe arquivos
      const fd = new FormData();
      fd.append('id', params.id);
      fd.append('pdf', pdf);
      if (sig) fd.append('signature', sig);
      fd.append('positions', JSON.stringify(positions));

      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upJson = await up.json();
      if (!up.ok) {
        console.error(upJson);
        alert(upJson.error || 'Falha no upload');
        return;
      }

      // 2) /api/sign → aplica assinatura e QR no PDF
      const sign = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id }),
      });
      const signJson = await sign.json();
      if (!sign.ok) {
        console.error(signJson);
        alert(signJson.error || 'Falha ao assinar');
        return;
      }

      // 3) Redireciona para a página pública de validação
      router.push(`/validate/${params.id}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro inesperado');
    }
  };

  return (
    <main className={cn('mx-auto max-w-2xl p-6 space-y-6')}>
      <h1 className="text-2xl font-semibold">Editor — Documento {params.id}</h1>

      <Card className="space-y-4 p-4">
        <div>
          <Label>PDF</Label>
          <Input
            type="file"
            accept="application/pdf"
            onChange={handlePdfChange}
          />
        </div>

        <div>
          <Label>Assinatura (PNG/JPG)</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleSigChange}
          />
        </div>

        <p className="text-sm text-gray-600">
          *Padrão de posição: página 1, centro inferior (nx=0.5, ny=0.2), escala 1.0, rotação 0°.
          Depois podemos trocar por posicionamento visual (arrastar e soltar).
        </p>

        <button
          onClick={handleUploadAndSign}
          className="rounded-lg px-4 py-2 border hover:bg-gray-50"
        >
          Aplicar assinatura + Gerar QR
        </button>
      </Card>
    </main>
  );
}
