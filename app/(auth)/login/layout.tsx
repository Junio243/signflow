// Arquivo server-only (sem 'use client')
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
