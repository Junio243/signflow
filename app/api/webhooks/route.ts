// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * GET /api/webhooks
 * Lista webhooks do usuário autenticado
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Obter usuário autenticado
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar webhooks
    const { data, error } = await supabase
      .from('webhooks')
      .select('id, url, events, active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch webhooks', error, { userId: user.id });
      return NextResponse.json({ error: 'Erro ao buscar webhooks' }, { status: 500 });
    }

    return NextResponse.json({ webhooks: data });
  } catch (error: any) {
    logger.error('Exception in GET /api/webhooks', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/webhooks
 * Cria novo webhook
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Autenticar usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { url, events } = body;

    // Validar campos
    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'URL e eventos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Gerar secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Criar webhook
    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: user.id,
        url,
        events,
        secret,
        active: true,
      })
      .select('id, url, events, active, created_at')
      .single();

    if (error) {
      logger.error('Failed to create webhook', error, { userId: user.id });
      return NextResponse.json({ error: 'Erro ao criar webhook' }, { status: 500 });
    }

    logger.info('Webhook created', { webhookId: data.id, userId: user.id });

    return NextResponse.json({
      webhook: data,
      secret, // Retornar secret apenas na criação
    });
  } catch (error: any) {
    logger.error('Exception in POST /api/webhooks', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/[id]
 * Remove webhook
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Autenticar usuário
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json({ error: 'ID do webhook é obrigatório' }, { status: 400 });
    }

    // Deletar webhook
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Failed to delete webhook', error, { webhookId, userId: user.id });
      return NextResponse.json({ error: 'Erro ao deletar webhook' }, { status: 500 });
    }

    logger.info('Webhook deleted', { webhookId, userId: user.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Exception in DELETE /api/webhooks', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
