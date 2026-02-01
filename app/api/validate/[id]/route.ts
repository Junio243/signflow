// app/api/validate/[id]/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { documentIdSchema, storedMetadataSchema, Metadata, Position } from '@/lib/validation/documentSchemas';
import { createRateLimiter, addRateLimitHeaders } from '@/lib/middleware/rateLimit';

type ValidationPayload = {
  requires_code: boolean;
  document?: Record<string, unknown>;
  events?: Record<string, unknown>[];
};

const DOC_SELECT =
  'id, status, created_at, signed_pdf_url, qr_code_url, original_pdf_name, validation_theme_snapshot, metadata, canceled_at';

const sanitizeMetadata = (metadata: Metadata | null) => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return metadata;
  }
  const { validation_access_code: _ignored, ...rest } = metadata as Metadata & {
    validation_access_code?: string | null;
  };
  return rest;
};

const normalizeMetadata = (rawMetadata: unknown): Metadata | null => {
  const parsed = storedMetadataSchema.safeParse(rawMetadata);
  if (!parsed.success) return null;
  if (Array.isArray(parsed.data)) {
    return { positions: parsed.data as Position[] };
  }
  return (parsed.data as Metadata) || null;
};

const getValidationConfig = (metadata: Metadata | null) => {
  const requiresCode = metadata?.validation_requires_code === true;
  const accessCodeRaw = (metadata as any)?.validation_access_code;
  const accessCode =
    typeof accessCodeRaw === 'string' && accessCodeRaw.trim()
      ? accessCodeRaw.trim()
      : null;
  return { requiresCode, accessCode };
};

const buildResponse = (
  payload: ValidationPayload,
  headers: Record<string, string>
) => {
  const response = NextResponse.json(payload, { status: 200 });
  return addRateLimitHeaders(response, headers);
};

// Rate limiter: max 30 attempts per 5 minutes
const rateLimiter = createRateLimiter('/api/validate', {
  maxRequests: 30,
  windowMs: 5 * 60 * 1000, // 5 minutes
  message: 'Muitas tentativas de validação. Tente novamente em alguns minutos.',
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter(req);
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  const idResult = documentIdSchema.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const docRes = await supabaseAdmin
    .from('documents')
    .select(DOC_SELECT)
    .eq('id', idResult.data)
    .maybeSingle();

  if (docRes.error) {
    return NextResponse.json({ error: docRes.error.message }, { status: 500 });
  }
  if (!docRes.data) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
  }

  const metadata = normalizeMetadata(docRes.data.metadata);
  const { requiresCode } = getValidationConfig(metadata);

  if (requiresCode) {
    return buildResponse({ requires_code: true }, rateLimitResult.headers);
  }

  const docPayload = {
    ...docRes.data,
    metadata: sanitizeMetadata(metadata),
  };

  const eventsRes = await supabaseAdmin
    .from('document_signing_events')
    .select('id, document_id, signer_name, signer_reg, certificate_type, certificate_issuer, signer_email, signed_at, certificate_valid_until, logo_url, metadata')
    .eq('document_id', idResult.data)
    .order('signed_at', { ascending: true });

  if (eventsRes.error) {
    return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
  }

  return buildResponse({
    requires_code: false,
    document: docPayload,
    events: eventsRes.data || [],
  }, rateLimitResult.headers);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Apply rate limiting
  const rateLimitResult = await rateLimiter(req);
  if (!rateLimitResult.allowed) return rateLimitResult.response;

  const idResult = documentIdSchema.safeParse(params.id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 });
  }

  let body: { code?: string } = {};
  try {
    body = (await req.json()) as { code?: string };
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  const docRes = await supabaseAdmin
    .from('documents')
    .select(DOC_SELECT)
    .eq('id', idResult.data)
    .maybeSingle();

  if (docRes.error) {
    return NextResponse.json({ error: docRes.error.message }, { status: 500 });
  }
  if (!docRes.data) {
    return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
  }

  const metadata = normalizeMetadata(docRes.data.metadata);
  const { requiresCode, accessCode } = getValidationConfig(metadata);

  const normalizedCode = typeof body.code === 'string' ? body.code.trim() : '';
  if (requiresCode && (!accessCode || normalizedCode.toUpperCase() !== accessCode.toUpperCase())) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 403 });
  }

  const docPayload = {
    ...docRes.data,
    metadata: sanitizeMetadata(metadata),
  };

  const eventsRes = await supabaseAdmin
    .from('document_signing_events')
    .select('id, document_id, signer_name, signer_reg, certificate_type, certificate_issuer, signer_email, signed_at, certificate_valid_until, logo_url, metadata')
    .eq('document_id', idResult.data)
    .order('signed_at', { ascending: true });

  if (eventsRes.error) {
    return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
  }

  return buildResponse({
    requires_code: false,
    document: docPayload,
    events: eventsRes.data || [],
  }, rateLimitResult.headers);
}
