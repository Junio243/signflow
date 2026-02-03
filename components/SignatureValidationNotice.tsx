'use client';

import { Info, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SignatureValidationNotice() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">
            🔐 Como visualizar o selo verde de validação no Adobe Reader
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Para que a assinatura digital seja reconhecida automaticamente pelo Adobe Reader, 
            é necessário adicionar o certificado do SignFlow à lista de certificados confiáveis. 
            Você só precisa fazer isso <strong>uma única vez</strong>.
          </p>
          
          <div className="space-y-2 text-sm text-blue-800 mb-3">
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Abra o PDF no Adobe Reader</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Clique com botão direito na assinatura → "Show Signature Properties"</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Clique em "Show Signer's Certificate"</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Aba "Trust" → "Add to Trusted Certificates"</span>
            </div>
            <div className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>Marque "Use this certificate as trusted root" → OK</span>
            </div>
          </div>

          <Link 
            href="/docs/validacao-assinatura"
            target="_blank"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            Ver guia completo com imagens
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
