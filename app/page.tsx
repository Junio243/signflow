/* Landing PRO+ — credibilidade real (sem alegar parcerias oficiais)
   - Navbar fixa com CTA forte
   - Hero com mock de PDF realista (SVG detalhado)
   - Trustbar (TLS, RLS, LGPD, Auditoria, QR)
   - Como funciona (3 passos)
   - Diferenciais corporativos
   - Depoimentos enterprise (placeholders, claramente indicados)
   - Parcerias & Integrações (Dataprev = "Em negociação"; Supabase/Vercel = "Ativo")
   - Pricing simples
   - CTA final
   - Rodapé com "Selo de Verificação Pública" (sem referência a gov.br)
*/

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="pro-root">
      {/* NAV */}
      <header className="pro-nav">
        <div className="wrap nav-row">
          <Link href="/" className="brand">
            <span className="glyph">◆</span> <b>SignFlow</b>
          </Link>
          <nav className="links">
            <Link href="/editor">Assinar</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/validate/demo">Demo</Link>
            <Link href="/login">Entrar</Link>
          </nav>
          <Link href="/editor" className="btn btn-primary">Começar</Link>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="badge"><ShieldIcon/> Segurança por design • LGPD-ready</div>
            <h1>Assinatura eletrônica que inspira confiança</h1>
            <p className="sub">
              Assine PDFs em minutos, com QR Code em todas as páginas e validação pública.
              Armazenamento seguro no Supabase, RLS e auditoria ponta a ponta.
            </p>
            <div className="cta-row">
              <Link href="/editor" className="btn btn-primary"><BoltIcon/> Assinar agora</Link>
              <Link href="/validate/demo" className="btn btn-ghost"><QrIcon/> Ver demo de validação</Link>
            </div>
            <ul className="bullets">
              <li><CheckIcon/> Assinatura desenhada ou importada (PNG/JPG)</li>
              <li><CheckIcon/> Perfis (Médico, Faculdade, Genérico) com logo/cores</li>
              <li><CheckIcon/> Cancelamento com trilha de auditoria</li>
            </ul>
          </div>
          <div className="hero-mock">
            <DocMock/>
          </div>
        </div>
      </section>

      {/* TRUSTBAR */}
      <section className="trust">
        <div className="wrap trust-row">
          <Chip><LockIcon/> TLS criptografado</Chip>
          <Chip><ShieldIcon/> Supabase RLS</Chip>
          <Chip><AuditIcon/> Auditoria</Chip>
          <Chip><PolicyIcon/> LGPD-friendly</Chip>
          <Chip><QrIcon/> QR por documento</Chip>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="how">
        <div className="wrap">
          <h2>Como funciona</h2>
          <p className="sub">Fluxo direto para equipes exigentes.</p>
          <div className="grid-3">
            <Card icon={<UploadIcon/>} title="1) Envie o PDF" text="Upload em /editor. Compatível com múltiplas páginas e tamanhos."/>
            <Card icon={<PenIcon/>} title="2) Assine & personalize" text="Desenhe ou importe assinatura, ajuste o QR e selecione um perfil."/>
            <Card icon={<QrIcon/>} title="3) Valide por QR" text="Compartilhe. A autenticidade é conferida em /validate/{'{id}'} com dados do perfil."/>
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="diff">
        <div className="wrap">
          <h2>Diferenciais corporativos</h2>
          <div className="grid-4">
            <Feature title="Confiabilidade" text="Sinalização clara de status (Assinado/Cancelado/Expirado) e histórico."/>
            <Feature title="Padronização" text="Perfis com logo, cor e rodapé — padronize por área (saúde, educação, jurídico)."/>
            <Feature title="Desempenho" text="Processamento local com pdf-lib e distribuição via storage público."/>
            <Feature title="Escalabilidade" text="Pensado para times: políticas, auditoria e integrações planejadas."/>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS (PLACEHOLDERS CLAROS) */}
      <section className="testi">
        <div className="wrap">
          <h2>Quem usa aprova</h2>
          <p className="muted small">*Depoimentos ilustrativos para demonstração</p>
          <div className="grid-3">
            <Quote
              text="Padronizamos laudos e validação por QR. Fluxo claro e auditável."
              author="Hospital de Referência"
            />
            <Quote
              text="Simplificou assinaturas acadêmicas e conferência pública de termos."
              author="Universidade Federal"
            />
            <Quote
              text="Assinatura rápida, validação transparente e identidade visual preservada."
              author="Grupo Jurídico Nacional"
            />
          </div>
        </div>
      </section>

      {/* PARCERIAS & INTEGRAÇÕES */}
      <section className="partners">
        <div className="wrap">
          <h2>Parcerias & Integrações</h2>
          <div className="grid-3">
            <PartnerCard
              title="Dataprev"
              tag="Em negociação"
              text="Compatibilidade planejada com fluxos de consulta pública. Sem afiliação oficial neste momento."
            />
            <PartnerCard
              title="Supabase"
              tag="Ativo"
              text="Autenticação, RLS, Storage e Postgres gerenciados."
            />
            <PartnerCard
              title="Vercel"
              tag="Ativo"
              text="Infraestrutura de deploy e preview de ambientes."
            />
          </div>
          <p className="muted small">
            Para exibir logotipos e declarações oficiais, insira documentos/autorização e atualizamos esta seção.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing">
        <div className="wrap">
          <h2>Planos</h2>
          <p className="sub">Comece grátis. Evolua quando precisar.</p>
          <div className="grid-2">
            <PriceCard
              title="Gratuito"
              price="R$ 0"
              bullets={['Assinatura com QR', 'Validação pública', 'Perfis básicos']}
              cta={<Link href="/editor" className="btn btn-primary">Começar</Link>}
            />
            <PriceCard
              title="Profissional"
              price="Em breve"
              bullets={['Perfis avançados', 'Histórico estendido', 'Suporte prioritário']}
              featured
              cta={<Link href="/login" className="btn btn-ghost">Ser notificado</Link>}
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta">
        <div className="wrap cta-box">
          <div>
            <h2>Pronto para assinar com confiança?</h2>
            <p className="sub">Crie sua assinatura, ajuste o QR e compartilhe o PDF validável.</p>
          </div>
          <div className="cta-actions">
            <Link href="/editor" className="btn btn-primary"><BoltIcon/> Assinar agora</Link>
            <Link href="/validate/demo" className="btn btn-ghost">Ver demo</Link>
          </div>
        </div>
      </section>

      {/* FOOTER + SELO */}
      <footer className="foot">
        <div className="wrap foot-row">
          <div className="foot-brand">
            <span className="glyph">◆</span> <b>SignFlow</b>
            <div className="muted small">Assine PDFs com confiança.</div>
          </div>
          <nav className="foot-nav">
            <Link href="/editor">Assinar</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/validate/demo">Demo</Link>
            <Link href="/login">Entrar</Link>
          </nav>
        </div>
        <div className="wrap seal">
          <div className="seal-badge">
            <span className="seal-icon"><GovShieldIcon/></span>
            <div className="seal-text">
              <div className="seal-title">Selo de Verificação Pública</div>
              <div className="seal-sub">Documento conferível por QR Code • Transparência e Auditoria</div>
            </div>
          </div>
        </div>
      </footer>

      <style>{css}</style>
    </main>
  )
}

/* ===== COMPONENTES ===== */

function Card({ icon, title, text }:{ icon:React.ReactNode; title:string; text:string }) {
  return (
    <div className="card">
      <div className="card-ico">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
function Feature({ title, text }:{ title:string; text:string }) {
  return (
    <div className="feature">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
function Quote({ text, author }:{ text:string; author:string }) {
  return (
    <div className="quote">
      <p className="q-text">“{text}”</p>
      <div className="q-author">— {author}</div>
    </div>
  )
}
function PartnerCard({ title, tag, text }:{ title:string; tag:'Ativo'|'Em negociação'; text:string }) {
  return (
    <div className="partner">
      <div className="partner-head">
        <div className="partner-title">{title}</div>
        <span className={`partner-tag ${tag === 'Ativo' ? 'green' : 'amber'}`}>{tag}</span>
      </div>
      <p className="muted">{text}</p>
    </div>
  )
}
function PriceCard({ title, price, bullets, featured, cta }:{
  title:string; price:string; bullets:string[]; featured?:boolean; cta:React.ReactNode
}) {
  return (
    <div className={`price ${featured ? 'featured': ''}`}>
      <div className="price-head">
        <div className="price-title">{title}</div>
        <div className="price-amount">{price}</div>
      </div>
      <ul className="price-list">
        {bullets.map((b,i)=><li key={i}><CheckIcon/>{b}</li>)}
      </ul>
      <div>{cta}</div>
    </div>
  )
}

/* ===== MOCK DE DOCUMENTO (SVG rico) ===== */

function DocMock() {
  return (
    <div className="doc">
      <div className="doc-bar">
        <div className="dots"><span/><span/><span/></div>
        <div className="doc-title">Laudo/Termo — Pré-visualização</div>
      </div>
      <svg viewBox="0 0 420 560" className="doc-svg" aria-hidden>
        <rect x="0" y="0" width="420" height="560" rx="8" fill="#fff"/>
        <rect x="18" y="18" width="384" height="20" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="48" width="280" height="10" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="66" width="340" height="10" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="84" width="300" height="10" rx="4" fill="#e5e7eb"/>

        {[...Array(10)].map((_,i)=>(
          <rect key={i} x="18" y={120+i*14} width={i%3===0?360:380-(i%4)*30} height="8" rx="3" fill="#eef2f7"/>
        ))}

        <rect x="18" y="280" width="384" height="90" rx="6" fill="#f8fafc" stroke="#e5e7eb"/>
        {[0,1,2,3].map(i=>(
          <rect key={i} x={24} y={292+i*18} width={360-(i*12)} height="10" rx="3" fill="#e8edf5"/>
        ))}

        <g>
          <rect x="280" y="440" width="100" height="100" rx="6" fill="#ffffff" stroke="#d1d5db"/>
          {[...Array(25)].map((_,i)=>(
            <rect key={i} x={286 + (i%5)*18} y={446 + Math.floor(i/5)*18} width="12" height="12" fill={i%2? '#0f172a':'#94a3b8'} opacity={i%7?1:.6}/>
          ))}
          <path d="M40 500 C 80 520, 120 468, 160 496 S 230 520, 260 492"
                stroke="#0f172a" strokeWidth="2" fill="none" opacity="0.9"/>
          <rect x="34" y="520" width="160" height="12" rx="3" fill="#e5e7eb"/>
        </g>
      </svg>
    </div>
  )
}

/* ===== ÍCONES ===== */

function CheckIcon(){return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function ShieldIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l8 3v6c0 5-3.5 9-8 9s-8-4-8-9V6l8-3z" stroke="currentColor" strokeWidth="2"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function LockIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 10V7a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
function AuditIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v14H8l-4 4V4z" stroke="currentColor" strokeWidth="2"/><path d="M8 8h8M8 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
function PolicyIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 9-8 9S4 17 4 12V6l8-4z" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
function UploadIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0l-4 4m4-4l4 4M6 20h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function PenIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 3l5 5L8 21H3v-5L16 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function QrIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 8v-4h4v-4h4v8h-8z" stroke="currentColor" strokeWidth="2"/></svg>}
function BoltIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function GovShieldIcon(){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2l9 4v6c0 6-4 10-9 10S3 18 3 12V6l9-4z" stroke="currentColor" strokeWidth="2"/><path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}

/* ===== CSS ===== */

const css = `
:root{
  --bg:#0b1220; --paper:#fff; --border:#e5e7eb; --muted:#475569;
  --txt:#0f172a; --primary:#1d4ed8; --primary-2:#2563eb; --ring:#dbeafe;
}
*{box-sizing:border-box} html,body{margin:0} a{color:inherit}
.wrap{max-width:1180px;margin:0 auto;padding:0 16px}

/* NAV */
.pro-nav{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.86);backdrop-filter:blur(8px);border-bottom:1px solid rgba(229,231,235,.7)}
.nav-row{display:flex;align-items:center;justify-content:space-between;height:66px}
.brand{display:flex;align-items:center;gap:10px;color:var(--txt);font-weight:800}
.glyph{display:inline-flex;width:22px;height:22px;border:2px solid var(--txt);border-radius:5px;align-items:center;justify-content:center}
.links{display:flex;gap:18px}
.links a{color:#111827;opacity:.9}
.links a:hover{opacity:1}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:#fff;font-weight:700}
.btn-primary{background:var(--primary-2);color:#fff;border-color:#1e40af;box-shadow:0 4px 18px rgba(29,78,216,.28)}
.btn-primary:hover{background:#1e40af}
.btn-ghost:hover{box-shadow:0 2px 10px rgba(0,0,0,.06)}

/* HERO */
.hero{position:relative;overflow:hidden}
.hero-bg{position:absolute;inset:-20% -10% auto -10%;height:520px;
  background:radial-gradient(700px 380px at -10% -20%, #dbeafe 18%, transparent 60%),
             radial-gradient(700px 380px at 110% -10%, #e9d5ff 18%, transparent 60%);}
.hero-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:32px;align-items:center;padding:80px 0 48px}
.hero-copy h1{font-size:44px;line-height:1.1;margin:8px 0;letter-spacing:-.4px}
.sub{color:var(--muted);margin:0}
.badge{display:inline-flex;align-items:center;gap:8px;color:#334155;margin-bottom:8px;padding:6px 10px;border:1px solid var(--border);border-radius:999px;background:#fff}
.cta-row{display:flex;gap:12px;margin:14px 0}
.bullets{list-style:none;margin:4px 0 0;padding:0;display:grid;gap:6px;color:#1f2937}
.hero-mock{display:flex;justify-content:center}

/* DOC MOCK */
.doc{width:100%;max-width:480px;border:1px solid var(--border);border-radius:14px;background:#fff;box-shadow:0 16px 40px rgba(15,23,42,.1)}
.doc-bar{display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--border);background:#f8fafc;border-radius:14px 14px 0 0}
.dots span{display:inline-block;width:8px;height:8px;background:#e2e8f0;border-radius:999px;margin-right:6px}
.doc-title{margin-left:auto;font-size:12px;color:#6b7280}
.doc-svg{display:block;width:100%;height:auto}

/* TRUSTBAR */
.trust{background:#fff}
.trust-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;padding:20px 0}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:999px;background:#fff;padding:8px 12px;color:#0f172a}

/* COMO FUNCIONA */
.how{background:#f8fafc;border-top:1px solid #eef2ff;border-bottom:1px solid #eef2ff;padding:52px 0}
.how h2{margin:0 0 6px}
.grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;min-height:158px}
.card-ico{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--ring);color:var(--primary-2)}
.card h3{margin:10px 0 6px}
.card p{margin:0;color:var(--muted)}

/* DIFERENCIAIS */
.diff{background:#fff;padding:52px 0}
.grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.feature{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;min-height:130px}
.feature h3{margin:0 0 6px}
.feature p{margin:0;color:var(--muted)}

/* DEPOIMENTOS */
.testi{background:#f8fafc;border-top:1px solid #eef2ff;border-bottom:1px solid #eef2ff;padding:46px 0}
.grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.quote{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px}
.q-text{margin:0 0 8px;color:#334155}
.q-author{color:#64748b;font-size:14px}

/* PARCERIAS */
.partners{background:#fff;padding:50px 0}
.partner{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px}
.partner-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.partner-title{font-weight:700}
.partner-tag{font-size:12px;border-radius:999px;padding:4px 8px;border:1px solid var(--border)}
.partner-tag.green{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
.partner-tag.amber{background:#fffbeb;color:#92400e;border-color:#fde68a}

/* PRICING */
.pricing{background:#fff;padding:56px 0}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.price{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px;box-shadow:0 8px 20px rgba(15,23,42,.05)}
.price.featured{border-color:#1e40af;box-shadow:0 10px 30px rgba(29,78,216,.18)}
.price-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
.price-title{font-weight:800}
.price-amount{font-weight:900;font-size:22px}
.price-list{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:6px;color:#334155}

/* CTA */
.cta{background:linear-gradient(180deg,#f8fafc,#ffffff);padding:46px 0}
.cta-box{background:#fff;border:1px solid var(--border);border-radius:14px;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 10px 30px rgba(15,23,42,.06)}
.cta-actions{display:flex;gap:12px;flex-wrap:wrap}

/* FOOTER + SELO */
.foot{border-top:1px solid var(--border);background:#fff}
.foot-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0;flex-wrap:wrap}
.foot-nav{display:flex;gap:14px}
.muted{color:var(--muted)} .small{font-size:12px}
.seal{padding:8px 0 24px}
.seal-badge{display:flex;gap:10px;align-items:center;justify-content:center;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:#f8fafc}
.seal-icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
.seal-title{font-weight:800}
.seal-sub{font-size:12px;color:#334155}

/* RESPONSIVO */
@media (max-width: 1020px){
  .hero-grid{grid-template-columns:1fr}
  .grid-4{grid-template-columns:1fr 1fr}
  .grid-3{grid-template-columns:1fr}
  .grid-2{grid-template-columns:1fr}
}
`

/* ===== HELPERS ===== */
function Chip({children}:{children:React.ReactNode}){return <span className="chip">{children}</span>}
