'use client'

import { useState } from 'react'
import { UserPlus, X, CheckCircle } from 'lucide-react'

interface Signatory {
  id: string
  name: string
  email: string
  cpf: string
  status: 'pending' | 'signed'
}

interface SignatoriesStepProps {
  onNext: (data: { list: Signatory[]; order: 'sequential' | 'parallel' }) => void
  onBack: () => void
  initialData?: { list: Signatory[]; order: 'sequential' | 'parallel' }
  currentUserEmail: string
}

export default function SignatoriesStep({ onNext, onBack, initialData, currentUserEmail }: SignatoriesStepProps) {
  const [signatories, setSignatories] = useState<Signatory[]>(initialData?.list || [])
  const [order, setOrder] = useState<'sequential' | 'parallel'>(initialData?.order || 'parallel')
  const [newSignatory, setNewSignatory] = useState({ name: '', email: '', cpf: '' })

  const addSignatory = () => {
    if (!newSignatory.name || !newSignatory.email || !newSignatory.cpf) {
      alert('Preencha todos os campos')
      return
    }

    const signatory: Signatory = {
      id: crypto.randomUUID(),
      ...newSignatory,
      status: 'pending'
    }

    setSignatories([...signatories, signatory])
    setNewSignatory({ name: '', email: '', cpf: '' })
  }

  const removeSignatory = (id: string) => {
    setSignatories(signatories.filter(s => s.id !== id))
  }

  const handleNext = () => {
    onNext({ list: signatories, order })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Signatários</h2>
      <p className="text-gray-600 mb-6">Adicione outras pessoas que precisam assinar (opcional)</p>

      {/* Current User */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-blue-600" size={24} />
            <div>
              <p className="font-semibold text-gray-900">Você</p>
              <p className="text-sm text-gray-600">{currentUserEmail}</p>
              <p className="text-xs text-blue-600 mt-1">Status: Vai assinar agora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Signatory Form */}
      <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <UserPlus size={20} />
          Adicionar Signatário
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <input
            type="text"
            value={newSignatory.name}
            onChange={(e) => setNewSignatory({ ...newSignatory, name: e.target.value })}
            placeholder="Nome completo"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="email"
            value={newSignatory.email}
            onChange={(e) => setNewSignatory({ ...newSignatory, email: e.target.value })}
            placeholder="Email"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            value={newSignatory.cpf}
            onChange={(e) => setNewSignatory({ ...newSignatory, cpf: e.target.value })}
            placeholder="CPF"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={addSignatory}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          ➕ Adicionar
        </button>
      </div>

      {/* Signatories List */}
      {signatories.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-gray-900">Signatários Adicionados ({signatories.length})</h3>
          {signatories.map((signatory) => (
            <div key={signatory.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{signatory.name}</p>
                  <p className="text-sm text-gray-600">{signatory.email}</p>
                  <p className="text-xs text-orange-600 mt-1">Status: Aguardando assinatura</p>
                </div>
                <button
                  onClick={() => removeSignatory(signatory.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature Order */}
      {signatories.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Ordem de Assinatura</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors">
              <input
                type="radio"
                name="order"
                checked={order === 'parallel'}
                onChange={() => setOrder('parallel')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">Paralela (Recomendado)</p>
                <p className="text-sm text-gray-600">Todos podem assinar ao mesmo tempo</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors">
              <input
                type="radio"
                name="order"
                checked={order === 'sequential'}
                onChange={() => setOrder('sequential')}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">Sequencial</p>
                <p className="text-sm text-gray-600">Um por vez, na ordem adicionada</p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Voltar
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Próximo: Config. QR Code →
        </button>
      </div>
    </div>
  )
}
