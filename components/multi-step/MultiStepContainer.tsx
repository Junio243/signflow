'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface MultiStepContainerProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  direction?: 'forward' | 'backward'
}

export default function MultiStepContainer({
  children,
  currentStep,
  totalSteps,
  direction = 'forward'
}: MultiStepContainerProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentStep}
          initial={{ 
            x: direction === 'forward' ? 100 : -100, 
            opacity: 0 
          }}
          animate={{ 
            x: 0, 
            opacity: 1 
          }}
          exit={{ 
            x: direction === 'forward' ? -100 : 100, 
            opacity: 0 
          }}
          transition={{ 
            duration: 0.3,
            ease: 'easeInOut'
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
