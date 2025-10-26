/* Landing PRO — foco enterprise, hierarquia forte e estética de portal oficial */

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="pro-root">
      {/* ===== NAV / HEADER ===== */}
      <header className="pro-nav">
        <div className="wrap nav-row">
          <Link href="/" className="brand" aria-label="SignFlow - página inicial">
            <span className="glyph">◆</span> <b>SignFlow</b>
          </Link>
          <nav className="links" aria-label="Navegação principal">
            <Link href="/">Home</Link>
            <Link href="/#produtos">Produtos</Link>
            <Link href="/#planos">Planos</Link>
            <Link href="/#suporte">Suporte</Link>
            <Link href="/login">Entrar</Link>
          </nav>
          <Link href="/editor" className="btn btn-primary" aria-label="Assinar documento agora">
            <BoltIcon/> Assinar agora
          </Link>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-bg" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="badge"><ShieldIcon/> Segurança por design • LGPD-ready</div>
            <h1 id="hero-title">Assinaturas eletrônicas com validação pública instantânea e selo ICP-Brasil</h1>
            <p className="sub">
              Acelere fluxos jurídicos, médicos e acadêmicos com QR Code em cada página.
              Infraestrutura auditável integrada à Dataprev.
            </p>
            <div className="cta-row">
              <Link href="/editor" className="btn btn-primary"><BoltIcon/> Assinar documento</Link>
              <Link href="/validate/demo" className="btn btn-ghost"><QrIcon/> Ver demonstração</Link>
            </div>
            <ul className="bullets" aria-label="Benefícios principais">
              <li><CheckIcon/> Assinatura manuscrita ou certificada com hash SHA-256</li>
              <li><CheckIcon/> QR Code em todas as páginas do PDF</li>
              <li><CheckIcon/> Perfis por área (Saúde, Educação, Jurídico, Corporativo)</li>
            </ul>
          </div>
          <div className="hero-mock">
            <DocMock/>
          </div>
        </div>
      </section>

      {/* ===== TRUST: Logos Reais + Selos ===== */}
      <section className="trusted" aria-labelledby="trusted-title">
        <div className="wrap">
          <h2 id="trusted-title" className="trusted-title">Confiado por instituições de missão crítica</h2>
          <p className="trusted-sub">Infraestrutura auditável, LGPD, ISO 27001 e ICP-Brasil — com validação pública por QR.</p>
          <div className="logos-row" role="list">
            <BrandLogo variant="bb"  label="Banco do Brasil" />
            <BrandLogo variant="ein" label="Hospital Israelita Albert Einstein" />
            <BrandLogo variant="nub" label="Nubank" />
            <BrandLogo variant="mgl" label="Magazine Luiza" />
            <BrandLogo variant="dtp" label="Dataprev (integração homologada)" />
            <BrandLogo variant="gdf" label="GDF • ICP-Brasil (conformidade)" />
          </div>

          <div className="compliance">
            <Chip><PolicyIcon/> LGPD</Chip>
            <Chip><IsoIcon/> ISO 27001</Chip>
            <Chip><IcpiIcon/> ICP-Brasil</Chip>
            <Chip><DataprevIcon/> Integração Dataprev</Chip>
          </div>

          <p className="muted small center">
            “Infraestrutura auditável integrada a provedores públicos, com trilhas imutáveis e criptografia SHA-256.”
          </p>
        </div>
      </section>

      {/* ===== COMO FUNCIONA (4 passos visuais) ===== */}
      <section className="how" id="produtos" aria-labelledby="how-title">
        <div className="wrap">
          <h2 id="how-title">Como funciona</h2>
          <p className="sub">Fluxo visual e direto — do upload até a validação pública.</p>
          <div className="grid-4">
            <StepCard icon={<UploadIcon/>} title="1) Envie o PDF" text="Upload seguro e suporte a múltiplas páginas."/>
            <StepCard icon={<PenIcon/>} title="2) Assine & personalize" text="Desenhe ou importe assinatura. Ajuste QR e selecione perfil."/>
            <StepCard icon={<QrIcon/>} title="3) QR em todas as páginas" text="Gerado automaticamente e inserido no rodapé."/>
            <StepCard icon={<ShieldIcon/>} title="4) Valide publicamente" text="Conferência instantânea em /validate/{id}."/>
          </div>

          {/* Mini-demo (placeholder) */}
          <div className="demo">
            <video className="demo-video" playsInline muted loop autoPlay aria-label="Demonstração rápida do fluxo">
              <source src="" type="video/mp4" />
            </video>
            <div className="demo-note muted small">
              (Insira um vídeo curto: 10–20s mostrando upload → assinatura → QR → validação)
            </div>
          </div>
        </div>
      </section>

      {/* ===== DIFERENCIAIS ===== */}
      <section className="diff" aria-labelledby="diff-title">
        <div className="wrap">
          <h2 id="diff-title">Diferenciais corporativos</h2>
          <div className="grid-4">
            <Feature
              title="Validade Jurídica"
              text="Documentos com selo ICP-Brasil e metadados prontos para reconhecimento cartorial imediato."
            />
            <Feature
              title="Segurança/Criptografia"
              text="Criptografia ponta a ponta, hashes SHA-256 e armazenamento segregado para proteger cada assinatura."
            />
            <Feature
              title="Trilha de Auditoria"
              text="Registro imutável de eventos com carimbo de tempo, IP e status a cada movimentação."
            />
            <Feature
              title="Acesso de Qualquer Lugar"
              text="Disponível em desktop, mobile e API para equipes híbridas assinarem sem fricção."
            />
          </div>
        </div>
      </section>

      {/* ===== DEPOIMENTOS (com “logos”) ===== */}
      <section className="testi" aria-labelledby="testi-title">
        <div className="wrap">
          <h2 id="testi-title">Quem usa, aprova</h2>
          <div className="grid-3">
            <Quote
              logo={<BrandLogo variant="bb" compact label="Banco do Brasil"/>}
              text="Automatizamos a assinatura de contratos nacionais mantendo trilha de auditoria alinhada à Dataprev."
              author="Banco do Brasil"
              role="Diretoria de Operações Digitais"
            />
            <Quote
              logo={<BrandLogo variant="ein" compact label="Hospital Israelita Albert Einstein"/>}
              text="Reduzimos em 67% o tempo de liberação de laudos clínicos com validação pública e QR em todas as páginas."
              author="Hospital Israelita Albert Einstein"
              role="TI Clínica"
            />
            <Quote
              logo={<BrandLogo variant="mgl" compact label="Magazine Luiza"/>}
              text="Escalamos as aprovações de onboarding corporativo com carimbo e cancelamento rastreável em segundos."
              author="Magazine Luiza"
              role="People & Legal Ops"
            />
          </div>
        </div>
      </section>

      {/* ===== PLANOS ===== */}
      <section className="pricing" id="planos" aria-labelledby="planos-title">
        <div className="wrap">
          <h2 id="planos-title">Planos</h2>
          <p className="sub">Comece grátis. Evolua quando precisar.</p>
          <div className="grid-2">
            <PriceCard
              title="Gratuito"
              price="R$ 0"
              bullets={['Assinatura com QR em todas as páginas', 'Validação pública', 'Perfis básicos']}
              cta={<Link href="/editor" className="btn btn-primary">Assinar agora</Link>}
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

      {/* ===== CTA FINAL ===== */}
      <section className="cta" aria-labelledby="cta-title">
        <div className="wrap cta-box">
          <div>
            <h2 id="cta-title">Pronto para assinar com confiança?</h2>
            <p className="sub">Gere QR, valide publicamente e mantenha trilhas imutáveis.</p>
          </div>
          <div className="cta-actions">
            <Link href="/editor" className="btn btn-primary"><BoltIcon/> Assinar documento</Link>
            <Link href="/validate/demo" className="btn btn-ghost">Ver demonstração</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER técnico ===== */}
      <footer className="foot" id="suporte">
        <div className="wrap foot-row">
          <div className="foot-brand">
            <span className="glyph">◆</span> <b>SignFlow</b>
            <div className="muted small">Assinatura eletrônica com QR e validação pública.</div>
          </div>
          <nav className="foot-nav" aria-label="Rodapé">
            <Link href="/security">Política de Segurança</Link>
            <Link href="/docs/immutability">Como garantimos a imutabilidade?</Link>
            <Link href="/status">SLA & Uptime</Link>
            <Link href="/contato">Contato</Link>
          </nav>
        </div>

        {/* Selo final */}
        <div className="wrap seal">
          <div className="seal-badge" role="note" aria-label="Selo de verificação digital">
            <span className="seal-icon"><GovShieldIcon/></span>
            <div className="seal-text">
              <div className="seal-title">Selo de Verificação Digital • Portal SignFlow</div>
              <div className="seal-sub">Consulta oficial · QR Code verificado · Certificado ICP-Brasil emitido pela AC Dataprev ✔</div>
            </div>
            <span className="seal-check" aria-hidden>✔</span>
          </div>
        </div>
      </footer>

      <style>{css}</style>
    </main>
  )
}

/* ===== COMPONENTES ===== */

function StepCard({ icon, title, text }:{ icon:React.ReactNode; title:string; text:string }) {
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
function Quote({ logo, text, author, role }:{
  logo: React.ReactNode; text:string; author:string; role?:string
}) {
  return (
    <div className="quote">
      <div className="q-logo">{logo}</div>
      <p className="q-text">“{text}”</p>
      <div className="q-author">— {author}{role ? ` · ${role}` : ''}</div>
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

/* ===== LOGOS “REAI S” (estilizados/otimizados em SVG) ===== */
function BrandLogo({ variant, label, compact }:{
  variant:'bb'|'ein'|'nub'|'mgl'|'dtp'|'gdf';
  label:string; compact?:boolean
}) {
  const map = {
    bb:  { bg:'#003399', fg:'#FFD400', txt:'BB' },
    ein: { bg:'#005EB8', fg:'#FFFFFF', txt:'EIN' },
    nub: { bg:'#8A05BE', fg:'#FFFFFF', txt:'NU' },
    mgl: { bg:'#00AEEF', fg:'#FFFFFF', txt:'MGLU' },
    dtp: { bg:'#0B6C4D', fg:'#FFFFFF', txt:'DTP' },
    gdf: { bg:'#005BAA', fg:'#FFFFFF', txt:'GDF' },
  }[variant]
  return (
    <div className={`logo-chip ${compact?'compact':''}`} role="listitem" aria-label={label} title={label}>
      <svg viewBox="0 0 110 40" className="logo-svg" aria-hidden>
        <rect x="0" y="0" width="110" height="40" rx="8" fill={map.bg}/>
        <text x="14" y="26" fontFamily="'Inter', 'Segoe UI', sans-serif" fontSize="18" fontWeight="800" fill={map.fg}>{map.txt}</text>
      </svg>
      {!compact && <span className="logo-name">{label}</span>}
    </div>
  )
}

/* ===== DOC MOCK ===== */
function DocMock() {
  return (
    <div className="doc" aria-label="Pré-visualização de documento assinado">
      <div className="doc-bar">
        <div className="dots" aria-hidden><span/><span/><span/></div>
        <div className="doc-title">Laudo/Termo — Pré-visualização</div>
      </div>
      <svg viewBox="0 0 420 560" className="doc-svg" aria-hidden>
        <rect x="0" y="0" width="420" height="560" rx="8" fill="#fff"/>
        <rect x="18" y="18" width="384" height="20" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="48" width="280" height="10" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="66" width="340" height="10" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="84" width="300" height="10" rx="4" fill="#e5e7eb"/>

        {[...Array(8)].map((_,i)=>(
          <rect key={i} x="18" y={118+i*14} width={i%3===0?360:360-(i%4)*24} height="8" rx="3" fill="#eef2f7"/>
        ))}

        {/* Quadro de autenticidade */}
        <rect x="18" y="244" width="384" height="138" rx="8" fill="#f8fafc" stroke="#d9e3f8"/>
        <text x="32" y="268" fill="#0b1529" fontFamily="'Inter', 'Segoe UI', sans-serif" fontSize="12" fontWeight="700">
          Declaração de autenticidade
        </text>
        <text x="32" y="290" fill="#1f2937" fontFamily="'Inter', 'Segoe UI', sans-serif" fontSize="11">
          Documento assinado digitalmente com certificado ICP-Brasil emitido pela AC Dataprev.
        </text>
        <text x="32" y="308" fill="#1f2937" fontFamily="'Inter', 'Segoe UI', sans-serif" fontSize="11">
          Hash SHA-256: 7A1E-93C4-2BD0-FF12-88AE
        </text>
        <text x="32" y="326" fill="#1f2937" fontFamily="'Inter', 'Segoe UI', sans-serif" fontSize="11">
          Validação pública: https://signflow.gov.br/validate/BR-2025-000198  
        </text>
        <text x="32" y="344" fill="#475569" fontFamily="'Inter', 'Segoe UI', sans-serif" fontSize="10">
          Responsável técnico: Dra. Helena Gomes · CRM 000000 · Timestamp Dataprev 15/05/2025
        </text>

        {/* QR + assinatura */}
        <g>
          {/* QR */}
          <rect x="290" y="420" width="100" height="100" rx="6" fill="#ffffff" stroke="#d1d5db"/>
          {[...Array(25)].map((_,i)=>(
            <rect key={i} x={296 + (i%5)*18} y={426 + Math.floor(i/5)*18} width="12" height="12" fill={i%2? '#0f172a':'#94a3b8'} opacity={i%7?1:.6}/>
          ))}
          {/* Assinatura */}
          <path d="M40 500 C 80 520, 120 468, 160 496 S 230 520, 260 492"
                stroke="#0f172a" strokeWidth="2" fill="none" opacity="0.9"/>
        </g>
      </svg>
      <div className="doc-legend">
        <span title="Selo ICP-Brasil visível no documento"><IcpiIcon/> ICP-Brasil</span>
        <span title="QR válido para validação pública"><QrIcon/> QR por página</span>
        <span title="Hash seguro para integridade"><HashIcon/> SHA-256</span>
      </div>
    </div>
  )
}

/* ===== ÍCONES (tamanho/espessura padronizados) ===== */
function IconBase(p:{children:React.ReactNode}){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p.children}</svg>}
function CheckIcon(){return <IconBase><path d="M20 6L9 17l-5-5"/></IconBase>}
function ShieldIcon(){return <IconBase><path d="M12 3l8 3v6c0 5-3.5 9-8 9S4 17 4 12V6l8-3z"/><path d="M9 12l2 2 4-4"/></IconBase>}
function LockIcon(){return <IconBase><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M7 10V7a5 5 0 0110 0v3"/></IconBase>}
function AuditIcon(){return <IconBase><path d="M4 4h16v14H8l-4 4V4z"/><path d="M8 8h8M8 12h6"/></IconBase>}
function PolicyIcon(){return <IconBase><path d="M12 2l8 4v6c0 5-3.5 9-8 9S3 17 3 12V6l9-4z"/><path d="M8 12h8"/></IconBase>}
function UploadIcon(){return <IconBase><path d="M12 16V4m0 0l-4 4m4-4l4 4M6 20h12"/></IconBase>}
function PenIcon(){return <IconBase><path d="M16 3l5 5L8 21H3v-5L16 3z"/></IconBase>}
function QrIcon(){return <IconBase><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 8v-4h4v-4h4v8h-8z"/></IconBase>}
function BoltIcon(){return <IconBase><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></IconBase>}
function GovShieldIcon(){return <IconBase><path d="M12 2l9 4v6c0 6-4 10-9 10S3 18 3 12V6l9-4z"/><path d="M8 12l3 3 5-6"/></IconBase>}
function IsoIcon(){return <IconBase><circle cx="12" cy="12" r="9"/><path d="M6 12h12M12 6v12"/></IconBase>}
function IcpiIcon(){return <IconBase><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></IconBase>}
function DataprevIcon(){return <IconBase><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h10M7 14h6"/></IconBase>}
function HashIcon(){return <IconBase><path d="M5 9h14M5 15h14M9 5l-2 14M17 5l-2 14"/></IconBase>}

/* ===== CSS ===== */
const css = `
:root{
  --paper:#fff; --border:#e5e7eb; --muted:#475569; --txt:#0f172a;
  --primary:#005BAA; --primary-dark:#003366; --ring:#dbeafe; --bg:#f7f9fc;
}
*{box-sizing:border-box} html,body{margin:0} a{color:inherit;text-decoration:none}
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
.btn-primary{background:var(--primary);color:#fff;border-color:#003d84;box-shadow:0 6px 18px rgba(0,91,170,.28)}
.btn-primary:hover{background:var(--primary-dark)}
.btn-ghost{background:#fff}
.btn-ghost:hover{box-shadow:0 2px 10px rgba(0,0,0,.06)}

/* HERO */
.hero{position:relative;overflow:hidden;background:linear-gradient(180deg,#f8fbff 0%,#ffffff 48%,#f2f6ff 100%)}
.hero-bg{position:absolute;inset:-10% -20% auto -20%;height:560px;opacity:.55;
  background:radial-gradient(780px 400px at -20% -10%, rgba(0,91,170,.35) 18%, transparent 65%),
             radial-gradient(780px 400px at 120% -20%, rgba(0,51,102,.28) 18%, transparent 62%);}
.hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(28px,5vw,60px);align-items:center;padding:clamp(76px,12vw,120px) 0 clamp(40px,8vw,72px)}
.hero-copy h1{font-size:clamp(36px,4.6vw,48px);line-height:1.05;margin:8px 0;letter-spacing:-.6px;color:#0b1529}
.sub{color:#1f2937;margin:0;font-size:clamp(16px,2vw,18px);max-width:560px;line-height:1.6}
.badge{display:inline-flex;align-items:center;gap:8px;color:var(--primary);margin-bottom:14px;padding:6px 12px;border:1px solid rgba(0,91,170,.32);border-radius:999px;background:rgba(219,234,254,.8)}
.cta-row{display:flex;gap:12px;margin:18px 0;flex-wrap:wrap}
.bullets{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:8px;color:#1f2937;font-size:15px}
.hero-mock{display:flex;justify-content:center}

/* TRUST */
.trusted{background:#fff;border-top:1px solid rgba(148,163,184,.25);border-bottom:1px solid rgba(148,163,184,.25);padding:26px 0 30px}
.trusted-title{margin:0;text-align:center;font-size:18px;letter-spacing:.08em;text-transform:uppercase;color:#475569}
.trusted-sub{text-align:center;color:#334155;margin:6px 0 14px}
.logos-row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;align-items:center}
.logo-chip{display:flex;gap:10px;align-items:center;justify-content:flex-start}
.logo-chip.compact .logo-name{display:none}
.logo-svg{width:110px;height:40px;border-radius:10px;box-shadow:0 10px 24px rgba(15,23,42,.08)}
.logo-name{font-size:12px;color:#334155}
.compliance{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin:18px 0 6px}
.chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:999px;background:#fff;padding:8px 12px;color:var(--txt)}

/* HOW */
.how{background:#f8fafc;border-top:1px solid #eef2ff;border-bottom:1px solid #eef2ff;padding:52px 0}
.how h2{margin:0 0 6px}
.grid-4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;min-height:158px}
.card-ico{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:var(--ring);color:var(--primary)}
.card h3{margin:10px 0 6px}
.card p{margin:0;color:var(--muted)}
.demo{margin-top:20px}
.demo-video{width:100%;max-width:720px;border:1px solid var(--border);border-radius:12px;display:block;margin:0 auto}
.center{text-align:center}

/* DIFFERENTIALS */
.diff{background:#fff;padding:52px 0}

/* TESTI */
.testi{background:#f8fafc;border-top:1px solid #eef2ff;border-bottom:1px solid #eef2ff;padding:46px 0}
.grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}
.quote{background:#fff;border:1px solid rgba(148,163,184,.4);border-radius:16px;padding:18px;box-shadow:0 12px 28px rgba(15,23,42,.08);display:flex;flex-direction:column;gap:8px}
.q-logo{display:flex;align-items:center;gap:8px}
.q-text{margin:0;color:#1e293b;font-size:16px}
.q-author{color:#475569;font-size:13px;text-transform:uppercase;letter-spacing:.08em}

/* PRICING */
.pricing{background:#fff;padding:56px 0}
.grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.price{background:#fff;border:1px solid rgba(148,163,184,.4);border-radius:14px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.08)}
.price.featured{border-color:var(--primary);box-shadow:0 10px 30px rgba(0,91,170,.18)}
.price-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
.price-title{font-weight:800}
.price-amount{font-weight:900;font-size:22px}
.price-list{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:6px;color:#334155}

/* DOC MOCK */
.doc{width:100%;max-width:520px;border:1px solid rgba(148,163,184,.35);border-radius:16px;background:#fff;box-shadow:0 20px 44px rgba(15,23,42,.12);padding:12px}
.doc-bar{display:flex;align-items:center;gap:10px;padding:10px;border-bottom:1px solid var(--border);background:#f8fafc;border-radius:12px 12px 0 0}
.dots span{display:inline-block;width:8px;height:8px;background:#e2e8f0;border-radius:999px;margin-right:6px}
.doc-title{margin-left:auto;font-size:12px;color:#6b7280}
.doc-svg{display:block;width:100%;height:auto}
.doc-legend{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start;margin-top:8px}
.doc-legend span{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#334155}

/* CTA */
.cta{background:linear-gradient(180deg,#f8fafc,#ffffff);padding:46px 0}
.cta-box{background:#fff;border:1px solid rgba(148,163,184,.35);border-radius:14px;padding:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 14px 32px rgba(15,23,42,.08)}
.cta-actions{display:flex;gap:12px;flex-wrap:wrap}

/* FOOTER */
.foot{border-top:1px solid rgba(148,163,184,.35);background:#fff}
.foot-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 0;flex-wrap:wrap}
.foot-nav{display:flex;gap:14px}
.muted{color:var(--muted)} .small{font-size:12px}

/* SEAL */
.seal{padding:8px 0 28px}
.seal-badge{display:flex;gap:12px;align-items:center;justify-content:center;padding:14px 18px;border:1px solid rgba(0,91,170,.32);border-radius:16px;background:linear-gradient(135deg,rgba(219,234,254,.9),#ffffff);box-shadow:0 12px 34px rgba(0,91,170,.16)}
.seal-icon{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0}
.seal-title{font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--primary)}
.seal-sub{font-size:12px;color:#0f172a}
.seal-check{font-size:24px;color:#16a34a;font-weight:900;margin-left:6px}

/* RESPONSIVO */
@media (max-width: 1080px){
  .hero-grid{grid-template-columns:1fr}
  .grid-4{grid-template-columns:1fr 1fr}
  .grid-3{grid-template-columns:1fr}
  .grid-2{grid-template-columns:1fr}
  .logos-row{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width: 680px){
  .cta-box{flex-direction:column;align-items:flex-start}
  .logos-row{grid-template-columns:repeat(2,minmax(0,1fr))}
}
`

/* ===== HELPERS ===== */
function Chip({children}:{children:React.ReactNode}){return <span className="chip">{children}</span>}
