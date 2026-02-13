import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function generateReport(
  id: string
) {
  const supabase = await createClient()

  // Buscar documento
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (docError || !doc) {
    return NextResponse.json(
      { error: 'Documento não encontrado' },
      { status: 404 }
    )
  }

  // Buscar eventos de assinatura
  const { data: events, error: eventsError } = await supabase
    .from('document_signing_events')
    .select('*')
    .eq('document_id', id)
    .order('signed_at', { ascending: false })

  if (eventsError) {
    console.error('Erro ao buscar eventos:', eventsError)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico de assinaturas' },
      { status: 500 }
    )
  }

  // Gerar HTML do relatório
  const html = generateReportHTML(doc, events || [])

  // Retornar HTML que pode ser impresso como PDF
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="relatorio-autenticidade-${id}.html"`,
    },
  })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    return await generateReport(id)
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    return await generateReport(id)
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

function generateReportHTML(doc: any, events: any[]) {
  const statusMap: Record<string, string> = {
    signed: 'Assinado',
    draft: 'Rascunho',
    canceled: 'Cancelado',
    expired: 'Expirado',
  }

  const status = statusMap[doc.status?.toLowerCase()] || doc.status || '—'
  const signedAt = doc.created_at ? new Date(doc.created_at).toLocaleString('pt-BR') : 'Data não informada'
  const documentName = doc.original_pdf_name || 'Documento assinado'

  const isCanceled = doc.status?.toLowerCase() === 'canceled'
  const isExpired = doc.status?.toLowerCase() === 'expired'
  const isValid = !isCanceled && !isExpired

  const eventsHTML = events.map(event => {
    const eventSignedAt = event.signed_at ? new Date(event.signed_at).toLocaleString('pt-BR') : 'Data não informada'
    const validUntil = event.certificate_valid_until
      ? new Date(event.certificate_valid_until).toLocaleDateString('pt-BR')
      : 'Validade não informada'

    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; page-break-inside: avoid;">
        <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${event.signer_name}</div>
        <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">${event.signer_reg || 'Registro não informado'}</div>
        ${event.signer_email ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">${event.signer_email}</div>` : ''}
        <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Assinado em</div>
            <div style="font-size: 13px;">${eventSignedAt}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Certificado</div>
            <div style="font-size: 13px;">${event.certificate_type || 'Tipo não informado'}</div>
          </div>
          <div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Validade</div>
            <div style="font-size: 13px;">${validUntil}</div>
          </div>
          ${event.certificate_issuer ? `
          <div>
            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Emissor</div>
            <div style="font-size: 13px;">${event.certificate_issuer}</div>
          </div>
          ` : ''}
        </div>
      </div>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Autenticidade - ${doc.id}</title>
  <style>
    @media print {
      @page {
        margin: 1.5cm;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
      background: #f9fafb;
    }
    
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 32px;
    }
    
    .header {
      border-bottom: 3px solid ${isValid ? '#10b981' : isCanceled ? '#b91c1c' : '#b45309'};
      padding-bottom: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #6b7280;
    }
    
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      margin-top: 12px;
      background: ${isValid ? '#d1fae5' : isCanceled ? '#fecaca' : '#fed7aa'};
      color: ${isValid ? '#065f46' : isCanceled ? '#7f1d1d' : '#92400e'};
    }
    
    .section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 20px;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .info-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .info-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .info-value {
      font-size: 14px;
      color: #111827;
      font-weight: 500;
    }
    
    .alert {
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 14px;
    }
    
    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }
    
    .alert-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #7f1d1d;
    }
    
    .seal-container {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: center;
      margin: 24px 0;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    
    .seal-text {
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
    }
    
    .print-button {
      display: inline-block;
      margin: 20px auto;
      padding: 12px 24px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
    
    .print-button:hover {
      background: #1d4ed8;
    }
    
    .qr-section {
      text-align: center;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
      margin: 20px 0;
    }
    
    .qr-section img {
      max-width: 200px;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px;
      background: white;
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 20px;">
    <button class="print-button" onclick="window.print()">Imprimir / Salvar como PDF</button>
  </div>
  
  <div class="container">
    <div class="header">
      <h1>Relatório de Autenticidade</h1>
      <div class="subtitle">Documento assinado digitalmente com certificado ICP-Brasil</div>
      <div class="status-badge">${status}</div>
    </div>
    
    ${isCanceled ? `
    <div class="alert alert-danger">
      <strong>⚠️ Atenção:</strong> Este documento foi <strong>cancelado</strong> ${doc.canceled_at ? 'em ' + new Date(doc.canceled_at).toLocaleString('pt-BR') : ''} e não deve mais ser considerado válido.
    </div>
    ` : ''}
    
    ${isExpired ? `
    <div class="alert alert-warning">
      <strong>⚠️ Atenção:</strong> Este documento está <strong>expirado</strong> e não deve mais ser considerado válido.
    </div>
    ` : ''}
    
    <div class="section">
      <h2>Informações do Documento</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">${status}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Data de assinatura</div>
          <div class="info-value">${signedAt}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Nome do arquivo</div>
          <div class="info-value">${documentName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">ID do documento</div>
          <div class="info-value" style="font-family: monospace; font-size: 11px; word-break: break-all;">${doc.id}</div>
        </div>
      </div>
    </div>
    
    ${doc.qr_code_url ? `
    <div class="qr-section">
      <h3 style="font-size: 16px; margin-bottom: 12px; color: #111827;">QR Code de Validação</h3>
      <img src="${doc.qr_code_url}" alt="QR Code de validação" />
      <p style="font-size: 12px; color: #6b7280; margin-top: 12px;">
        Escaneie este QR Code para validar a autenticidade do documento online
      </p>
    </div>
    ` : ''}
    
    <div class="section">
      <h2>Histórico de Assinaturas</h2>
      ${events.length === 0 ? '<p style="color: #6b7280; font-size: 14px;">Nenhum evento de assinatura registrado.</p>' : eventsHTML}
    </div>
    
    <div class="seal-container">
      <div>
        <div class="seal-text" style="font-weight: 600; margin-bottom: 4px;">Certificado por</div>
        <div class="seal-text">ICP-Brasil</div>
      </div>
      <div style="width: 1px; height: 40px; background: #e5e7eb;"></div>
      <div>
        <div class="seal-text" style="font-weight: 600; margin-bottom: 4px;">Tecnologia</div>
        <div class="seal-text">ITI - Instituto Nacional de Tecnologia da Informação</div>
      </div>
    </div>
    
    <div class="section">
      <h2>Sobre este Relatório</h2>
      <p style="font-size: 13px; color: #4b5563; line-height: 1.8;">
        Este relatório de autenticidade foi gerado automaticamente pelo sistema SignFlow e atesta que o documento identificado 
        acima foi assinado digitalmente utilizando certificados digitais reconhecidos pela Infraestrutura de Chaves Públicas 
        Brasileira (ICP-Brasil). As assinaturas digitais garantem a autenticidade, integridade e não-repúdio do documento.
      </p>
      <p style="font-size: 13px; color: #4b5563; line-height: 1.8; margin-top: 12px;">
        Para verificar a validade deste documento, acesse: <strong>https://signflow-beta.vercel.app/validate/${doc.id}</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
      <p style="margin-top: 8px;">SignFlow - Sistema de Assinatura Digital</p>
      <p style="margin-top: 4px;">Este documento foi gerado eletronicamente e é válido sem assinatura física</p>
    </div>
  </div>
</body>
</html>
  `
}
