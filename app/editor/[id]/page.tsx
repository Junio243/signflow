// app/editor/[id]/page.tsx
export const runtime = 'nodejs';

export default function EditorStub({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-3">
      <h1 className="text-xl font-semibold">Editor em construção</h1>
      <p className="text-slate-700">
        Página do editor para o documento <strong>{params.id}</strong> ainda não está ativa no MVP.
      </p>
      <p className="text-slate-700">
        Use a página inicial para fazer upload e a página de <code>/validate/{'{id}'}</code> para validar.
      </p>
    </main>
  );
}
