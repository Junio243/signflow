'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Server,
  Key,
  FileKey,
  Calendar,
  Info,
  Trash2,
  Settings
} from 'lucide-react';

interface CertificateInfo {
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validUntil: string;
  daysUntilExpiry: number;
  isValid: boolean;
  isNearExpiry: boolean;
}

export default function CertificatesPage() {
  const [certificate, setCertificate] = useState<CertificateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadCertificate();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function loadCertificate() {
    try {
      setLoading(true);
      const response = await fetch('/api/certificates');
      const data = await response.json();

      if (data.success) {
        setCertificate(data.certificate);
      } else {
        setCertificate(null);
      }
    } catch (error) {
      console.error('Erro ao carregar certificado:', error);
      setToast({ message: 'Erro ao carregar certificado', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    try {
      setActionLoading(action);
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (data.success) {
        setToast({ message: data.message, type: 'success' });
        await loadCertificate();
      } else {
        setToast({ message: data.error || 'Erro ao executar ação', type: 'error' });
      }
    } catch (error) {
      console.error('Erro na ação:', error);
      setToast({ message: 'Erro ao executar ação', type: 'error' });
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusInfo() {
    if (!certificate) return null;

    if (!certificate.isValid) {
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        text: 'Expirado',
        color: 'bg-red-100 text-red-800 border-red-300'
      };
    }

    if (certificate.isNearExpiry) {
      return {
        icon: <Clock className="h-5 w-5" />,
        text: 'Próximo do Vencimento',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      };
    }

    return {
      icon: <CheckCircle2 className="h-5 w-5" />,
      text: 'Válido',
      color: 'bg-green-100 text-green-800 border-green-300'
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-300' : 'bg-red-50 text-red-800 border border-red-300'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Certificados Digitais</h1>
        </div>
        <p className="text-gray-600">
          Gerencie os certificados auto-gerenciados do SignFlow para assinatura digital de PDFs
        </p>
      </div>

      {/* Status Alert */}
      {!certificate ? (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 text-sm">
            Nenhum certificado encontrado. Clique em "Inicializar Certificado" para gerar um novo automaticamente.
          </p>
        </div>
      ) : certificate.isNearExpiry ? (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 text-sm">
            <strong>Atenção:</strong> Seu certificado vencerá em {certificate.daysUntilExpiry} dias. Considere renová-lo em breve.
          </p>
        </div>
      ) : !certificate.isValid ? (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">
            <strong>Certificado Expirado!</strong> Renove imediatamente para continuar assinando documentos.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {/* Certificate Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileKey className="h-5 w-5" />
                  Certificado Atual
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Certificado auto-gerenciado ativo no sistema
                </p>
              </div>
              {statusInfo && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {statusInfo.text}
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            {certificate ? (
              <div className="space-y-4">
                {/* Serial Number */}
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Número de Série</p>
                    <p className="font-mono text-sm break-all text-gray-900">{certificate.serialNumber}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* Issuer */}
                <div className="flex items-start gap-3">
                  <Server className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Emissor</p>
                    <p className="text-sm text-gray-900">{certificate.issuer}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* Subject */}
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Titular</p>
                    <p className="text-sm text-gray-900">{certificate.subject}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200" />

                {/* Validity Period */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Período de Validade</p>
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Início:</span>
                        <span className="font-medium text-gray-900">{formatDate(certificate.validFrom)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Vencimento:</span>
                        <span className="font-medium text-gray-900">{formatDate(certificate.validUntil)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Dias restantes:</span>
                        <span className={`font-bold ${
                          certificate.isValid ? (certificate.isNearExpiry ? 'text-yellow-600' : 'text-green-600') : 'text-red-600'
                        }`}>
                          {certificate.daysUntilExpiry} dias
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileKey className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Nenhum certificado configurado
                </p>
                <button 
                  onClick={() => handleAction('initialize')}
                  disabled={actionLoading === 'initialize'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {actionLoading === 'initialize' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  Inicializar Certificado
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions Card */}
        {certificate && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ações
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Gerencie e mantenha seu certificado digital
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Renovar Certificado */}
                <button 
                  onClick={() => handleAction('renew')}
                  disabled={!!actionLoading}
                  className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start gap-3">
                    {actionLoading === 'renew' ? (
                      <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <RefreshCw className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Renovar Certificado</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Gera um novo certificado e desativa o atual
                      </p>
                    </div>
                  </div>
                </button>

                {/* Limpar Cache */}
                <button 
                  onClick={() => handleAction('clear-cache')}
                  disabled={!!actionLoading}
                  className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start gap-3">
                    {actionLoading === 'clear-cache' ? (
                      <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <Trash2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Limpar Cache</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Força recarregamento do certificado do banco
                      </p>
                    </div>
                  </div>
                </button>

                {/* Recarregar Info */}
                <button 
                  onClick={loadCertificate}
                  disabled={loading}
                  className="border border-gray-300 rounded-lg p-4 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex items-start gap-3">
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <Download className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">Atualizar Informações</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Recarrega os dados do certificado
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
          <div className="p-6 border-b border-blue-200">
            <h2 className="text-xl font-semibold text-blue-900 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre os Certificados Auto-Gerenciados
            </h2>
          </div>
          <div className="p-6 space-y-3 text-sm text-blue-800">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p>
                <strong>Automático:</strong> Certificados são gerados e gerenciados automaticamente pelo sistema, sem necessidade de configuração manual.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p>
                <strong>Seguro:</strong> Armazenados criptografados no banco de dados com cache em memória para performance.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p>
                <strong>Compatível:</strong> PDFs assinados são reconhecidos por Adobe Reader, Foxit e outros leitores.
              </p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <p>
                <strong>Validade:</strong> Certificados têm validade de 10 anos e podem ser renovados a qualquer momento.
              </p>
            </div>
            <div className="border-t border-blue-200 pt-3">
              <p className="text-xs">
                <strong>Nota:</strong> Para uso com certificados ICP-Brasil (e-CPF/e-CNPJ), configure manualmente no arquivo .env.local.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
