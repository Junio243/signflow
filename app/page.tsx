'use client';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export default function Home() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` } });
    if (!error) setSent(true);
    else alert(error.message);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 items-center">
      <div className="card">
        <h1 className="text-2xl font-semibold mb-2">Assine PDFs com QR e histórico</h1>
        <p className="text-slate-600 mb-4">Login sem senha. Envie seu PDF, posicione a assinatura visual, gere QR dinâmico e compartilhe o documento assinado.</p>
        <form onSubmit={sendMagicLink} className="flex gap-2">
          <input className="input" type="email" required placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
          <button className="btn" disabled={sent}><Mail className="w-4 h-4 mr-2 inline"/> {sent? 'Link enviado' : 'Receber link mágico'}</button>
        </form>
        <p className="text-xs text-slate-500 mt-2">Usamos seu e‑mail apenas para autenticação. Sem spam.</p>
      </div>
      <div className="card">
        <ol className="list-decimal pl-6 text-sm space-y-2">
          <li>Faça login por link mágico.</li>
          <li>Envie um PDF e sua assinatura PNG/JPG.</li>
          <li>Arraste/ajuste a assinatura e gere o QR.</li>
          <li>Baixe o PDF assinado e compartilhe o link de validação.</li>
        </ol>
      </div>
    </div>
  );
}
