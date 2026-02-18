'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
}

/** Bloco de skeleton animado */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton para card de documento no dashboard */
export function DocumentCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton para a lista do dashboard (3 cards) */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Carregando documentos…" role="status">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      {[1, 2, 3].map((i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton para página de configurações */
export function SettingsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Carregando configurações…">
      <Skeleton className="h-8 w-56" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
