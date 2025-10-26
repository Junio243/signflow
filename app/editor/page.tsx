'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  FormEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
// import Link from 'next/link' // Removido - não disponível em um único arquivo
// import { PDFDocument } from 'pdf-lib' // Removido - será carregado globalmente

// import PdfEditor from '@/components/PdfEditor' // Removido - componente mockado abaixo
// import { supabase } from '@/lib/supabaseClient' // Removido - cliente mockado abaixo

// --- Início das correções para o preview ---

// Tenta carregar PDFDocument do objeto global (assumindo que pdf-lib.min.js está carregado na página)
const PDFDocument = window.PDFLib?.PDFDocument;

// Mock do PdfEditor - substitua pelo código real de '@/components/PdfEditor'
// Este é um componente simulado para evitar o erro de compilação.
const PdfEditor = ({
  file,
  signatureUrl,
  page,
  onPageChange,
  onDocumentLoaded,
  positions,
  onPositions,
}) => {
  useEffect(() => {
    if (file) {
      // Simula o carregamento do documento
      // Tenta usar o PDFDocument real se estiver carregado
      if (PDFDocument) {
        (async () => {
          try {
            const ab = await file.arrayBuffer()
            const doc = await PDFDocument.load(ab)
            onDocumentLoaded?.({ pages: doc.getPageCount() });
          } catch (e) {
            console.error("Erro no mock do PdfEditor ao carregar PDF:", e)
            onDocumentLoaded?.({ pages: 1 }); // Fallback
          }
        })();
      } else {
         onDocumentLoaded?.({ pages: 1 }); // Fallback se pdf-lib não carregou
      }
    }
  }, [file, onDocumentLoaded]);

  return (
    <div className="flex h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-700">
        Simulação do `PdfEditor`
      </p>
      <p className="text-xs text-slate-500">
        A pré-visualização do PDF apareceria aqui.
      </p>
      {file && (
        <p className="mt-2 text-xs text-slate-500">
          Arquivo: {file.name}
        </p>
      )}
      {signatureUrl && (
        <div className='mt-2'>
           <p className="mt-1 text-xs text-slate-500">
            Assinatura carregada:
          </p>
          <img src={signatureUrl} alt="Assinatura" className="h-10 object-contain border border-slate-200 bg-white" />
        </div>
      )}
      <p className="mt-1 text-xs text-slate-500">
        Página atual: {page}
      </p>
      <div className="mt-4">
        <button
          onClick={() => onPageChange(p => Math.max(1, p - 1))}
          className="rounded-l-md border border-slate-300 bg-white px-3 py-1 text-xs"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(p => p + 1)} // A lógica de contagem de páginas lidará com o máximo
          className="rounded-r-md border-y border-r border-slate-300 bg-white px-3 py-1 text-xs"
        >
          Próxima
        </button>
      </div>
      <button
        onClick={() =>
          onPositions(
            (positions || []).concat([
              { page, nx: 0.5, ny: 0.5, scale: 1, rotation: 0 },
            ])
          )
        }
        className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
      >
        Simular clique para adicionar Posição
      </button>
    </div>
  );
};

// Mock do Supabase - substitua pelo código real de '@/lib/supabaseClient'
// Este é um cliente simulado para evitar o erro de compilação.
const supabase = {
  auth: {
    getSession: async () => {
      console.log('[Mock Supabase] getSession');
      return { data: { session: { user: { id: 'mock-user-123' } } } };
    },
  },
  from: (tableName) => {
    console.log(`[Mock Supabase] from("${tableName}")`);
    return {
      select: (query) => {
        console.log(`[Mock Supabase] select("${query}")`);
        return {
          order: () => {
            console.log('[Mock Supabase] order()');
            if (tableName === 'validation_profiles') {
              return Promise.resolve({
                data: [
                  { id: 'mock-profile-1', name: 'Perfil Mock 1 (Médico)', type: 'medico', theme: { color: '#10b981', issuer: 'Dr. Mock', reg: 'CRM 12345' } },
                  { id: 'mock-profile-2', name: 'Perfil Mock 2 (Faculdade)', type: 'faculdade', theme: { color: '#f59e0b', issuer: 'Universidade Mock', reg: 'CNPJ 123' } },
                ],
                error: null,
              });
            }
            return Promise.resolve({ data: [], error: null });
          },
        };
      },
      insert: (data) => {
        console.log('[Mock Supabase] insert()', data);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'new-mock-id-456' }, error: null }),
          }),
        };
      },
    };
  },
  storage: {
    from: (bucketName) => {
      console.log(`[Mock Supabase Storage] from("${bucketName}")`);
      return {
        upload: (path, file, options) => {
          console.log('[Mock Supabase Storage] upload()', path, file, options);
          return Promise.resolve({ error: null });
        },
        getPublicUrl: (path) => {
          console.log('[Mock Supabase Storage] getPublicUrl()', path);
          return Promise.resolve({ data: { publicUrl: 'https://placehold.co/100x50/eee/aaa?text=MockLogo' } });
        },
      };
    },
  },
};

// --- Fim das correções para o preview ---


type ProfileType = 'medico' | 'faculdade' | 'generico'
// ... existing code ...
// ... existing code ...
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="/dashboard" className="text-xs font-medium uppercase tracking-wide text-emerald-900 underline">
                Ir para o dashboard
              </a>
              <a href={result.id ? `/validate/${result.id}` : '#'} className="text-xs font-medium uppercase tracking-wide text-emerald-900 underline">
                Abrir validação pública
              </a>
            </div>
          </section>
// ... existing code ...
