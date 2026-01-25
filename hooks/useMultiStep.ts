import { useState, useCallback, useEffect } from 'react'

export function useMultiStep<T extends Record<string, any>>(totalSteps: number, storageKey: string = 'multiStepData') {
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')
  const [formData, setFormData] = useState<Partial<T>>({})

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFormData(parsed.data || {})
        setCurrentStep(parsed.step || 1)
      } catch (e) {
        console.error('Failed to parse saved data:', e)
      }
    }
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        step: currentStep,
        data: formData,
        timestamp: Date.now()
      }))
    }
  }, [formData, currentStep, storageKey])

  const goToNextStep = useCallback((stepData: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
    setDirection('forward')
    setCurrentStep(prev => Math.min(prev + 1, totalSteps))
  }, [totalSteps])

  const goToPreviousStep = useCallback(() => {
    setDirection('backward')
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  const goToStep = useCallback((step: number) => {
    setDirection(step > currentStep ? 'forward' : 'backward')
    setCurrentStep(Math.max(1, Math.min(step, totalSteps)))
  }, [currentStep, totalSteps])

  const reset = useCallback(() => {
    setCurrentStep(1)
    setFormData({})
    localStorage.removeItem(storageKey)
  }, [storageKey])

  const hasSavedData = useCallback(() => {
    const saved = localStorage.getItem(storageKey)
    return !!saved
  }, [storageKey])

  return {
    currentStep,
    direction,
    formData,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    reset,
    hasSavedData,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === totalSteps
  }
}
