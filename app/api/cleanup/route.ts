import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(){
  const { data, error } = await supabaseAdmin.from('documents').select('id').lt('expires_at', new Date().toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  for(const row of data||[]){
    await supabaseAdmin.storage.from('signflow').remove([`${row.id}/original.pdf`, `${row.id}/signed.pdf`, `${row.id}/qr.png`, `${row.id}/signature`]);
  }
  await supabaseAdmin.from('documents').delete().lt('expires_at', new Date().toISOString());
  return NextResponse.json({ ok: true, removed: data?.length||0 });
}
