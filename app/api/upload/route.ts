import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export async function POST(req: NextRequest){
  try {
    const form = await req.formData();
    const pdf = form.get('pdf') as File | null;
    const signature = form.get('signature') as File | null;
    const original_pdf_name = String(form.get('original_pdf_name')||'documento.pdf');
    const positions = JSON.parse(String(form.get('positions')||'[]'));

    if(!pdf) return NextResponse.json({ error: 'PDF obrigatório' }, { status: 400 });
    if(pdf.size > 20*1024*1024) return NextResponse.json({ error: 'PDF até 20MB' }, { status: 400 });

    const id = crypto.randomUUID();
    const ip = req.headers.get('x-forwarded-for') || req.ip || '';
    const ip_hash = crypto.createHash('sha256').update(ip).digest('hex');

    // rate limit: 5 uploads/hora por IP
    const oneHourAgo = new Date(Date.now()-60*60*1000).toISOString();
    const { count, error: rlErr } = await supabaseAdmin
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ip_hash)
      .gt('created_at', oneHourAgo);
    if (rlErr) throw rlErr;
    if ((count||0) >= 5) {
      return NextResponse.json({ error: 'Limite de 5 uploads por hora atingido. Tente novamente mais tarde.' }, { status: 429 });
    }

    // vincula usuário autenticado se houver token
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ')? auth.slice(7) : null;
    let userId: string | null = null;
    if (token){
      const { data: u } = await supabaseAdmin.auth.getUser(token);
      userId = u?.user?.id || null;
    }

 // cria registro do documento (forçando tipagem apenas aqui)
const payload = {
  id,
  user_id: userId,
  original_pdf_name,
  metadata: { positions },
  status: 'draft',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  signed_pdf_url: null,
  qr_code_url: null,
  ip_hash,
};

// usando 'as any' só aqui para evitar o 'never' do TS
const { error: errDoc } = await (supabaseAdmin as any)
  .from('documents')
  .insert(payload);

if (errDoc) {
  return NextResponse.json({ error: errDoc.message }, { status: 500 });
}

 // salva arquivos no Storage (bucket: 'signflow')
    const arrayBuffer = await pdf.arrayBuffer();
    const pathOriginal = `${id}/original.pdf`;
    const { error: upErr } = await supabaseAdmin.storage.from('signflow').upload(pathOriginal, Buffer.from(arrayBuffer), { contentType: 'application/pdf', upsert: true });
    if (upErr) throw upErr;

    if (signature){
      const sigBuf = Buffer.from(await signature.arrayBuffer());
      const { error: upSigErr } = await supabaseAdmin.storage.from('signflow').upload(`${id}/signature`, sigBuf, { upsert: true, contentType: signature.type || 'image/png' });
      if (upSigErr) throw upSigErr;
    }

    return NextResponse.json({ id });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Falha ao salvar' }, { status: 500 });
  }
}
