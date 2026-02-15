'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import type { ECPFFormData, CertificateValidity, CertificateAlgorithm } from '@/types/certificate'
import { VALIDATION_PATTERNS, CERTIFICATE_VALIDITY_LABELS } from '@/types/certificate'

interface ECPFFormProps {
  onSubmit: (data: ECPFFormData) => void
  onBack: () => void
  initialData?: Partial<ECPFFormData>
}

export default function ECPFForm({ onSubmit, onBack, initialData }: ECPFFormProps) {
  const [formData, setFormData] = useState<Partial<ECPFFormData>>({
    fullName: initialData?.fullName || '',
    cpf: initialData?.cpf || '',
    rg: initialData?.rg || '',
    birthDate: initialData?.birthDate || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    mobile: initialData?.mobile || '',
    address: {
      cep: initialData?.address?.cep || '',
      street: initialData?.address?.street || '',
      number: initialData?.address?.number || '',
      complement: initialData?.address?.complement || '',
      neighborhood: initialData?.address?.neighborhood || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
    },
    profession: initialData?.profession || '',
    professionalRegistry: initialData?.professionalRegistry || '',
    council: initialData?.council || '',
    validity: initialData?.validity || '1year',
    algorithm: initialData?.algorithm || 'RSA-2048',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingCep, setLoadingCep] = useState(false)

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return value
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      if (numbers.length === 11) {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      } else if (numbers.length === 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      }
    }
    return value
  }

  const handleChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (field === 'address.cep') {
      formattedValue = formatCEP(value)
    } else if (field === 'phone' || field === 'mobile') {
      formattedValue = formatPhone(value)
    }

    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address!,
          [addressField]: formattedValue
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: formattedValue
      }))
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const searchCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address!,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '',
          }
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setLoadingCep(false)
    }
  }

  useEffect(() => {
    if (formData.address?.cep && formData.address.cep.replace(/\D/g, '').length === 8) {
      searchCEP(formData.address.cep)
    }
  }, [formData.address?.cep])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.fullName?.trim()) newErrors.fullName = 'Nome completo é obrigatório'
    if (!formData.cpf?.trim()) newErrors.cpf = 'CPF é obrigatório'
    else if (!VALIDATION_PATTERNS.cpf.test(formData.cpf)) newErrors.cpf = 'CPF inválido'
    
    if (!formData.birthDate) newErrors.birthDate = 'Data de nascimento é obrigatória'
    if (!formData.email?.trim()) newErrors.email = 'E-mail é obrigatório'
    else if (!VALIDATION_PATTERNS.email.test(formData.email)) newErrors.email = 'E-mail inválido'
    
    if (!formData.phone?.trim()) newErrors.phone = 'Telefone é obrigatório'
    else if (!VALIDATION_PATTERNS.phone.test(formData.phone)) newErrors.phone = 'Telefone inválido'

    // Address
    if (!formData.address?.cep?.trim()) newErrors['address.cep'] = 'CEP é obrigatório'
    else if (!VALIDATION_PATTERNS.cep.test(formData.address.cep)) newErrors['address.cep'] = 'CEP inválido'
    
    if (!formData.address?.street?.trim()) newErrors['address.street'] = 'Logradouro é obrigatório'
    if (!formData.address?.number?.trim()) newErrors['address.number'] = 'Número é obrigatório'
    if (!formData.address?.neighborhood?.trim()) newErrors['address.neighborhood'] = 'Bairro é obrigatório'
    if (!formData.address?.city?.trim()) newErrors['address.city'] = 'Cidade é obrigatória'
    if (!formData.address?.state?.trim()) newErrors['address.state'] = 'Estado é obrigatório'

    // Password
    if (!formData.password) newErrors.password = 'Senha é obrigatória'
    else if (formData.password.length < 8) newErrors.password = 'Senha deve ter no mínimo 8 caracteres'
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirme a senha'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Senhas não coincidem'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData as ECPFFormData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Dados Pessoais</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.fullName && (
              <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CPF *
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.cpf && (
              <p className="mt-1 text-xs text-red-600">{errors.cpf}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              RG
            </label>
            <input
              type="text"
              value={formData.rg}
              onChange={(e) => handleChange('rg', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data de Nascimento *
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.birthDate && (
              <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Contato</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Telefone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(00) 0000-0000"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Celular
            </label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => handleChange('mobile', e.target.value)}
              placeholder="(00) 00000-0000"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Endereço</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CEP * {loadingCep && <span className="text-xs text-slate-400">(Buscando...)</span>}
            </label>
            <input
              type="text"
              value={formData.address?.cep}
              onChange={(e) => handleChange('address.cep', e.target.value)}
              placeholder="00000-000"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['address.cep'] && (
              <p className="mt-1 text-xs text-red-600">{errors['address.cep']}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Logradouro *
            </label>
            <input
              type="text"
              value={formData.address?.street}
              onChange={(e) => handleChange('address.street', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['address.street'] && (
              <p className="mt-1 text-xs text-red-600">{errors['address.street']}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Número *
            </label>
            <input
              type="text"
              value={formData.address?.number}
              onChange={(e) => handleChange('address.number', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['address.number'] && (
              <p className="mt-1 text-xs text-red-600">{errors['address.number']}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Complemento
            </label>
            <input
              type="text"
              value={formData.address?.complement}
              onChange={(e) => handleChange('address.complement', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Bairro *
            </label>
            <input
              type="text"
              value={formData.address?.neighborhood}
              onChange={(e) => handleChange('address.neighborhood', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['address.neighborhood'] && (
              <p className="mt-1 text-xs text-red-600">{errors['address.neighborhood']}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cidade *
            </label>
            <input
              type="text"
              value={formData.address?.city}
              onChange={(e) => handleChange('address.city', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['address.city'] && (
              <p className="mt-1 text-xs text-red-600">{errors['address.city']}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Estado *
            </label>
            <select
              value={formData.address?.state}
              onChange={(e) => handleChange('address.state', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="">Selecione</option>
              <option value="AC">AC</option>
              <option value="AL">AL</option>
              <option value="AP">AP</option>
              <option value="AM">AM</option>
              <option value="BA">BA</option>
              <option value="CE">CE</option>
              <option value="DF">DF</option>
              <option value="ES">ES</option>
              <option value="GO">GO</option>
              <option value="MA">MA</option>
              <option value="MT">MT</option>
              <option value="MS">MS</option>
              <option value="MG">MG</option>
              <option value="PA">PA</option>
              <option value="PB">PB</option>
              <option value="PR">PR</option>
              <option value="PE">PE</option>
              <option value="PI">PI</option>
              <option value="RJ">RJ</option>
              <option value="RN">RN</option>
              <option value="RS">RS</option>
              <option value="RO">RO</option>
              <option value="RR">RR</option>
              <option value="SC">SC</option>
              <option value="SP">SP</option>
              <option value="SE">SE</option>
              <option value="TO">TO</option>
            </select>
            {errors['address.state'] && (
              <p className="mt-1 text-xs text-red-600">{errors['address.state']}</p>
            )}
          </div>
        </div>
      </section>

      {/* Professional Data (Optional) */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-slate-900">Dados Profissionais (Opcional)</h3>
        <p className="mb-4 text-sm text-slate-600">Para médicos, advogados, contadores e outros profissionais liberais</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Profissão
            </label>
            <input
              type="text"
              value={formData.profession}
              onChange={(e) => handleChange('profession', e.target.value)}
              placeholder="Ex: Médico, Advogado"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Registro Profissional
            </label>
            <input
              type="text"
              value={formData.professionalRegistry}
              onChange={(e) => handleChange('professionalRegistry', e.target.value)}
              placeholder="Ex: 123456"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Conselho Regional
            </label>
            <input
              type="text"
              value={formData.council}
              onChange={(e) => handleChange('council', e.target.value)}
              placeholder="Ex: OAB-SP, CREMESP"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
      </section>

      {/* Certificate Settings */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Configurações do Certificado</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Validade
            </label>
            <select
              value={formData.validity}
              onChange={(e) => handleChange('validity', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="1year">{CERTIFICATE_VALIDITY_LABELS['1year']}</option>
              <option value="3years">{CERTIFICATE_VALIDITY_LABELS['3years']}</option>
              <option value="5years">{CERTIFICATE_VALIDITY_LABELS['5years']}</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Algoritmo
            </label>
            <select
              value={formData.algorithm}
              onChange={(e) => handleChange('algorithm', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <option value="RSA-2048">RSA-2048 (Padrão)</option>
              <option value="RSA-4096">RSA-4096 (Mais Seguro)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Senha do Certificado *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Confirmar Senha *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Digite novamente"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-700">
              <p className="font-semibold">Importante</p>
              <p className="mt-1">Guarde sua senha em local seguro. Ela será necessária para usar o certificado e não poderá ser recuperada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          Voltar
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-700"
        >
          Continuar
        </button>
      </div>
    </form>
  )
}
