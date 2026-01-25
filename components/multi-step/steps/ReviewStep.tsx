'use client'

import { CheckCircle, FileText, User, Users, QrCode, Award } from 'lucide-react'

interface ReviewStepProps {
  data: {
    document: { file: File; url: string }
    signature: { data: string; type: string }
    profile: { type: string; data: any }
    signatories: { list: any[]; order: string }
    qrConfig: {
      certificate: {
        issuer: string
        validFrom: Date
        validUntil: Date | null
        logoUrl?: string
      }
      qrCode: { position: string; size: string }
    }
  }
  onBack: () => void
  onSubmit: () => void
}

export default function ReviewStep({ data, onBack, onSubmit }: ReviewStepProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisão</h2>
      <p className="text-gray-600 mb-6">Revise todas as informações antes de assinar</p>

      <div className="space-y-6">
        {/* Document */}
        <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Documento
          </h3>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="font-medium">{data.document.file.name}</span>
            </p>
            <p className="text-gray-600 ml-6">
              Tamanho: {formatFileSize(data.document.file.size)}
            </p>
          </div>
        </div>

        {/* Signature */}
        <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            ✍️ Assinatura
          </h3>
          <div className="bg-white border border-gray-300 rounded p-3">
            <img src={data.signature.data} alt="Assinatura" className="max-w-xs h-auto" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Tipo: {data.signature.type === 'draw' ? 'Desenhada' : data.signature.type === 'text' ? 'Texto' : 'Upload'}</p>
        </div>

        {/* Profile */}
        <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Perfil: {data.profile.type === 'personal' ? 'Pessoal' : data.profile.type === 'professional' ? 'Profissional' : 'Institucional'}
          </h3>
          <div className="space-y-1 text-sm">
            {data.profile.type === 'personal' && (
              <>
                <p><span className="font-medium">Nome:</span> {data.profile.data.name}</p>
                <p><span className="font-medium">CPF:</span> {data.profile.data.cpf}</p>
                <p><span className="font-medium">Email:</span> {data.profile.data.email}</p>
                {data.profile.data.phone && <p><span className="font-medium">Telefone:</span> {data.profile.data.phone}</p>}
              </>
            )}
            {data.profile.type === 'professional' && (
              <>
                <p><span className="font-medium">Nome:</span> {data.profile.data.name}</p>
                <p><span className="font-medium">CPF:</span> {data.profile.data.cpf}</p>
                <p><span className="font-medium">Profissão:</span> {data.profile.data.profession}</p>
                {data.profile.data.registration && <p><span className="font-medium">Registro:</span> {data.profile.data.registration}</p>}
                <p><span className="font-medium">Email:</span> {data.profile.data.email}</p>
              </>
            )}
            {data.profile.type === 'institutional' && (
              <>
                <p><span className="font-medium">Empresa:</span> {data.profile.data.companyName}</p>
                <p><span className="font-medium">CNPJ:</span> {data.profile.data.cnpj}</p>
                <p><span className="font-medium">Representante:</span> {data.profile.data.representativeName}</p>
                <p><span className="font-medium">CPF Rep.:</span> {data.profile.data.representativeCpf}</p>
                <p><span className="font-medium">Email:</span> {data.profile.data.email}</p>
              </>
            )}
          </div>
        </div>

        {/* Signatories */}
        {data.signatories.list.length > 0 && (
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Signatários ({data.signatories.list.length + 1})
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span>1. Você</span>
                <span className="text-blue-600 text-xs">Agora</span>
              </div>
              {data.signatories.list.map((sig, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded">
                  <span>{idx + 2}. {sig.name}</span>
                  <span className="text-orange-600 text-xs">Aguardando</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Ordem: {data.signatories.order === 'parallel' ? 'Paralela (todos ao mesmo tempo)' : 'Sequencial (um por vez)'}
            </p>
          </div>
        )}

        {/* Certificate & QR */}
        <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award size={20} className="text-blue-600" />
            Certificado
          </h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Emissor:</span> {data.qrConfig.certificate.issuer}</p>
            <p>
              <span className="font-medium">Validade:</span>{' '}
              {data.qrConfig.certificate.validUntil
                ? `${formatDate(data.qrConfig.certificate.validFrom)} a ${formatDate(data.qrConfig.certificate.validUntil)}`
                : 'Sem validade (permanente)'}
            </p>
            {data.qrConfig.certificate.logoUrl && (
              <p className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Logo personalizada
              </p>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <QrCode size={18} />
              QR Code
            </h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Posição:</span> {data.qrConfig.qrCode.position.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p><span className="font-medium">Tamanho:</span> {data.qrConfig.qrCode.size.charAt(0).toUpperCase() + data.qrConfig.qrCode.size.slice(1)}</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-900 flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>
              Ao clicar em &quot;Assinar Documento&quot;, o documento será criptografado, assinado digitalmente e registrado de forma permanente e imutável.
            </span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Voltar
        </button>
        <button
          onClick={onSubmit}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
        >
          🎉 ASSINAR DOCUMENTO!
        </button>
      </div>
    </div>
  )
}
