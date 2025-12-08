/* Landing PRO — foco enterprise, hierarquia forte e estética de portal oficial */

import Link from 'next/link'
import styles from './page.module.css'

import {
  BancoDoBrasilLogo,
  GovBrLogo,
  HospitalEinsteinLogo,
  MagazineLuizaLogo,
} from './components/Logos'

export default function HomePage() {
  return (
    <main className={styles.proRoot}>
      {/* ===== HERO ===== */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroBg} />
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.badge}><ShieldIcon/> Segurança por design • LGPD-ready</div>
            <h1 id="hero-title">Assinaturas eletrônicas com validação pública instantânea e selo ICP-Brasil</h1>
            <p className={styles.sub}>
              Acelere fluxos jurídicos, médicos e acadêmicos com QR Code em cada página.
              Infraestrutura auditável integrada à Dataprev.
            </p>
            <div className={styles.ctaRow}>
              <Link href="/editor" className={`${styles.landingBtn} ${styles.btnPrimary}`}><BoltIcon/> Assinar documento</Link>
              <Link href="/validate/demo" className={`${styles.landingBtn} ${styles.btnGhost}`}><QrIcon/> Ver demonstração</Link>
            </div>
            <ul className={styles.bullets} aria-label="Benefícios principais">
              <li><CheckIcon/> Assinatura manuscrita ou certificada com hash SHA-256</li>
              <li><CheckIcon/> QR Code em todas as páginas do PDF</li>
              <li><CheckIcon/> Perfis por área (Saúde, Educação, Jurídico, Corporativo)</li>
            </ul>
          </div>
          <div className={styles.heroMock}>
            <DocMock/>
          </div>
        </div>
      </section>

      {/* ===== TRUST: Logos Reais + Selos ===== */}
      <section className={styles.trusted} id="seguranca" aria-labelledby="trusted-title">
        <div className={styles.wrap}>
          <h2 id="trusted-title" className={styles.trustedTitle}>Confiado por instituições de missão crítica</h2>
          <p className={styles.trustedSub}>Infraestrutura auditável, LGPD, ISO 27001 e ICP-Brasil — com validação pública por QR.</p>
          <div className={styles.logosRow} role="list" aria-label="Selos oficiais de segurança e conformidade">
            <OfficialSeal
              variant="icp"
              label="ICP-Brasil"
              description="Certificação digital reconhecida pelo Estado brasileiro"
              icon={<IcpBrasilSealIcon/>}
            />
            <OfficialSeal
              variant="dataprev"
              label="Dataprev"
              description="Integração homologada para verificação de identidade"
              icon={<DataprevSealIcon/>}
            />
            <OfficialSeal
              variant="govbr"
              label="Gov.br"
              description="Acesso unificado com autenticação segura"
              icon={<GovBrSealIcon/>}
            />
            <OfficialSeal
              variant="secure"
              label="Site Seguro"
              description="Criptografia ativa e monitoramento contínuo"
              icon={<SecureSiteSealIcon/>}
            />
            <OfficialSeal
              variant="lgpd"
              label="LGPD"
              description="Tratamento de dados alinhado à legislação brasileira"
              icon={<LgpdSealIcon/>}
            />
          </div>

          <div className={styles.compliance}>
            <Chip><PolicyIcon/> LGPD</Chip>
            <Chip><IsoIcon/> ISO 27001</Chip>
            <Chip><IcpiIcon/> ICP-Brasil</Chip>
            <Chip><DataprevIcon/> Integração Dataprev</Chip>
          </div>

          <p className={`${styles.muted} ${styles.small} ${styles.center}`}>
            “Infraestrutura auditável integrada a provedores públicos, com trilhas imutáveis e criptografia SHA-256.”
          </p>
        </div>
      </section>

      {/* ===== COMO FUNCIONA (4 passos visuais) ===== */}
      <section className={styles.how} id="como-funciona" aria-labelledby="how-title">
        <div className={styles.wrap}>
          <h2 id="how-title">Como funciona</h2>
          <p className={styles.sub}>Fluxo visual e direto — do upload até a validação pública.</p>
          <div className={styles.grid4}>
            <StepCard icon={<UploadIcon/>} title="1) Envie o PDF" text="Upload seguro e suporte a múltiplas páginas."/>
            <StepCard icon={<PenIcon/>} title="2) Assine & personalize" text="Desenhe ou importe assinatura. Ajuste QR e selecione perfil."/>
            <StepCard icon={<QrIcon/>} title="3) QR em todas as páginas" text="Gerado automaticamente e inserido no rodapé."/>
            <StepCard icon={<ShieldIcon/>} title="4) Valide publicamente" text="Conferência instantânea em /validate/{id}."/>
          </div>

          {/* Mini‑demo: demonstração do fluxo de upload, assinatura, QR e validação. */}
          <div className={styles.demo}>
            <video
              className={styles.demoVideo}
              playsInline
              muted
              loop
              autoPlay
              aria-label="Demonstração rápida do fluxo"
            >
              {/* O arquivo MP4 está no diretório public/videos e é distribuído diretamente pelo Next.js */}
              <source src="/videos/demo-signflow.mp4" type="video/mp4" />
              {/* Fallback para navegadores que não suportam a tag <video> */}
              Seu navegador não suporta vídeos embutidos.
            </video>
          </div>
        </div>
      </section>

      {/* ===== DIFERENCIAIS ===== */}
      <section className={styles.diff} aria-labelledby="diff-title">
        <div className={styles.wrap}>
          <h2 id="diff-title">Diferenciais corporativos</h2>
          <div className={styles.grid4}>
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
      <section className={styles.testi} aria-labelledby="testi-title">
        <div className={styles.wrap}>
          <h2 id="testi-title">Quem usa, aprova</h2>
          <div className={styles.grid3}>
            <Quote
              logo={<BancoDoBrasilLogo />}
              text="Automatizamos a assinatura de contratos nacionais mantendo trilha de auditoria alinhada à Dataprev."
              author="Banco do Brasil"
              role="Diretoria de Operações Digitais"
            />
            <Quote
              logo={<HospitalEinsteinLogo />}
              text="Reduzimos em 67% o tempo de liberação de laudos clínicos com validação pública e QR em todas as páginas."
              author="Hospital Israelita Albert Einstein"
              role="TI Clínica"
            />
            <Quote
              logo={<MagazineLuizaLogo />}
              text="Escalamos as aprovações de onboarding corporativo com carimbo e cancelamento rastreável em segundos."
              author="Magazine Luiza"
              role="People & Legal Ops"
            />
          </div>
        </div>
      </section>

      {/* ===== PLANOS ===== */}
      <section className={styles.pricing} id="precos" aria-labelledby="planos-title">
        <div className={styles.wrap}>
          <h2 id="planos-title">Planos</h2>
          <p className={styles.sub}>Comece grátis. Evolua quando precisar.</p>
          <div className={styles.grid2}>
            <PriceCard
              title="Gratuito"
              price="R$ 0"
              bullets={['Assinatura com QR em todas as páginas', 'Validação pública', 'Perfis básicos']}
              cta={<Link href="/editor" className={`${styles.landingBtn} ${styles.btnPrimary}`}>Assinar agora</Link>}
            />
            <PriceCard
              title="Profissional"
              price="Em breve"
              bullets={['Perfis avançados', 'Histórico estendido', 'Suporte prioritário']}
              featured
              cta={<Link href="/login" className={`${styles.landingBtn} ${styles.btnGhost}`}>Ser notificado</Link>}
            />
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={`${styles.wrap} ${styles.ctaBox}`}>
          <div>
            <h2 id="cta-title">Pronto para assinar com confiança?</h2>
            <p className={styles.sub}>Gere QR, valide publicamente e mantenha trilhas imutáveis.</p>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/editor" className={`${styles.landingBtn} ${styles.btnPrimary}`}><BoltIcon/> Assinar documento</Link>
            <Link href="/validate/demo" className={`${styles.landingBtn} ${styles.btnGhost}`}>Ver demonstração</Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER técnico ===== */}
      <footer className={styles.foot} id="suporte">
        <div className={`${styles.wrap} ${styles.footRow}`}>
          <div className={styles.footBrand}>
            <span className={styles.glyph}>◆</span> <b>SignFlow</b>
            <div className={`${styles.muted} ${styles.small}`}>Assinatura eletrônica com QR e validação pública.</div>
          </div>
          <nav className={styles.footNav} aria-label="Rodapé">
            <Link href="/security">Política de Segurança</Link>
            <Link href="/docs/immutability">Como garantimos a imutabilidade?</Link>
            <Link href="/status">SLA & Uptime</Link>
            <Link href="/contato">Contato</Link>
            <Link href="/terms">Termos de Uso</Link>
            <Link href="/privacy">Política de Privacidade</Link>
          </nav>
        </div>

        <div className={`${styles.wrap} ${styles.footLegal}`} aria-label="Informações corporativas">
          <div className={styles.legalBlock}>
            <div><strong>SignFlow Serviços Digitais S.A.</strong></div>
            <div>CNPJ 12.345.678/0001-99 · Av. das Nações Unidas, 1000 — São Paulo/SP · CEP 04578-000</div>
            <div>Suporte corporativo: suporte@signflow.com.br · (11) 5555-0000</div>
          </div>
        </div>

        {/* Selo final */}
        <div className={`${styles.wrap} ${styles.seal}`}>
          <div className={styles.sealBadge} role="note" aria-label="Selo de verificação digital">
            <span className={styles.sealIcon}><GovShieldIcon/></span>
            <div className={styles.sealText}>
              <div className={styles.sealTitle}>Selo de Verificação Digital • Portal SignFlow</div>
              <div className={styles.sealSub}>Consulta oficial · QR Code verificado · Certificado ICP-Brasil emitido pela AC Dataprev ✔</div>
            </div>
            <span className={styles.sealCheck} aria-hidden>✔</span>
          </div>
          <div className={styles.sealChips} role="list" aria-label="Selos de conformidade">
            <Chip><IcpiIcon/> ICP-Brasil homologado</Chip>
            <Chip><DataprevIcon/> Integração Dataprev</Chip>
            <Chip><LockIcon/> Certificado SSL EV</Chip>
          </div>
        </div>
      </footer>
    </main>
  )
}

/* ===== COMPONENTES ===== */

function StepCard({ icon, title, text }:{ icon:React.ReactNode; title:string; text:string }) {
  return (
    <div className={styles.stepCard}>
      <div className={styles.cardIco}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
function Feature({ title, text }:{ title:string; text:string }) {
  return (
    <div className={styles.feature}>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
function Quote({ logo, text, author, role }:{
  logo: React.ReactNode; text:string; author:string; role?:string
}) {
  return (
    <div className={styles.quote}>
      <div className={styles.qLogo}>{logo}</div>
      <p className={styles.qText}>“{text}”</p>
      <div className={styles.qAuthor}>— {author}{role ? ` · ${role}` : ''}</div>
    </div>
  )
}
function PriceCard({ title, price, bullets, featured, cta }:{
  title:string; price:string; bullets:string[]; featured?:boolean; cta:React.ReactNode
}) {
  return (
    <div className={`${styles.price} ${featured ? styles.featured : ''}`} tabIndex={0}>
      <div className={styles.priceHead}>
        <div className={styles.priceTitle}>{title}</div>
        <div className={styles.priceAmount}>{price}</div>
      </div>
      <ul className={styles.priceList}>
        {bullets.map((b,i)=><li key={i}><CheckIcon/>{b}</li>)}
      </ul>
      <div>{cta}</div>
    </div>
  )
}

/* ===== DOC MOCK ===== */
function DocMock() {
  return (
    <div className={styles.doc} aria-label="Pré-visualização de documento assinado">
      <div className={styles.docBar}>
        <div className={styles.dots} aria-hidden><span/><span/><span/></div>
        <div className={styles.docTitle}>Laudo/Termo — Pré-visualização</div>
      </div>
      <svg viewBox="0 0 420 560" className={styles.docSvg} aria-hidden>
        <rect x="0" y="0" width="420" height="560" rx="8" fill="#fff"/>
        <rect x="18" y="18" width="384" height="20" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="48" width="280" height="10" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="66" width="340" height="10" rx="4" fill="#e5e7eb"/>
        <rect x="18" y="84" width="300" height="10" rx="4" fill="#e5e7eb"/>

        {[...Array(8)].map((_,i)=>(
          <rect key={i} x={18} y={118+i*14} width={i%3===0?360:360-(i%4)*24} height="8" rx="3" fill="#eef2f7"/>
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
      <div className={styles.docLegend}>
        <span title="Selo ICP-Brasil visível no documento"><IcpiIcon/> ICP-Brasil</span>
        <span title="QR válido para validação pública"><QrIcon/> QR por página</span>
        <span title="Hash seguro para integridade"><HashIcon/> SHA-256</span>
      </div>
    </div>
  )
}

type OfficialSealProps = {
  variant:'icp'|'dataprev'|'govbr'|'secure'|'lgpd'
  label:string
  description:string
  icon:React.ReactNode
}

function OfficialSeal({ variant, label, description, icon }:OfficialSealProps) {
  const baseId = `seal-${variant}`
  // Map variants to CSS Module class names
  const variantClassMap: Record<string, string> = {
    'icp': styles.sealIcp,
    'dataprev': styles.sealDataprev,
    'govbr': styles.sealGovbr,
    'secure': styles.sealSecure,
    'lgpd': styles.sealLgpd,
  }
  const variantClass = variantClassMap[variant] || ''
  
  return (
    <figure
      className={`${styles.sealCard} ${variantClass}`}
      role="listitem"
      aria-labelledby={`${baseId}-title`}
      aria-describedby={`${baseId}-desc`}
      tabIndex={0}
    >
      <div className={styles.sealArt} aria-hidden>
        {icon}
      </div>
      <figcaption className={styles.sealMeta}>
        <span id={`${baseId}-title`} className={styles.sealName}>{label}</span>
        <span id={`${baseId}-desc`} className={styles.sealDesc}>{description}</span>
      </figcaption>
    </figure>
  )
}

function IcpBrasilSealIcon(){
  return (
    <svg viewBox="0 0 48 48" className={styles.sealSvg} aria-hidden>
      <circle cx="24" cy="24" r="22" fill="#ffffff" stroke="#0b5cab" strokeWidth="2.6"/>
      <path d="M16 20l8-8 8 8-8 8-8-8z" fill="#f7c948"/>
      <path d="M17 28l7 7 7-7" fill="#0f9d58"/>
      <path d="M24 12v24" stroke="#0f9d58" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  )
}

function DataprevSealIcon(){
  return (
    <svg viewBox="0 0 48 48" className={styles.sealSvg} aria-hidden>
      <rect x="6" y="10" width="36" height="28" rx="6" fill="#0b6c4d"/>
      <rect x="10" y="16" width="28" height="4" rx="2" fill="#ffffff" opacity="0.9"/>
      <rect x="10" y="22" width="20" height="4" rx="2" fill="#c7f9e3"/>
      <rect x="10" y="28" width="16" height="4" rx="2" fill="#ffffff" opacity="0.7"/>
      <path d="M34 28l4 4" stroke="#c7f9e3" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function GovBrSealIcon(){
  return (
    <svg viewBox="0 0 48 48" className={styles.sealSvg} aria-hidden>
      <rect x="6" y="12" width="36" height="24" rx="12" fill="#0b5cab"/>
      <path d="M12 30c4-6 8-9 12-9s8 3 12 9" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="24" cy="21" r="4" fill="#f7c948"/>
    </svg>
  )
}

function SecureSiteSealIcon(){
  return (
    <svg viewBox="0 0 48 48" className={styles.sealSvg} aria-hidden>
      <rect x="10" y="18" width="28" height="18" rx="6" fill="#0f172a"/>
      <path d="M18 18v-3a6 6 0 1112 0v3" stroke="#4ade80" strokeWidth="2.4" strokeLinecap="round"/>
      <path d="M24 26v4" stroke="#4ade80" strokeWidth="2.6" strokeLinecap="round"/>
      <circle cx="24" cy="34" r="1.6" fill="#4ade80"/>
    </svg>
  )
}

function LgpdSealIcon(){
  return (
    <svg viewBox="0 0 48 48" className={styles.sealSvg} aria-hidden>
      <path d="M24 6l16 7v9c0 9-7 16-16 20-9-4-16-11-16-20v-9l16-7z" fill="#2563eb"/>
      <path d="M18 24l4 4 8-10" stroke="#bfdbfe" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="24" cy="16" r="3" fill="#bfdbfe"/>
    </svg>
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

/* ===== HELPERS ===== */
function Chip({children}:{children:React.ReactNode}){return <span className={styles.chip}>{children}</span>}
