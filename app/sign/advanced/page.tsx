'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, CheckCircle, AlertCircle, Loader2, FileText, Lock, QrCode, MapPin } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { DocumentUpload } from '@/components/sign/DocumentUpload';
import type { Certificate } from '@/types/certificates';

type SignaturePosition = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type QRCodeConfig = {
  enabled: boolean;
  page: number;
  x: number;
  y: number;
  size: number;
};

type PDFProtection = {
  enabled: boolean;
  password: string;
};

export default function AdvancedSignPage() {
  const router = useRouter();
  
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Certificados
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Documento
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Configurações
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>({
    page: 1,
    x: 50,
    y: 700,
    width: 200,
    height: 80,
  });
  
  const [qrCodeConfig, setQRCodeConfig] = useState<QRCodeConfig>({
    enabled: true,
    page: 1,
    x: 450,
    y: 700,
    size: 80,
  });
  
  const [pdfProtection, setPdfProtection] = useState<PDFProtection>({
    enabled: false,
    password: '',
  });
  
  // Estado da assinatura
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLogged) {
      fetchCertificates();
    }
  }, [isLogged]);

  const checkAuth = async () => {
    if (!supabase) {
      setError('Serviço indisponível');
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      router.push('/login?next=/sign/advanced');
      return;
    }

    setIsLogged(true);
    setLoading(false);
  };

  const fetchCertificates = async () => {
    if (!supabase) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const validCerts = (data || []).filter(cert => {
        const expiresAt = new Date(cert.expires_at);
        return expiresAt > new Date();
      });

      setCertificates(validCerts as Certificate[]);
    } catch (err) {
      setError('Erro ao carregar certificados: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    } finally {
      setLoadingCerts(false);
    }
  };

  const selectedCertificate = certificates.find(c => c.id === selectedCertificateId);

  const handleSign = async () => {
    if (!selectedFile || !selectedCertificateId || !certificatePassword) {
      setError('Selecione um documento, certificado e informe a senha');
      return;
    }

    if (pdfProtection.enabled && !pdfProtection.password) {
      setError('Informe a senha para proteger o PDF');
      return;
    }

    setSigning(true);
    setError(null);
    setFeedback(null);

    try {
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const response = await fetch('/api/sign/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          certificate_id: selectedCertificateId,
          certificate_password: certificatePassword,
          document_name: selectedFile.name,
          document_base64: fileBase64,
          signature_position: signaturePosition,
          qr_code_config: qrCodeConfig,
          pdf_protection: pdfProtection,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar assinatura');
      }

      setSigned(true);
      setSignedDocumentUrl(result.signed_document_url);
      setFeedback('✅ Documento assinado com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao assinar documento');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!isLogged) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-2.5">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Assinatura Avançada</h1>
            <p className="text-sm text-slate-500">Assine com certificado digital e configurações personalizadas</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </header>

      {/* Feedback */}
      {feedback && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{feedback}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Step 1: Documento */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">1. Selecione o Documento</h2>
        </div>
        <DocumentUpload
          onFileSelect={setSelectedFile}
          onFileRemove={() => setSelectedFile(null)}
          selectedFile={selectedFile}
          disabled={signing || signed}
        />
      </section>

      {/* Step 2: Certificado */}
      {selectedFile && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">2. Selecione o Certificado Digital</h2>
            </div>
            {certificates.length === 0 && !loadingCerts && (
              <Link
                href="/certificates/new"
                className="text-sm font-semibold text-purple-600 hover:text-purple-700"
              >
                + Gerar Certificado
              </Link>
            )}
          </div>

          {loadingCerts ? (
            <p className="text-sm text-slate-500">Carregando certificados...</p>
          ) : certificates.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
              <Shield className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-2">Nenhum certificado disponível</p>
              <Link
                href="/certificates/new"
                className="text-sm font-semibold text-purple-600 hover:text-purple-700"
              >
                Gerar seu primeiro certificado →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de certificados */}
              <div className="grid gap-3">
                {certificates.map((cert) => (
                  <button
                    key={cert.id}
                    onClick={() => setSelectedCertificateId(cert.id)}
                    className={`text-left p-4 rounded-xl border-2 transition ${
                      selectedCertificateId === cert.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 bg-white hover:border-purple-200'
                    }`}
                    disabled={signing || signed}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">
                            {cert.certificate_type === 'e-CPF' ? '📄' : '🏢'}
                            {' '}
                            {cert.certificate_type}
                          </span>
                          {cert.profile_type && (
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {cert.profile_type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">
                          {cert.subject_data?.fullName || cert.subject_data?.companyName || 'Certificado'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Válido até: {new Date(cert.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      {selectedCertificateId === cert.id && (
                        <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Senha do certificado */}
              {selectedCertificateId && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Senha do Certificado *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={certificatePassword}
                      onChange={(e) => setCertificatePassword(e.target.value)}
                      placeholder="Digite a senha do certificado"
                      className="w-full px-4 py-2 pr-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={signing || signed}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Preview dos dados do certificado */}
              {selectedCertificate && certificatePassword && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                  <p className="text-sm font-semibold text-purple-900 mb-2">
                    ✅ Dados que serão usados na assinatura:
                  </p>
                  <div className="text-xs text-purple-700 space-y-1">
                    {selectedCertificate.subject_data?.fullName && (
                      <p>• Nome: {selectedCertificate.subject_data.fullName}</p>
                    )}
                    {selectedCertificate.subject_data?.companyName && (
                      <p>• Empresa: {selectedCertificate.subject_data.companyName}</p>
                    )}
                    {selectedCertificate.subject_data?.cpf && (
                      <p>• CPF: {selectedCertificate.subject_data.cpf}</p>
                    )}
                    {selectedCertificate.subject_data?.cnpj && (
                      <p>• CNPJ: {selectedCertificate.subject_data.cnpj}</p>
                    )}
                    <p className="text-purple-600 mt-2">
                      ℹ️ Nenhum dado manual será solicitado. Tudo vem do certificado!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Configurações Visuais */}
      {selectedFile && selectedCertificateId && certificatePassword && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">3. Configurações Visuais</h2>
          </div>

          <div className="space-y-6">
            {/* Posição da Assinatura */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Posição da Assinatura no PDF</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Página</label>
                  <input
                    type="number"
                    min="1"
                    value={signaturePosition.page}
                    onChange={(e) => setSignaturePosition({ ...signaturePosition, page: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">X (horizontal)</label>
                  <input
                    type="number"
                    value={signaturePosition.x}
                    onChange={(e) => setSignaturePosition({ ...signaturePosition, x: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Y (vertical)</label>
                  <input
                    type="number"
                    value={signaturePosition.y}
                    onChange={(e) => setSignaturePosition({ ...signaturePosition, y: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="qrcode-enabled"
                  checked={qrCodeConfig.enabled}
                  onChange={(e) => setQRCodeConfig({ ...qrCodeConfig, enabled: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <label htmlFor="qrcode-enabled" className="text-sm font-semibold text-slate-700">
                  <QrCode className="inline h-4 w-4 mr-1" />
                  Incluir QR Code
                </label>
              </div>
              {qrCodeConfig.enabled && (
                <div className="grid grid-cols-3 gap-4 ml-6">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Página</label>
                    <input
                      type="number"
                      min="1"
                      value={qrCodeConfig.page}
                      onChange={(e) => setQRCodeConfig({ ...qrCodeConfig, page: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">X</label>
                    <input
                      type="number"
                      value={qrCodeConfig.x}
                      onChange={(e) => setQRCodeConfig({ ...qrCodeConfig, x: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Y</label>
                    <input
                      type="number"
                      value={qrCodeConfig.y}
                      onChange={(e) => setQRCodeConfig({ ...qrCodeConfig, y: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Proteção do PDF */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  id="pdf-protection"
                  checked={pdfProtection.enabled}
                  onChange={(e) => setPdfProtection({ ...pdfProtection, enabled: e.target.checked })}
                  className="rounded text-purple-600"
                />
                <label htmlFor="pdf-protection" className="text-sm font-semibold text-slate-700">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Proteger PDF com Senha
                </label>
              </div>
              {pdfProtection.enabled && (
                <div className="ml-6">
                  <label className="block text-xs text-slate-600 mb-1">Senha do PDF</label>
                  <input
                    type="password"
                    value={pdfProtection.password}
                    onChange={(e) => setPdfProtection({ ...pdfProtection, password: e.target.value })}
                    placeholder="Senha para abrir o PDF"
                    className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Botão Assinar */}
      {selectedFile && selectedCertificateId && certificatePassword && !signed && (
        <div className="flex justify-end rounded-2xl border border-purple-200 bg-purple-50 p-6">
          <button
            onClick={handleSign}
            disabled={signing}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {signing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Assinando...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Assinar com Certificado Digital
              </>
            )}
          </button>
        </div>
      )}

      {/* Sucesso */}
      {signed && signedDocumentUrl && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">Documento Assinado!</h3>
              <p className="text-sm text-emerald-700 mt-1">
                Seu documento foi assinado digitalmente com todos os dados do certificado.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href={signedDocumentUrl}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Baixar Documento Assinado
            </a>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Assinar Outro Documento
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
