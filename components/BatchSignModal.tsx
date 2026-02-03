'use client';

import { useState, useRef } from 'react';
import { X, FileSignature, Upload, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useBatchSign } from '@/hooks/useBatchSign';

interface Document {
  id: string;
  original_pdf_name?: string | null;
  status: string | null;
}

interface BatchSignModalProps {
  selectedDocuments: Document[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchSignModal({
  selectedDocuments,
  onClose,
  onSuccess
}: BatchSignModalProps) {
  const { batchSign, loading, progress, error } = useBatchSign();
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerInfo, setSignerInfo] = useState('');
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida (PNG, JPG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo: 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSignatureImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signatureImage) {
      alert('Por favor, envie uma imagem de assinatura');
      return;
    }

    const batchResult = await batchSign({
      documentIds: selectedDocuments.map(doc => doc.id),
      signatureImage,
      signerName: signerName.trim() || 'Usuário',
      signerInfo: signerInfo.trim() || undefined
    });

    if (batchResult) {
      setResult(batchResult);
      if (batchResult.failed === 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Resultado da Assinatura
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {result.total}
                </div>
                <div className="text-sm text-slate-600">Total</div>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {result.successful}
                </div>
                <div className="text-sm text-slate-600">Sucesso</div>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <div className="text-3xl font-bold text-red-600">
                  {result.failed}
                </div>
                <div className="text-sm text-slate-600">Falhas</div>
              </div>
            </div>

            {result.results.successful.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-green-700 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Assinados com Sucesso
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.results.successful.map((item: any) => {
                    const doc = selectedDocuments.find(d => d.id === item.documentId);
                    return (
                      <div
                        key={item.documentId}
                        className="rounded-lg bg-green-50 p-3 text-sm"
                      >
                        <div className="font-medium text-slate-900">
                          {doc?.original_pdf_name || 'Documento'}
                        </div>
                        <a
                          href={item.signedPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Baixar PDF
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.results.failed.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-red-700 mb-2">
                  <XCircle className="h-5 w-5" />
                  Falhas
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.results.failed.map((item: any) => {
                    const doc = selectedDocuments.find(d => d.id === item.documentId);
                    return (
                      <div
                        key={item.documentId}
                        className="rounded-lg bg-red-50 p-3 text-sm"
                      >
                        <div className="font-medium text-slate-900">
                          {doc?.original_pdf_name || 'Documento'}
                        </div>
                        <div className="text-red-600">{item.error}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Assinatura em Lote
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Erro</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-4 rounded-lg bg-blue-50 p-4">
          <p className="font-semibold text-slate-900">
            {selectedDocuments.length} documento(s) selecionado(s)
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {selectedDocuments.slice(0, 5).map(doc => (
              <li key={doc.id}>• {doc.original_pdf_name || 'Sem nome'}</li>
            ))}
            {selectedDocuments.length > 5 && (
              <li className="font-medium">
                ... e mais {selectedDocuments.length - 5}
              </li>
            )}
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Imagem da Assinatura *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-brand-500 hover:bg-slate-50 disabled:opacity-50"
            >
              {signatureImage ? (
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={signatureImage}
                    alt="Assinatura"
                    className="h-20 object-contain"
                  />
                  <p className="text-sm text-slate-600">Clique para alterar</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <p className="font-medium text-slate-700">
                    Enviar Imagem da Assinatura
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG ou JPG (máx 2MB)
                  </p>
                </div>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nome do Signatário
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Seu nome completo"
              className="input w-full"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              CPF/CNPJ ou Registro (opcional)
            </label>
            <input
              type="text"
              value={signerInfo}
              onChange={(e) => setSignerInfo(e.target.value)}
              placeholder="000.000.000-00"
              className="input w-full"
              disabled={loading}
            />
          </div>

          {loading && (
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-600">Processando...</span>
                <span className="font-medium text-brand-600">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !signatureImage}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <FileSignature className="h-5 w-5" />
              {loading ? 'Assinando...' : 'Assinar Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}