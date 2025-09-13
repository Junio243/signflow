# SignFlow (MVP) — Next.js + Supabase + Vercel

## 1) Pré‑requisitos
- Conta **Supabase** (Free). Crie projeto; ative **Auth (Email magic link)** e **Storage**.
- Configure **SMTP** em Auth (ex.: Resend Free) e remetente.
- Crie bucket público **`signflow`** no Storage.
- Preencha `.env` conforme `.env.example`.

## 2) Rodar local
```bash
npm i
npm run dev
# abra http://localhost:3000
```

## 3) Deploy grátis (Vercel)
- Importe o repositório na Vercel e adicione as variáveis de ambiente (`NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE`, `RESEND_API_KEY`).
- Incluído **vercel.json** com cron diário de limpeza (`/api/cleanup`).

## 4) Fluxo
1. Login via **link mágico** (sem senha).
2. Upload do PDF + assinatura (PNG/JPG).
3. Posicionar visualmente a assinatura nas páginas (arrastar + tamanho/rotação).
4. Gerar QR dinâmico apontando para `/validate/{id}` e inserir no rodapé da última página.
5. Baixar PDF assinado, histórico no Dashboard e validação pública.
6. Expiração automática em 7 dias.

## 5) Observação legal (Brasil/DF)
Assinatura gerada é **eletrônica simples**. Para atos com **GDF/SEI‑DF**, geralmente exigem **ICP‑Brasil (qualificada)**.
