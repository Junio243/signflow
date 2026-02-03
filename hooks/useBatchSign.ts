'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface BatchSignOptions {
  documentIds: string[];
  signatureImage?: string;
  signerName?: string;
  signerInfo?: string;
}

interface BatchSignResult {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: {
    successful: Array<{
      documentId: string;
      signedPdfUrl: string;
      validateUrl: string;
    }>;
    failed: Array<{
      documentId: string;
      error: string;
    }>;
  };
}

export function useBatchSign() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const batchSign = async (options: BatchSignOptions): Promise<BatchSignResult | null> => {
    if (!supabase) {
      setError('Cliente Supabase não disponível');
      return null;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const response = await fetch('/api/batch-sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(options)
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao assinar documentos');
      }

      const result: BatchSignResult = await response.json();
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    batchSign,
    loading,
    progress,
    error
  };
}