/* Página inicial PRO (sem libs externas)
   - Navbar fixa com CTA
   - Hero com gradiente e badges de confiança
   - Logos/selos fictícios (placeholders) para prova social
   - Como funciona (3 passos)
   - Segurança & LGPD (chips e blocos)
   - Diferenciais (cards)
   - Depoimentos
   - Pricing (cartões simples)
   - CTA final
   - Rodapé institucional

   Observação:
   - Ícones SVG inline (sem libs)
   - CSS com variáveis e breakpoints
*/

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="sf-root">
      {/* Navbar */}
      <header className="sf-nav">
        <div className="sf-container sf-nav__inner">
          <Link href="/" className="sf-brand">
            <span className="sf-logo">◆</span> <strong>SignFlow</strong>
          </Link>

          <nav className="sf-nav__links">
            <Link href="/editor">Assinar</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/validate/demo">Demo</Link>
            <Link href="/login">Entrar</Link>
          </nav>

          <div className="sf-nav__cta">
            <Link href="/editor" className="sf-btn sf-btn--primary">Começar agora</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="sf-hero">
        <div className="sf-container sf-hero__grid">
          <div className="sf-hero__copy">
            <div className="sf-badge">
              <ShieldIcon /> Segurança por design • LGPD-friendly
            </div>

            <h1>
              Assine PDFs com confiança.<br />
              Valide por QR, com trilha de auditoria.
            </h1>

            <p className="sf-hero__subtitle">
              Fluxo completo para assinatura eletrônica com QR Code em todas as páginas,
              armazenamento no Supabase, políticas de acesso e validação pública.
            </p>

            <div className="sf-hero__ctas">
              <Link href="/editor" className="sf-btn sf-btn--primary"><BoltIcon /> Assinar um documento</Link>
              <Link href="/validate/demo" className="sf-btn sf-btn--ghost"><QrIcon /> Ver demo de validação</Link>
            </div>

            <ul className="sf-hero__bullets">
              <li><CheckIcon /> Perfis de validação (Médico, Faculdade, Genérico)</li>
              <li><CheckIcon /> Assinatura desenhada ou importada (PNG/JPG)</li>
              <li><CheckIcon /> QR Code ajustável e validação pública</li>
            </ul>
          </div>

          <div className="sf-hero__mock">
            <div className="sf-mock">
              <div className="sf-mock__bar">
                <div className="dot" /><div className="dot" /><div className="dot" />
                <span className="sf-mock__title">PDF • Assinatura + QR</span>
              </div>
              <div className="sf-mock__page">
                <div className="sf-mock__qr" />
                <div className="sf-mock__sign">Assinatura</div>
              </div>
              <div className="sf-mock__page sf-mock__page--fade" />
            </div>
          </div>
        </div>
      </section>

      {/* Logos / Prova social (placeholders) */}
      <section className="sf-logos">
        <div className="sf-container sf-logos__inner">
          <span className="sf-logos__label">Confiado por profissionais e instituições</span>
          <div className="sf-logos__row">
            <div className="sf-logoTag">Saúde</div>
            <div className="sf-logoTag">Educação</div>
            <div className="sf-logoTag">Jurídico</div>
            <div className="sf-logoTag">Empresas</div>
            <div className="sf-logoTag">Setor Público</div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="sf-how">
        <div className="sf-container">
          <h2>Como funciona</h2>
          <p className="sf-sub">Três passos para assinar e validar com confiança.</p>

          <div className="sf-grid sf-how__grid">
            <Card
              icon={<UploadIcon />}
              title="Envie o PDF"
              text="Faça upload em /editor. Suporte a documentos extensos e múltiplas páginas."
            />
            <Card
              icon={<PenIcon />}
              title="Assine & personalize"
              text="Desenhe ou importe a assinatura, escolha o perfil (Médico/Faculdade/Genérico) e ajuste o QR."
            />
            <Card
              icon={<QrIcon />}
              title="Valide por QR"
              text="Compartilhe o PDF. A autenticidade é conferida em /validate/{'{id}'} com dados e rodapé do perfil."
            />
          </div>
        </div>
      </section>

      {/* Segurança & LGPD */}
      <section className="sf-sec">
        <div className="sf-container sf-sec__grid">
          <div>
            <h2>Segurança & Confiabilidade</h2>
            <p className="sf-sub">
              Construído com Supabase, RLS e criptografia TLS. Políticas de acesso e rastreabilidade desde o upload até a validação.
            </p>

            <div className="sf-chips">
              <Chip><LockIcon /> Criptografia em trânsito (HTTPS)</Chip>
              <Chip><ShieldIcon /> RLS ativado (Row Level Security)</Chip>
              <Chip><AuditIcon /> Trilha de auditoria</Chip>
              <Chip><PolicyIcon /> LGPD-friendly</Chip>
            </div>

            <ul className="sf-list">
              <li><CheckIcon /> QR único por documento, com URL de validação pública</li>
              <li><CheckIcon /> Perfis com cor, logo e rodapé (ex.: CRM/DF, CNPJ, etc.)</li>
              <li><CheckIcon /> Cancelamento preserva histórico, com sinalização visível</li>
            </ul>
          </div>

          <div className="sf-sec__card">
            <h3>Pronto para uso profissional</h3>
            <ul>
              <li><CheckIcon /> Assinatura e QR em todas as páginas</li>
              <li><CheckIcon /> Validação pública com snapshot de perfil</li>
              <li><CheckIcon /> Dashboard com histórico e cancelamento</li>
            </ul>
            <div className="sf-sec__cta">
              <Link href="/editor" className="sf-btn sf-btn--primary"><BoltIcon /> Assinar agora</Link>
              <Link href="/validate/demo" className="sf-btn sf-btn--ghost">Ver demo</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="sf-diff">
        <div className="sf-container">
          <h2>Diferenciais do SignFlow</h2>
          <p className="sf-sub">O que nos torna a escolha certa para quem precisa inspirar confiança.</p>

          <div className="sf-grid sf-diff__grid">
            <Feature
              title="Experiência simples"
              text="Fluxo direto: enviar, assinar, salvar. Sem fricção técnica."
            />
            <Feature
              title="Visual personalizável"
              text="Ajuste cores, logo e rodapé no perfil. Padronize a validação para sua área."
            />
            <Feature
              title="Alto desempenho"
              text="PDFs processados no cliente com pdf-lib e assets públicos no Supabase."
            />
            <Feature
              title="Escalável"
              text="Pronto para crescer em times: políticas, perfis e histórico centralizado."
            />
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="sf-test">
        <div className="sf-container">
          <h2>Quem usa aprova</h2>
          <div className="sf-grid sf-test__grid">
            <Quote
              text="Padronizamos laudos com QR e validação clara. Pacientes entendem e confiam."
              author="Profissional de Saúde"
            />
            <Quote
              text="Fluxo de assinaturas acadêmicas ficou simples e auditável."
              author="Coordenação de Faculdade"
            />
            <Quote
              text="Assinatura rápida e validação pública, mantendo nosso logo e cores."
              author="Administração"
            />
          </div>
        </div>
      </section>

      {/* Pricing simples (opcional) */}
      <section className="sf-price">
        <div className="sf-container">
          <h2>Planos</h2>
          <p className="sf-sub">Comece grátis. Evolua conforme a necessidade.</p>

          <div className="sf-grid sf-price__grid">
            <PriceCard
              title="Gratuito"
              price="R$ 0"
              bullets={[
                'Assinatura com QR',
                'Perfis básicos',
                'Validação pública',
              ]}
              cta={<Link href="/editor" className="sf-btn sf-btn--primary">Começar</Link>}
            />
            <PriceCard
              title="Profissional"
              price="Em breve"
              bullets={[
                'Perfis avançados',
                'Histórico estendido',
                'Suporte prioritário',
              ]}
              featured
              cta={<Link href="/login" className="sf-btn sf-btn--ghost">Ser notificado</Link>}
            />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="sf-cta">
        <div className="sf-container sf-cta__box">
          <div>
            <h2>Pronto para assinar com confiança?</h2>
            <p className="sf-sub">Crie sua assinatura, ajuste o QR e compartilhe o PDF validável.</p>
          </div>
          <div className="sf-cta__actions">
            <Link href="/editor" className="sf-btn sf-btn--primary"><BoltIcon /> Assinar agora</Link>
            <Link href="/validate/demo" className="sf-btn sf-btn--ghost">Ver demo</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="sf-footer">
        <div className="sf-container sf-footer__inner">
          <div className="sf-footer__brand">
            <span className="sf-logo">◆</span> <strong>SignFlow</strong>
            <div className="sf-footer__muted">Assine PDFs com confiança.</div>
          </div>
          <nav className="sf-footer__nav">
            <Link href="/editor">Assinar</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/validate/demo">Demo</Link>
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
      </footer>

      {/* ====== CSS ====== */}
      <style>{css}</style>
    </main>
  )
}

/* ---------- componentes ---------- */

function Card({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="sf-card">
      <div className="sf-card__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="sf-feature">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

function Quote({ text, author }: { text: string; author: string }) {
  return (
    <div className="sf-quote">
      <p className="sf-quote__text">“{text}”</p>
      <div className="sf-quote__author">— {author}</div>
    </div>
  )
}

function PriceCard({
  title, price, bullets, featured, cta,
}: { title: string; price: string; bullets: string[]; featured?: boolean; cta: React.ReactNode }) {
  return (
    <div className={`sf-price__card ${featured ? 'is-featured' : ''}`}>
      <div className="sf-price__head">
        <div className="sf-price__title">{title}</div>
        <div className="sf-price__amount">{price}</div>
      </div>
      <ul className="sf-price__list">
        {bullets.map((b, i) => <li key={i}><CheckIcon />{b}</li>)}
      </ul>
      <div className="sf-price__cta">{cta}</div>
    </div>
  )
}

/* ---------- ícones ---------- */

function CheckIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function ShieldIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-3.5 9-8 9s-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function LockIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 10V7a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function AuditIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v14H8l-4 4V4z" stroke="currentColor" strokeWidth="2"/><path d="M8 8h8M8 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function PolicyIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 9-8 9S4 17 4 12V6l8-4z" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}
function UploadIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0l-4 4m4-4l4 4M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function PenIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 3l5 5L8 21H3v-5L16 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
function QrIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 8v-4h4v-4h4v8h-8z" stroke="currentColor" strokeWidth="2"/></svg>
}
function BoltIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

/* ---------- CSS ---------- */

const css = `
:root{
  --sf-bg:#0b1220;
  --sf-paper:#ffffff;
  --sf-muted:#475569;
  --sf-text:#0f172a;
  --sf-border:#e5e7eb;
  --sf-primary:#2563eb;
  --sf-primary-600:#1d4ed8;
  --sf-primary-100:#dbeafe;
  --sf-green:#065f46;
}

*{box-sizing:border-box}
html,body{margin:0;padding:0}
a{color:inherit}

.sf-root{background:linear-gradient(180deg,#ffffff,#f8fafc 60%,#ffffff); color:var(--sf-text)}

.sf-container{max-width:1120px;margin:0 auto;padding:0 16px}

/* Navbar */
.sf-nav{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.8);backdrop-filter:saturate(1.2) blur(8px);border-bottom:1px solid rgba(229,231,235,.6)}
.sf-nav__inner{display:flex;align-items:center;justify-content:space-between;height:64px}
.sf-brand{display:flex;align-items:center;gap:10px;font-weight:800;text-decoration:none;letter-spacing:.2px}
.sf-logo{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:2px solid var(--sf-text);border-radius:4px;line-height:1}
.sf-nav__links{display:flex;gap:18px}
.sf-nav__links a{text-decoration:none;color:#0f172a;opacity:.9}
.sf-nav__links a:hover{opacity:1}
.sf-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600;transition:.2s ease; border:1px solid var(--sf-border);background:#fff}
.sf-btn--primary{background:var(--sf-primary);border-color:var(--sf-primary-600);color:#fff;box-shadow:0 2px 8px rgba(37,99,235,.25)}
.sf-btn--primary:hover{background:var(--sf-primary-600)}
.sf-btn--ghost:hover{background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.06)}

/* Hero */
.sf-hero{
  background:
    radial-gradient(1000px 600px at -10% -20%, #dbeafe 5%, transparent 40%),
    radial-gradient(1000px 600px at 110% -10%, #e9d5ff 5%, transparent 40%),
    linear-gradient(180deg,#ffffff,#f8fafc);
  padding:76px 0 48px;
}
.sf-hero__grid{display:grid;grid-template-columns:1.15fr 1fr;gap:28px;align-items:center}
.sf-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--sf-border);border-radius:999px;background:#fff;color:var(--sf-muted);font-size:12px}
.sf-hero h1{font-size:46px;line-height:1.1;margin:14px 0;letter-spacing:-.5px}
.sf-hero__subtitle{max-width:720px;font-size:18px;color:var(--sf-muted);margin-top:0}
.sf-hero__ctas{display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 4px}
.sf-hero__bullets{list-style:none;padding-left:0;margin:10px 0 0;display:grid;gap:6px;color:var(--sf-text)}
.sf-hero__bullets li{display:flex;align-items:center;gap:8px;color:#1f2937}

.sf-hero__mock{display:flex;justify-content:center}
.sf-mock{width:100%;max-width:460px;border:1px solid var(--sf-border);border-radius:14px;background:#fff;box-shadow:0 10px 30px rgba(15,23,42,.08)}
.sf-mock__bar{display:flex;align-items:center;gap:8px;padding:10px;border-bottom:1px solid var(--sf-border);background:#f8fafc;border-radius:14px 14px 0 0}
.sf-mock__bar .dot{width:8px;height:8px;border-radius:999px;background:#e2e8f0}
.sf-mock__title{margin-left:auto;font-size:12px;color:var(--sf-muted)}
.sf-mock__page{position:relative;height:260px;background:linear-gradient(180deg,#ffffff,#f8fafc);display:flex;align-items:flex-end;justify-content:flex-end;padding:18px}
.sf-mock__page--fade{height:18px;background:linear-gradient(180deg,#f8fafc,transparent)}
.sf-mock__qr{width:68px;height:68px;border:2px dashed #cbd5e1;border-radius:8px;margin-right:8px}
.sf-mock__sign{font-family:serif;font-style:italic;color:#0f172a;border:1px dashed #cbd5e1;border-radius:8px;padding:8px 10px}

/* Logos */
.sf-logos{background:#fff}
.sf-logos__inner{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px 0}
.sf-logos__label{color:var(--sf-muted);font-size:14px}
.sf-logos__row{display:flex;gap:12px;flex-wrap:wrap}
.sf-logoTag{padding:8px 12px;border:1px solid var(--sf-border);border-radius:10px;background:#fff;color:#334155}

/* Como funciona */
.sf-how{background:#f8fafc;border-top:1px solid #eef2ff;border-bottom:1px solid #eef2ff;padding:52px 0}
.sf-how h2{font-size:28px;margin:0 0 6px}
.sf-sub{color:var(--sf-muted);margin:0 0 18px}
.sf-grid{display:grid;gap:16px}
.sf-how__grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.sf-card{background:#fff;border:1px solid var(--sf-border);border-radius:12px;padding:16px;min-height:158px}
.sf-card__icon{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--sf-primary-100);color:var(--sf-primary)}
.sf-card h3{margin:10px 0 6px}
.sf-card p{margin:0;color:var(--sf-muted)}

/* Segurança */
.sf-sec{background:#fff;padding:56px 0}
.sf-sec__grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:24px;align-items:start}
.sf-chips{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0 12px}
.sf-chip{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--sf-border);border-radius:999px;background:#fff;color:#0f172a}
.sf-list{margin:12px 0 0 18px;color:#334155;line-height:1.7}
.sf-sec__card{background:#f8fafc;border:1px solid var(--sf-border);border-radius:12px;padding:16px}
.sf-sec__card h3{margin:0 0 8px}
.sf-sec__card ul{margin:0 0 12px 18px;color:#334155;line-height:1.7}
.sf-sec__cta{display:flex;gap:12px;flex-wrap:wrap}

/* Diferenciais */
.sf-diff{background:#fff;padding:52px 0}
.sf-diff__grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.sf-feature{background:#fff;border:1px solid var(--sf-border);border-radius:12px;padding:16px;min-height:130px}
.sf-feature h3{margin:0 0 6px}
.sf-feature p{margin:0;color:var(--sf-muted)}

/* Depoimentos */
.sf-test{background:#f8fafc;border-top:1px solid #eef2ff;border-bottom:1px solid #eef2ff;padding:48px 0}
.sf-test__grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.sf-quote{background:#fff;border:1px solid var(--sf-border);border-radius:12px;padding:16px}
.sf-quote__text{margin:0 0 8px;color:#334155}
.sf-quote__author{color:#64748b;font-size:14px}

/* Pricing */
.sf-price{background:#fff;padding:56px 0}
.sf-price__grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.sf-price__card{background:#fff;border:1px solid var(--sf-border);border-radius:14px;padding:18px;box-shadow:0 8px 20px rgba(15,23,42,.05)}
.sf-price__card.is-featured{border-color:var(--sf-primary-600);box-shadow:0 10px 30px rgba(37,99,235,.15)}
.sf-price__head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
.sf-price__title{font-weight:700}
.sf-price__amount{font-weight:800;font-size:22px}
.sf-price__list{list-style:none;padding-left:0;margin:0 0 14px;display:grid;gap:6px}
.sf-price__list li{display:flex;align-items:center;gap:8px;color:#334155}
.sf-price__cta{display:flex;gap:10px}

/* CTA final */
.sf-cta{background:linear-gradient(180deg,#f8fafc,#ffffff);padding:48px 0}
.sf-cta__box{background:#fff;border:1px solid var(--sf-border);border-radius:14px;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 10px 30px rgba(15,23,42,.06)}
.sf-cta__actions{display:flex;gap:12px;flex-wrap:wrap}

/* Footer */
.sf-footer{border-top:1px solid var(--sf-border);background:#fff}
.sf-footer__inner{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0;flex-wrap:wrap}
.sf-footer__brand{display:flex;align-items:center;gap:10px}
.sf-footer__muted{color:var(--sf-muted);font-size:12px}
.sf-footer__nav{display:flex;gap:14px}
.sf-footer__nav a{text-decoration:none;color:#334155}

/* Chips comp */
.sf-chip svg{opacity:.9}

/* Responsivo */
@media (max-width: 980px){
  .sf-hero__grid{grid-template-columns:1fr}
  .sf-sec__grid{grid-template-columns:1fr}
  .sf-how__grid{grid-template-columns:1fr}
  .sf-diff__grid{grid-template-columns:1fr 1fr}
  .sf-test__grid{grid-template-columns:1fr}
  .sf-price__grid{grid-template-columns:1fr}
}
`

/* ---------- helpers ---------- */

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="sf-chip">{children}</span>
}
