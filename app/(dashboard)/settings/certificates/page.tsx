'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
import { toast } from 'sonner';

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

  useEffect(() => {
    loadCertificate();
  }, []);

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
      toast.error('Erro ao carregar certificado');
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
        toast.success(data.message);
        await loadCertificate();
      } else {
        toast.error(data.error || 'Erro ao executar ação');
      }
    } catch (error) {
      console.error('Erro na ação:', error);
      toast.error('Erro ao executar ação');
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
        variant: 'destructive' as const,
        color: 'text-red-600'
      };
    }

    if (certificate.isNearExpiry) {
      return {
        icon: <Clock className="h-5 w-5" />,
        text: 'Próximo do Vencimento',
        variant: 'warning' as const,
        color: 'text-yellow-600'
      };
    }

    return {
      icon: <CheckCircle2 className="h-5 w-5" />,
      text: 'Válido',
      variant: 'default' as const,
      color: 'text-green-600'
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando certificado...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Certificados Digitais</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie os certificados auto-gerenciados do SignFlow para assinatura digital de PDFs
        </p>
      </div>

      {/* Status Alert */}
      {!certificate ? (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Nenhum certificado encontrado. Clique em "Inicializar Certificado" para gerar um novo automaticamente.
          </AlertDescription>
        </Alert>
      ) : certificate.isNearExpiry ? (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atenção:</strong> Seu certificado vencerá em {certificate.daysUntilExpiry} dias. Considere renová-lo em breve.
          </AlertDescription>
        </Alert>
      ) : !certificate.isValid ? (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Certificado Expirado!</strong> Renove imediatamente para continuar assinando documentos.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6">
        {/* Certificate Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileKey className="h-5 w-5" />
                  Certificado Atual
                </CardTitle>
                <CardDescription>
                  Certificado auto-gerenciado ativo no sistema
                </CardDescription>
              </div>
              {statusInfo && (
                <Badge variant={statusInfo.variant} className="flex items-center gap-2">
                  {statusInfo.icon}
                  {statusInfo.text}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {certificate ? (
              <div className="space-y-4">
                {/* Serial Number */}
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Número de Série</p>
                    <p className="font-mono text-sm break-all">{certificate.serialNumber}</p>
                  </div>
                </div>

                <Separator />

                {/* Issuer */}
                <div className="flex items-start gap-3">
                  <Server className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Emissor</p>
                    <p className="text-sm">{certificate.issuer}</p>
                  </div>
                </div>

                <Separator />

                {/* Subject */}
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Titular</p>
                    <p className="text-sm">{certificate.subject}</p>
                  </div>
                </div>

                <Separator />

                {/* Validity Period */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Período de Validade</p>
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Início:</span>
                        <span className="font-medium">{formatDate(certificate.validFrom)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vencimento:</span>
                        <span className="font-medium">{formatDate(certificate.validUntil)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Dias restantes:</span>
                        <span className={`font-bold ${statusInfo?.color}`}>
                          {certificate.daysUntilExpiry} dias
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileKey className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Nenhum certificado configurado
                </p>
                <Button 
                  onClick={() => handleAction('initialize')}
                  disabled={actionLoading === 'initialize'}
                >
                  {actionLoading === 'initialize' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Inicializar Certificado
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        {certificate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ações
              </CardTitle>
              <CardDescription>
                Gerencie e mantenha seu certificado digital
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Renovar Certificado */}
                <Button 
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleAction('renew')}
                  disabled={!!actionLoading}
                >
                  <div className="flex items-start gap-3 text-left w-full">
                    {actionLoading === 'renew' ? (
                      <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <RefreshCw className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">Renovar Certificado</p>
                      <p className="text-xs text-muted-foreground">
                        Gera um novo certificado e desativa o atual
                      </p>
                    </div>
                  </div>
                </Button>

                {/* Limpar Cache */}
                <Button 
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => handleAction('clear-cache')}
                  disabled={!!actionLoading}
                >
                  <div className="flex items-start gap-3 text-left w-full">
                    {actionLoading === 'clear-cache' ? (
                      <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <Trash2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">Limpar Cache</p>
                      <p className="text-xs text-muted-foreground">
                        Força recarregamento do certificado do banco
                      </p>
                    </div>
                  </div>
                </Button>

                {/* Recarregar Info */}
                <Button 
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={loadCertificate}
                  disabled={loading}
                >
                  <div className="flex items-start gap-3 text-left w-full">
                    {loading ? (
                      <RefreshCw className="h-5 w-5 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <Download className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">Atualizar Informações</p>
                      <p className="text-xs text-muted-foreground">
                        Recarrega os dados do certificado
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5" />
              Sobre os Certificados Auto-Gerenciados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-800">
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
            <Separator className="bg-blue-200" />
            <div className="pt-2">
              <p className="text-xs">
                <strong>Nota:</strong> Para uso com certificados ICP-Brasil (e-CPF/e-CNPJ), configure manualmente no arquivo .env.local.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
