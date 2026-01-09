// app/api/cleanup/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  // Verificar se é uma chamada autorizada (ex: cron job)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  const now = new Date().toISOString();

  // Busca documentos expirados
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id')
    .lt('expires_at', now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{ id: string }>;

  // Remove arquivos no Storage
  for (const row of rows) {
    await supabaseAdmin.storage.from('signflow').remove([
      `${row.id}/original.pdf`,
      `${row.id}/signed.pdf`,
      `${row.id}/qr.png`,
      `${row.id}/signature`,
    ]);
  }

  // Apaga registros
  await supabaseAdmin.from('documents').delete().lt('expires_at', now);

  return NextResponse.json({ ok: true, removed: rows.length });
}
