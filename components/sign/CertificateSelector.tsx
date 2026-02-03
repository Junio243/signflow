'use client'

import { useState } from 'react'
import { Shield, AlertCircle, Key, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Certificate } from '@/types/certificates'

interface CertificateSelectorProps {
  certificates: Certificate[]
  selectedCertificateId: string | null
  onCertificateSelect: (certificateId: string) => void
  password: string
  onPasswordChange: (password: string) => void
  onValidate: () => Promise<void>
  validating: boolean
  validated: boolean
  disabled?: boolean
}

export function CertificateSelector({
  certificates,
  selectedCertificateId,
  onCertificateSelect,
  password,
  onPasswordChange,
  onValidate,
  validating,
  validated,
  disabled,
}: CertificateSelectorProps) {
  const [showPassword, setShowPassword] = useState(false)

  const selectedCert = certificates.find(c => c.id === selectedCertificateId)

  const getCertificateStatus = (cert: Certificate) => {
    const expiresAt = new Date(cert.expires_at)
    const now = new Date()
    const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expirado', color: 'rose' }
    } else if (daysUntilExpiry < 30) {
      return { status: 'expiring', label: 'Expirando em breve', color: 'amber' }
    }
    return { status: 'valid', label: 'Válido', color: 'emerald' }
  }

  return (
    <div className="space-y-4">
      {/* Lista de certificados */}
      <div className="space-y-3">
        {certificates.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <Shield className="mx-auto h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600 font-medium">Nenhum certificado disponível</p>
            <p className="text-xs text-slate-500 mt-1">Crie um certificado primeiro</p>
          </div>
        ) : (
          certificates.map((cert) => {
            const status = getCertificateStatus(cert)
            const isSelected = cert.id === selectedCertificateId
            const isDisabled = status.status === 'expired' || disabled

            return (
              <label
                key={cert.id}
                className={[
                  'flex items-start gap-3 rounded-xl border p-4 transition cursor-pointer',
                  isSelected ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300',
                  isDisabled ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="certificate"
                  value={cert.id}
                  checked={isSelected}
                  onChange={(e) => onCertificateSelect(e.target.value)}
                  disabled={isDisabled}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {cert.certificate_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cert.issuer}
                      </p>
                    </div>
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        `bg-${status.color}-100 text-${status.color}-700`,
                      ].join(' ')}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Expira em: {format(new Date(cert.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </label>
            )
          })
        )}
      </div>

      {/* Campo de senha */}
      {selectedCertificateId && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 mb-2 block">
              Senha do Certificado *
            </span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Digite a senha do certificado"
                disabled={disabled || validating || validated}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm pr-10 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </label>

          {!validated && password.length >= 6 && (
            <button
              type="button"
              onClick={onValidate}
              disabled={validating || disabled}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Key className="h-4 w-4" />
              {validating ? 'Validando...' : 'Validar Certificado'}
            </button>
          )}

          {validated && (
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Certificado validado com sucesso!</span>
            </div>
          )}
        </div>
      )}

      {selectedCert && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
          <AlertCircle className="inline h-4 w-4 mr-1" />
          A senha será usada para descriptografar seu certificado e assinar o documento.
        </div>
      )}
    </div>
  )
}
