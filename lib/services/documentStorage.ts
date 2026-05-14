// lib/services/documentStorage.ts
// Responsabilidade única: operações de storage e banco para documentos
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { SignerInfo } from './pdfSigner'

export async function downloadFileFromStorage(path: string): Promise<Uint8Array | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage.from('signflow').download(path)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}

export async function uploadSignedPdf(
  documentId: string,
  signedBytes: Uint8Array,
  qrPng: Buffer,
): Promise<{ signedPdfUrl: string | null; qrCodeUrl: string | null; error?: string }> {
  const supabase = getSupabaseAdmin()

  const signedPath = `${documentId}/signed.pdf`
  const qrPath = `${documentId}/qrcode.png`

  const { error: upErr } = await supabase.storage
    .from('signflow')
    .upload(signedPath, signedBytes, { contentType: 'application/pdf', upsert: true })

  if (upErr) return { signedPdfUrl: null, qrCodeUrl: null, error: upErr.message }

  await supabase.storage
    .from('signflow')
    .upload(qrPath, qrPng, { contentType: 'image/png', upsert: true })

  const { data: signedUrlData } = supabase.storage.from('signflow').getPublicUrl(signedPath)
  const { data: qrUrlData } = supabase.storage.from('signflow').getPublicUrl(qrPath)

  return {
    signedPdfUrl: signedUrlData?.publicUrl ?? null,
    qrCodeUrl: qrUrlData?.publicUrl ?? null,
  }
}

export async function updateDocumentStatus(
  documentId: string,
  signedPdfUrl: string | null,
  qrCodeUrl: string | null,
  opts: { validationRequiresCode?: boolean; validationAccessCode?: string | null } = {},
) {
  const supabase = getSupabaseAdmin()
  const payload: Record<string, unknown> = { status: 'signed', signed_pdf_url: signedPdfUrl, qr_code_url: qrCodeUrl }

  if (opts.validationRequiresCode) {
    payload.validation_requires_code = true
    if (opts.validationAccessCode) payload.validation_access_code = opts.validationAccessCode
  }

  const { error } = await supabase.from('documents').update(payload).eq('id', documentId)
  if (error) console.error('[documentStorage] update error:', error.message)
}

export async function insertSigningEvents(documentId: string, signers: SignerInfo[], signedAt: string) {
  const supabase = getSupabaseAdmin()

  const events = signers
    .filter(s => s?.name?.trim())
    .map(s => ({
      document_id: documentId,
      signer_name: s.name.trim(),
      signer_reg: s.reg?.trim() || null,
      certificate_type: s.certificate_type?.trim() || null,
      certificate_issuer: s.certificate_issuer?.trim() || null,
      signer_email: s.email?.trim() || null,
      certificate_valid_until: s.certificate_valid_until?.trim() || null,
      logo_url: s.logo_url?.trim() || null,
      signed_at: signedAt,
    }))

  if (events.length === 0) return

  const { error } = await supabase.from('document_signing_events').insert(events)
  if (error) console.error('[documentStorage] signing_events error:', error.message)
}
