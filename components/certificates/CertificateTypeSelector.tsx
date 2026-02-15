'use client'

import { User, Building2 } from 'lucide-react'
import type { CertificateType } from '@/types/certificate'

interface CertificateTypeSelectorProps {
  selectedType: CertificateType | null
  onSelect: (type: CertificateType) => void
}

export default function CertificateTypeSelector({ selectedType, onSelect }: CertificateTypeSelectorProps) {
  const types = [
    {
      value: 'e-CPF' as CertificateType,
      icon: User,
      title: 'e-CPF',
      subtitle: 'Pessoa Física',
      description: 'Para cidadãos, médicos, advogados, contadores e profissionais liberais',
      color: 'blue'
    },
    {
      value: 'e-CNPJ' as CertificateType,
      icon: Building2,
      title: 'e-CNPJ',
      subtitle: 'Pessoa Jurídica',
      description: 'Para empresas, corporações, condomínios e associações',
      color: 'purple'
    }
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {types.map((type) => {
        const Icon = type.icon
        const isSelected = selectedType === type.value
        const colorClasses = {
          blue: {
            border: 'border-blue-500',
            bg: 'bg-blue-50',
            icon: 'bg-blue-100 text-blue-600',
            hoverBorder: 'hover:border-blue-300'
          },
          purple: {
            border: 'border-purple-500',
            bg: 'bg-purple-50',
            icon: 'bg-purple-100 text-purple-600',
            hoverBorder: 'hover:border-purple-300'
          }
        }[type.color]

        return (
          <button
            key={type.value}
            onClick={() => onSelect(type.value)}
            className={[
              'flex flex-col items-start gap-4 rounded-2xl border-2 p-6 text-left transition-all',
              isSelected
                ? `${colorClasses.border} ${colorClasses.bg}`
                : `border-slate-200 bg-white ${colorClasses.hoverBorder} hover:bg-slate-50`,
            ].join(' ')}
          >
            <div className="flex w-full items-start justify-between">
              <div className={[
                'flex h-14 w-14 items-center justify-center rounded-xl',
                isSelected ? colorClasses.icon : 'bg-slate-100 text-slate-400'
              ].join(' ')}>
                <Icon className="h-7 w-7" />
              </div>
              {isSelected && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {type.title}
              </h3>
              <p className="text-sm font-medium text-slate-600">
                {type.subtitle}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {type.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
