'use client'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export default function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-8">
      {/* Indicador numérico */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          Etapa {currentStep} de {totalSteps}
        </span>
        <span className="text-sm font-medium text-blue-600">
          {Math.round(progress)}% completo
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Bolinhas com labels */}
      <div className="flex justify-between items-start">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          
          return (
            <div key={stepNumber} className="flex flex-col items-center" style={{ width: `${100 / totalSteps}%` }}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span className={`text-xs mt-2 text-center ${
                isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'
              }`}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
