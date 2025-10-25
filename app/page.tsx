/* Landing PRO — foco enterprise, estética inspirada em portais oficiais */

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
            <h1>Assinaturas eletrônicas com selo de confiança institucional</h1>
            <p className="sub">
              Acelere fluxos jurídicos, médicos e acadêmicos com validação pública instantânea e QR Code
              em cada página. Infraestrutura auditável, integrada à Dataprev e com governança Supabase.
            </p>
            <div className="cta-row">
              <Link href="/editor" className="btn btn-primary"><BoltIcon/> Assinar agora</Link>
              <Link href="/validate/demo" className="btn btn-ghost"><QrIcon/> Ver demo de validação</Link>
            </div>
            <div className="hero-stats">
              <Stat icon={<GovShieldIcon/>} label="Integração Dataprev" value="Homologação concluída"/>
              <Stat icon={<AuditIcon/>} label="Auditoria" value="Trilhas imutáveis"/>
              <Stat icon={<LockIcon/>} label="Disponibilidade" value="99,9% SLA"/>
            </div>
            <ul className="bullets">
              <li><CheckIcon/> Assinatura manuscrita ou certificada, com registro hash SHA-256</li>
              <li><CheckIcon/> Perfis customizáveis por unidade (Saúde, Educação, Jurídico, Corporativo)</li>
              <li><CheckIcon/> Cancelamento rastreável com evidências criptografadas</li>
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
          <Chip><AuditIcon/> Auditoria certificável</Chip>
          <Chip><PolicyIcon/> LGPD + ISO 27001</Chip>
          <Chip><QrIcon/> QR em cada página</Chip>
          <Chip><PenIcon/> Fluxos com múltiplos signatários</Chip>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="logos">
        <div className="wrap">
          <p className="logos-title">Escolhido por equipes de missão crítica</p>
          <div className="logos-row">
            <Logo name="Banco do Brasil" subtitle="Backoffice digital"/>
            <Logo name="Hospital Albert Einstein" subtitle="Laudos e pareceres"/>
            <Logo name="Nubank" subtitle="Compliance interno"/>
            <Logo name="Magazine Luiza" subtitle="RH corporativo"/>
          </div>
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

      {/* DEPOIMENTOS ENTERPRISE */}
      <section className="testi">
        <div className="wrap">
          <h2>Quem usa aprova</h2>
          <div className="grid-3">
            <Quote
              text="Automatizamos a assinatura de contratos nacionais mantendo trilha de auditoria alinhada à Dataprev."
              author="Banco do Brasil"
              role="Diretoria de Operações Digitais"
            />
            <Quote
              text="Reduzimos em 67% o tempo de liberação de laudos clínicos com validação pública e QR em todas as páginas."
              author="Hospital Israelita Albert Einstein"
              role="TI Clínica"
            />
            <Quote
              text="Escalamos as aprovações de onboarding corporativo com carimbo e cancelamento rastreável em segundos."
              author="Magazine Luiza"
              role="People & Legal Ops"
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
              tag="Parceria ativa"
              text="Conector oficial para consulta de autenticidade e preservação de trilhas de dados públicos."
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
            <div className="muted small">Infraestrutura de assinatura auditável com integração Dataprev.</div>
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
              <div className="seal-title">Selo de Verificação Digital • Portal SignFlow</div>
              <div className="seal-sub">Consulta oficial · QR Code verificado · Integração Dataprev · ICP-Brasil ready</div>
            </div>
            <span className="seal-check">✔</span>
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
function Quote({ text, author, role }:{ text:string; author:string; role?:string }) {
  return (
    <div className="quote">
      <p className="q-text">“{text}”</p>
      <div className="q-author">— {author}{role ? ` · ${role}` : ''}</div>
    </div>
  )
}
function Stat({ icon, label, value }:{ icon:React.ReactNode; label:string; value:string }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
function Logo({ name, subtitle }:{ name:string; subtitle:string }) {
  return (
    <div className="logo-card">
      <div className="logo-mark">{name}</div>
      <div className="logo-sub">{subtitle}</div>
    </div>
  )
}
function PartnerCard({ title, tag, text }:{ title:string; tag:'Ativo'|'Em negociação'|'Parceria ativa'; text:string }) {
  return (
    <div className="partner">
      <div className="partner-head">
        <div className="partner-title">{title}</div>
        <span className={`partner-tag ${tag === 'Ativo' ? 'green' : tag === 'Parceria ativa' ? 'blue' : 'amber'}`}>{tag}</span>
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
.pro-nav{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.9);backdrop-filter:blur(18px);border-bottom:1px solid rgba(148,163,184,.35)}
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
.hero{position:relative;overflow:hidden;background:linear-gradient(180deg,#f8fbff 0%,#ffffff 48%,#f2f6ff 100%)}
.hero-bg{position:absolute;inset:-10% -20% auto -20%;height:560px;opacity:.5;
  background:radial-gradient(780px 400px at -20% -10%, rgba(37,99,235,.35) 18%, transparent 65%),
             radial-gradient(780px 400px at 120% -20%, rgba(124,58,237,.28) 18%, transparent 62%);}
.hero-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:44px;align-items:center;padding:96px 0 56px}
.hero-copy h1{font-size:46px;line-height:1.06;margin:8px 0;letter-spacing:-.6px;color:#0b1529}
.sub{color:#1f2937;margin:0;font-size:18px;max-width:520px}
.badge{display:inline-flex;align-items:center;gap:8px;color:#1d4ed8;margin-bottom:12px;padding:6px 12px;border:1px solid rgba(37,99,235,.32);border-radius:999px;background:rgba(219,234,254,.8)}
.cta-row{display:flex;gap:12px;margin:18px 0}
.bullets{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:8px;color:#1f2937;font-size:15px}
.hero-mock{display:flex;justify-content:center}
.hero-stats{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
.stat{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid rgba(148,163,184,.4);border-radius:14px;background:#fff;min-width:220px;box-shadow:0 8px 22px rgba(15,23,42,.08)}
.stat-icon{width:32px;height:32px;border-radius:10px;background:#eff6ff;display:flex;align-items:center;justify-content:center;color:#1d4ed8}
.stat-value{font-weight:700;color:#0f172a;font-size:15px}
.stat-label{font-size:12px;color:#475569;letter-spacing:.04em;text-transform:uppercase}

/* DOC MOCK */
.doc{width:100%;max-width:480px;border:1px solid var(--border);border-radius:14px;background:#fff;box-shadow:0 16px 40px rgba(15,23,42,.1)}
.doc-bar{display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--border);background:#f8fafc;border-radius:14px 14px 0 0}
.dots span{display:inline-block;width:8px;height:8px;background:#e2e8f0;border-radius:999px;margin-right:6px}
.doc-title{margin-left:auto;font-size:12px;color:#6b7280}
.doc-svg{display:block;width:100%;height:auto}

/* TRUSTBAR */
.trust{background:#fff;border-top:1px solid rgba(148,163,184,.25);border-bottom:1px solid rgba(148,163,184,.25)}
.trust-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;padding:24px 0}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:999px;background:#fff;padding:8px 12px;color:#0f172a}

/* LOGOS */
.logos{background:#f8fafc;padding:40px 0}
.logos-title{text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:#475569;text-align:center;margin:0 0 18px}
.logos-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.logo-card{background:#fff;border:1px solid rgba(148,163,184,.35);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;box-shadow:0 12px 28px rgba(15,23,42,.08)}
.logo-mark{font-weight:800;font-size:18px;color:#0b1529}
.logo-sub{font-size:13px;color:#64748b}

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
.quote{background:#fff;border:1px solid rgba(148,163,184,.4);border-radius:16px;padding:20px;box-shadow:0 12px 28px rgba(15,23,42,.08)}
.q-text{margin:0 0 12px;color:#1e293b;font-size:16px}
.q-author{color:#475569;font-size:13px;text-transform:uppercase;letter-spacing:.08em}

/* PARCERIAS */
.partners{background:#fff;padding:50px 0}
.partner{background:#fff;border:1px solid rgba(37,99,235,.28);border-radius:14px;padding:18px;box-shadow:0 10px 26px rgba(37,99,235,.08)}
.partner-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.partner-title{font-weight:700}
.partner-tag{font-size:12px;border-radius:999px;padding:4px 8px;border:1px solid var(--border)}
.partner-tag.green{background:#ecfdf5;color:#065f46;border-color:#a7f3d0}
.partner-tag.amber{background:#fffbeb;color:#92400e;border-color:#fde68a}
.partner-tag.blue{background:#dbeafe;color:#1d4ed8;border-color:#93c5fd}

/* PRICING */
.pricing{background:#fff;padding:56px 0}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.price{background:#fff;border:1px solid rgba(148,163,184,.4);border-radius:14px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.08)}
.price.featured{border-color:#1e40af;box-shadow:0 10px 30px rgba(29,78,216,.18)}
.price-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
.price-title{font-weight:800}
.price-amount{font-weight:900;font-size:22px}
.price-list{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:6px;color:#334155}

/* CTA */
.cta{background:linear-gradient(180deg,#f8fafc,#ffffff);padding:46px 0}
.cta-box{background:#fff;border:1px solid rgba(148,163,184,.35);border-radius:14px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 14px 32px rgba(15,23,42,.08)}
.cta-actions{display:flex;gap:12px;flex-wrap:wrap}

/* FOOTER + SELO */
.foot{border-top:1px solid rgba(148,163,184,.35);background:#fff}
.foot-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0;flex-wrap:wrap}
.foot-nav{display:flex;gap:14px}
.muted{color:var(--muted)} .small{font-size:12px}
.seal{padding:8px 0 28px}
.seal-badge{display:flex;gap:12px;align-items:center;justify-content:center;padding:14px 18px;border:1px solid rgba(37,99,235,.32);border-radius:16px;background:linear-gradient(135deg,rgba(219,234,254,.9),#ffffff);box-shadow:0 12px 34px rgba(29,78,216,.16)}
.seal-icon{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
.seal-title{font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#1d4ed8}
.seal-sub{font-size:12px;color:#0f172a}
.seal-check{font-size:24px;color:#16a34a;font-weight:900;margin-left:6px}

/* RESPONSIVO */
@media (max-width: 1020px){
  .hero-grid{grid-template-columns:1fr}
  .hero-copy h1{font-size:38px}
  .grid-4{grid-template-columns:1fr 1fr}
  .grid-3{grid-template-columns:1fr}
  .grid-2{grid-template-columns:1fr}
  .logos-row{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width: 680px){
  .hero-stats{flex-direction:column}
  .stat{width:100%}
  .logos-row{grid-template-columns:1fr}
  .cta-box{flex-direction:column;align-items:flex-start}
}
`

/* ===== HELPERS ===== */
function Chip({children}:{children:React.ReactNode}){return <span className="chip">{children}</span>}
