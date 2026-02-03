/**
 * API para gerenciamento de certificados digitais SignFlow
 * 
 * Permite visualizar, renovar e obter informações sobre certificados
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateSignFlowCertificate,
  getCertificateInfo,
  renewSignFlowCertificate,
  clearCertificateCache
} from '@/lib/certificateManager';

/**
 * GET /api/certificates
 * 
 * Obtém informações do certificado atual
 */
export async function GET(req: NextRequest) {
  try {
    const info = await getCertificateInfo();

    if (!info) {
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: info
    });
  } catch (error) {
    console.error('[CERTIFICATES_GET_ERROR]', error);
    return NextResponse.json(
      { 
        error: 'Erro ao obter informações do certificado',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates
 * 
 * Ações:
 * - renew: Renova o certificado (gera novo)
 * - clear-cache: Limpa cache do certificado
 * - initialize: Força inicialização/criação do certificado
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'renew': {
        console.log('🔄 Renovando certificado via API...');
        const newCert = await renewSignFlowCertificate();
        
        return NextResponse.json({
          success: true,
          message: 'Certificado renovado com sucesso',
          certificate: {
            serialNumber: newCert.serial_number,
            validFrom: newCert.valid_from,
            validUntil: newCert.valid_until,
            environment: newCert.environment
          }
        });
      }

      case 'clear-cache': {
        console.log('🗑️ Limpando cache via API...');
        clearCertificateCache();
        
        return NextResponse.json({
          success: true,
          message: 'Cache limpo com sucesso'
        });
      }

      case 'initialize': {
        console.log('🏭 Inicializando certificado via API...');
        const cert = await getOrCreateSignFlowCertificate();
        
        return NextResponse.json({
          success: true,
          message: 'Certificado inicializado',
          certificate: {
            serialNumber: cert.serial_number,
            validFrom: cert.valid_from,
            validUntil: cert.valid_until,
            environment: cert.environment
          }
        });
      }

      default:
        return NextResponse.json(
          { 
            error: 'Ação inválida',
            validActions: ['renew', 'clear-cache', 'initialize']
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[CERTIFICATES_POST_ERROR]', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar ação',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
