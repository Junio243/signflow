'use client'

export default function Error({
  error,
  reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ padding: 16 }}>
      <h1>Ops… Algo deu errado no Dashboard.</h1>
      <p>Tente novamente. Se persistir, me diga que eu ajusto.</p>
      <button onClick={() => reset()}>Tentar de novo</button>
    </div>
  )
}
