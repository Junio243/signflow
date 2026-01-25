'use client'

import { useState } from 'react'
import { User, Briefcase, Building2 } from 'lucide-react'

type ProfileType = 'personal' | 'professional' | 'institutional'

interface ProfileStepProps {
  onNext: (data: { type: ProfileType; data: any }) => void
  onBack: () => void
  initialData?: { type: ProfileType; data: any }
}

export default function ProfileStep({ onNext, onBack, initialData }: ProfileStepProps) {
  const [profileType, setProfileType] = useState<ProfileType>(initialData?.type || 'personal')
  const [formData, setFormData] = useState(initialData?.data || {})

  const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]/g, '')
    if (cpf.length !== 11) return false
    // Simplified validation
    return true
  }

  const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]/g, '')
    if (cnpj.length !== 14) return false
    return true
  }

  const handleNext = () => {
    // Basic validation
    if (profileType === 'personal') {
      if (!formData.name || !formData.cpf || !formData.email) {
        alert('Preencha todos os campos obrigatórios')
        return
      }
      if (!validateCPF(formData.cpf)) {
        alert('CPF inválido')
        return
      }
    } else if (profileType === 'professional') {
      if (!formData.name || !formData.cpf || !formData.email || !formData.profession) {
        alert('Preencha todos os campos obrigatórios')
        return
      }
    } else if (profileType === 'institutional') {
      if (!formData.companyName || !formData.cnpj || !formData.representativeName || !formData.representativeCpf || !formData.email) {
        alert('Preencha todos os campos obrigatórios')
        return
      }
      if (!validateCNPJ(formData.cnpj)) {
        alert('CNPJ inválido')
        return
      }
    }

    onNext({ type: profileType, data: formData })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil de Validação</h2>
      <p className="text-gray-600 mb-6">Escolha o tipo de perfil e preencha seus dados</p>

      {/* Profile Type Selector */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => setProfileType('personal')}
          className={`py-4 px-4 rounded-lg border-2 font-medium transition-all ${
            profileType === 'personal'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <User className="mx-auto mb-2" size={24} />
          Pessoal
        </button>
        <button
          onClick={() => setProfileType('professional')}
          className={`py-4 px-4 rounded-lg border-2 font-medium transition-all ${
            profileType === 'professional'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Briefcase className="mx-auto mb-2" size={24} />
          Profissional
        </button>
        <button
          onClick={() => setProfileType('institutional')}
          className={`py-4 px-4 rounded-lg border-2 font-medium transition-all ${
            profileType === 'institutional'
              ? 'border-blue-600 bg-blue-50 text-blue-600'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Building2 className="mx-auto mb-2" size={24} />
          Institucional
        </button>
      </div>

      {/* Personal Form */}
      {profileType === 'personal' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Alexandre Junio Canuto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF *
            </label>
            <input
              type="text"
              value={formData.cpf || ''}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123.456.789-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="alexandre@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone (opcional)
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="(61) 99999-9999"
            />
          </div>
        </div>
      )}

      {/* Professional Form */}
      {profileType === 'professional' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
            <input type="text" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Dr. Alexandre Junio" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
            <input type="text" value={formData.cpf || ''} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="123.456.789-00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profissão/Cargo *</label>
            <input type="text" value={formData.profession || ''} onChange={(e) => setFormData({ ...formData, profession: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Advogado" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registro Profissional</label>
            <input type="text" value={formData.registration || ''} onChange={(e) => setFormData({ ...formData, registration: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="OAB/DF 12345" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Profissional *</label>
            <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="alexandre@escritorio.adv.br" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Comercial</label>
            <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="(61) 3333-4444" />
          </div>
        </div>
      )}

      {/* Institutional Form */}
      {profileType === 'institutional' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
            <input type="text" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="SignFlow Tecnologia Ltda" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
            <input type="text" value={formData.tradeName || ''} onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="SignFlow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
            <input type="text" value={formData.cnpj || ''} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="12.345.678/0001-90" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Representante Legal *</label>
            <input type="text" value={formData.representativeName || ''} onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Alexandre Junio Canuto" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF do Representante *</label>
            <input type="text" value={formData.representativeCpf || ''} onChange={(e) => setFormData({ ...formData, representativeCpf: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="123.456.789-00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo do Representante</label>
            <input type="text" value={formData.representativeRole || ''} onChange={(e) => setFormData({ ...formData, representativeRole: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="CEO / Diretor" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo *</label>
            <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="contato@signflow.com.br" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Comercial</label>
            <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="(61) 3333-4444" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (opcional)</label>
            <input type="text" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="SCS Quadra 1, Brasília-DF" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
          ← Voltar
        </button>
        <button onClick={handleNext} className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
          Próximo: Signatários →
        </button>
      </div>
    </div>
  )
}
