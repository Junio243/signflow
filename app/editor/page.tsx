// app/editor/page.tsx
import { redirect } from 'next/navigation'

export default function EditorIndex() {
  // por ora, redireciona para uma demo; depois podemos trocar para criar um ID novo dinamicamente
  redirect('/editor/demo')
}
