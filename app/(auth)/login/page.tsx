'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Login(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` } });
    if(!error) setSent(true); else alert(error.message);
  }
  return (
    <form onSubmit={onSubmit} className="card max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">Entrar</h1>
      <input className="input" placeholder="seu@email.com" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="btn mt-3" disabled={sent}>{sent? 'Link enviado' : 'Receber link mágico'}</button>
    </form>
  );
}
