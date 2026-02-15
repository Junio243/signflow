'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import type { ECNPJFormData, CertificateValidity, CertificateAlgorithm } from '@/types/certificate'
import { VALIDATION_PATTERNS, CERTIFICATE_VALIDITY_LABELS } from '@/types/certificate'

interface ECNPJFormProps {
  onSubmit: (data: ECNPJFormData) => void
  onBack: () => void
  initialData?: Partial<ECNPJFormData>
}

export default function ECNPJForm({ onSubmit, onBack, initialData }: ECNPJFormProps) {
  const [formData, setFormData] = useState<Partial<ECNPJFormData>>({
    companyName: initialData?.companyName || '',
    tradeName: initialData?.tradeName || '',
    cnpj: initialData?.cnpj || '',
    stateRegistration: initialData?.stateRegistration || '',
    municipalRegistration: initialData?.municipalRegistration || '',
    legalRepresentative: {
      fullName: initialData?.legalRepresentative?.fullName || '',
      cpf: initialData?.legalRepresentative?.cpf || '',
      role: initialData?.legalRepresentative?.role || '',
      email: initialData?.legalRepresentative?.email || '',
    },
    address: {
      cep: initialData?.address?.cep || '',
      street: initialData?.address?.street || '',
      number: initialData?.address?.number || '',
      complement: initialData?.address?.complement || '',
      neighborhood: initialData?.address?.neighborhood || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
    },
    businessPhone: initialData?.businessPhone || '',
    businessEmail: initialData?.businessEmail || '',
    validity: initialData?.validity || '1year',
    algorithm: initialData?.algorithm || 'RSA-2048',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingCep, setLoadingCep] = useState(false)

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
    return value
  }

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

    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value)
    } else if (field === 'legalRepresentative.cpf') {
      formattedValue = formatCPF(value)
    } else if (field === 'address.cep') {
      formattedValue = formatCEP(value)
    } else if (field === 'businessPhone') {
      formattedValue = formatPhone(value)
    }

    if (field.startsWith('legalRepresentative.')) {
      const repField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        legalRepresentative: {
          ...prev.legalRepresentative!,
          [repField]: formattedValue
        }
      }))
    } else if (field.startsWith('address.')) {
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

    // Company data
    if (!formData.companyName?.trim()) newErrors.companyName = 'Razão social é obrigatória'
    if (!formData.cnpj?.trim()) newErrors.cnpj = 'CNPJ é obrigatório'
    else if (!VALIDATION_PATTERNS.cnpj.test(formData.cnpj)) newErrors.cnpj = 'CNPJ inválido'
    
    if (!formData.businessPhone?.trim()) newErrors.businessPhone = 'Telefone comercial é obrigatório'
    else if (!VALIDATION_PATTERNS.phone.test(formData.businessPhone)) newErrors.businessPhone = 'Telefone inválido'
    
    if (!formData.businessEmail?.trim()) newErrors.businessEmail = 'E-mail comercial é obrigatório'
    else if (!VALIDATION_PATTERNS.email.test(formData.businessEmail)) newErrors.businessEmail = 'E-mail inválido'

    // Legal representative
    if (!formData.legalRepresentative?.fullName?.trim()) {
      newErrors['legalRepresentative.fullName'] = 'Nome do representante é obrigatório'
    }
    if (!formData.legalRepresentative?.cpf?.trim()) {
      newErrors['legalRepresentative.cpf'] = 'CPF do representante é obrigatório'
    } else if (!VALIDATION_PATTERNS.cpf.test(formData.legalRepresentative.cpf)) {
      newErrors['legalRepresentative.cpf'] = 'CPF inválido'
    }
    if (!formData.legalRepresentative?.role?.trim()) {
      newErrors['legalRepresentative.role'] = 'Cargo é obrigatório'
    }
    if (!formData.legalRepresentative?.email?.trim()) {
      newErrors['legalRepresentative.email'] = 'E-mail do representante é obrigatório'
    } else if (!VALIDATION_PATTERNS.email.test(formData.legalRepresentative.email)) {
      newErrors['legalRepresentative.email'] = 'E-mail inválido'
    }

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
      onSubmit(formData as ECNPJFormData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Dados da Empresa</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Razão Social *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome Fantasia
            </label>
            <input
              type="text"
              value={formData.tradeName}
              onChange={(e) => handleChange('tradeName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CNPJ *
            </label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.cnpj && (
              <p className="mt-1 text-xs text-red-600">{errors.cnpj}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Inscrição Estadual
            </label>
            <input
              type="text"
              value={formData.stateRegistration}
              onChange={(e) => handleChange('stateRegistration', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Inscrição Municipal
            </label>
            <input
              type="text"
              value={formData.municipalRegistration}
              onChange={(e) => handleChange('municipalRegistration', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
          </div>
        </div>
      </section>

      {/* Legal Representative */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Representante Legal</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.legalRepresentative?.fullName}
              onChange={(e) => handleChange('legalRepresentative.fullName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['legalRepresentative.fullName'] && (
              <p className="mt-1 text-xs text-red-600">{errors['legalRepresentative.fullName']}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              CPF *
            </label>
            <input
              type="text"
              value={formData.legalRepresentative?.cpf}
              onChange={(e) => handleChange('legalRepresentative.cpf', e.target.value)}
              placeholder="000.000.000-00"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['legalRepresentative.cpf'] && (
              <p className="mt-1 text-xs text-red-600">{errors['legalRepresentative.cpf']}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cargo *
            </label>
            <input
              type="text"
              value={formData.legalRepresentative?.role}
              onChange={(e) => handleChange('legalRepresentative.role', e.target.value)}
              placeholder="Ex: Diretor, Sócio, Gerente"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['legalRepresentative.role'] && (
              <p className="mt-1 text-xs text-red-600">{errors['legalRepresentative.role']}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-mail *
            </label>
            <input
              type="email"
              value={formData.legalRepresentative?.email}
              onChange={(e) => handleChange('legalRepresentative.email', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors['legalRepresentative.email'] && (
              <p className="mt-1 text-xs text-red-600">{errors['legalRepresentative.email']}</p>
            )}
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Endereço da Empresa</h3>
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

      {/* Contact */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Contato Comercial</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Telefone Comercial *
            </label>
            <input
              type="tel"
              value={formData.businessPhone}
              onChange={(e) => handleChange('businessPhone', e.target.value)}
              placeholder="(00) 0000-0000"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.businessPhone && (
              <p className="mt-1 text-xs text-red-600">{errors.businessPhone}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              E-mail Comercial *
            </label>
            <input
              type="email"
              value={formData.businessEmail}
              onChange={(e) => handleChange('businessEmail', e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600"
            />
            {errors.businessEmail && (
              <p className="mt-1 text-xs text-red-600">{errors.businessEmail}</p>
            )}
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
