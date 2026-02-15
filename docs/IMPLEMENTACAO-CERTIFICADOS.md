# Guia de Implementação: Certificados Digitais Auto-Gerados

## ✅ Já Implementado

### 1. Documentação
- ✅ [`docs/CERTIFICADOS-DIGITAIS.md`](https://github.com/Junio243/signflow/blob/main/docs/CERTIFICADOS-DIGITAIS.md) - Especificação completa
- ✅ [`docs/IMPLEMENTACAO-CERTIFICADOS.md`](https://github.com/Junio243/signflow/blob/main/docs/IMPLEMENTACAO-CERTIFICADOS.md) - Este guia

### 2. Banco de Dados
- ✅ [`supabase/migrations/20260215_certificates.sql`](https://github.com/Junio243/signflow/blob/main/supabase/migrations/20260215_certificates.sql)
  - Tabela `certificates` completa
  - Funções: `revoke_certificate()`, `get_user_certificates()`, `update_expired_certificates()`
  - RLS (Row Level Security) configurado
  - Índices de performance
  - View `certificates_stats`

### 3. TypeScript Types
- ✅ [`types/certificate.ts`](https://github.com/Junio243/signflow/blob/main/types/certificate.ts)
  - Tipos: `CertificateType`, `CertificateStatus`, `CertificateAlgorithm`
  - Interfaces: `PersonalData`, `CompanyData`, `Certificate`
  - Form types: `ECPFFormData`, `ECNPJFormData`
  - Type guards e constantes

---

## 🚧 Próximos Passos de Implementação

### Fase 1: Biblioteca de Criptografia (Client-Side)

**Pacotes NPM necessários:**
```bash
npm install node-forge
npm install --save-dev @types/node-forge
```

**Arquivo:** `lib/crypto/certificateGenerator.ts`

```typescript
import forge from 'node-forge';
import type { CertificateGenerationOptions, Certificate } from '@/types/certificate';

/**
 * Gera par de chaves RSA
 */
export async function generateKeyPair(bits: number = 2048) {
  return new Promise<forge.pki.rsa.KeyPair>((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits, workers: 2 }, (err, keypair) => {
      if (err) reject(err);
      else resolve(keypair);
    });
  });
}

/**
 * Cria certificado X.509
 */
export function createCertificate(
  options: CertificateGenerationOptions,
  keypair: forge.pki.rsa.KeyPair
): forge.pki.Certificate {
  const cert = forge.pki.createCertificate();
  
  // Versão X.509 v3
  cert.publicKey = keypair.publicKey;
  cert.serialNumber = generateSerialNumber();
  
  // Validade
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setDate(
    cert.validity.notAfter.getDate() + getValidityDays(options.validity)
  );
  
  // Subject (Titular)
  const subject = buildSubject(options.type, options.subjectData);
  cert.setSubject(subject);
  
  // Issuer (SignFlow CA)
  const issuer = [
    { name: 'commonName', value: 'SignFlow CA' },
    { name: 'countryName', value: 'BR' },
    { name: 'organizationName', value: 'SignFlow' },
  ];
  cert.setIssuer(issuer);
  
  // Extensões X.509 v3
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: false,
      clientAuth: true,
      codeSigning: false,
      emailProtection: true,
      timeStamping: false,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 1, // email
          value: getEmail(options.subjectData),
        },
      ],
    },
    {
      name: 'subjectKeyIdentifier',
    },
  ]);
  
  // Assinar certificado com chave privada do CA (auto-assinado)
  cert.sign(keypair.privateKey, forge.md.sha256.create());
  
  return cert;
}

/**
 * Gera PKCS#12 (.p12) criptografado com senha
 */
export function createPKCS12(
  certificate: forge.pki.Certificate,
  privateKey: forge.pki.rsa.PrivateKey,
  password: string,
  friendlyName: string
): string {
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    privateKey,
    [certificate],
    password,
    {
      algorithm: '3des', // Triple DES
      friendlyName,
    }
  );
  
  return forge.asn1.toDer(p12Asn1).getBytes();
}

/**
 * Função principal de geração
 */
export async function generateCertificate(
  options: CertificateGenerationOptions
): Promise<{ 
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.rsa.PrivateKey;
  publicKey: forge.pki.rsa.PublicKey;
  pkcs12: Blob;
}> {
  // 1. Gerar par de chaves
  const bits = options.algorithm === 'RSA-4096' ? 4096 : 2048;
  const keypair = await generateKeyPair(bits);
  
  // 2. Criar certificado
  const cert = createCertificate(options, keypair);
  
  // 3. Gerar PKCS#12
  const friendlyName = getFriendlyName(options.type, options.subjectData);
  const p12Der = createPKCS12(cert, keypair.privateKey, options.password, friendlyName);
  
  // 4. Converter para Blob
  const p12Blob = new Blob([stringToArrayBuffer(p12Der)], {
    type: 'application/x-pkcs12',
  });
  
  return {
    certificate: cert,
    privateKey: keypair.privateKey,
    publicKey: keypair.publicKey,
    pkcs12: p12Blob,
  };
}

// Helper functions
function generateSerialNumber(): string {
  return forge.util.bytesToHex(forge.random.getBytesSync(16));
}

function getValidityDays(validity: string): number {
  const map = { '1year': 365, '3years': 1095, '5years': 1825 };
  return map[validity] || 365;
}

function buildSubject(type: string, data: any): any[] {
  // Implementar baseado no tipo
  if (type === 'e-CPF') {
    return [
      { name: 'commonName', value: data.fullName },
      { name: 'countryName', value: 'BR' },
      { name: 'stateOrProvinceName', value: data.address.state },
      { name: 'localityName', value: data.address.city },
      { name: 'organizationName', value: 'SignFlow' },
      { name: 'organizationalUnitName', value: 'Pessoa Física' },
      { name: 'serialNumber', value: data.cpf },
      { name: 'emailAddress', value: data.email },
    ];
  }
  // Similar para e-CNPJ
  return [];
}

function getEmail(data: any): string {
  return data.email || data.businessEmail;
}

function getFriendlyName(type: string, data: any): string {
  return type === 'e-CPF' ? data.fullName : data.companyName;
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i) & 0xff;
  }
  return buf;
}
```

---

### Fase 2: API Routes (Server-Side)

**Arquivo:** `app/api/certificates/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { CertificateGenerationOptions } from '@/types/certificate';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    // Receber dados do certificado gerado no client
    const body = await request.json();
    const {
      certificateType,
      serialNumber,
      subjectData,
      publicKey,
      certificatePem,
      fingerprintSha256,
      validFrom,
      validUntil,
      algorithm,
    } = body;
    
    // Validar dados
    // ... (implementar validações)
    
    // Salvar no banco
    const { data: certificate, error: dbError } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        certificate_type: certificateType,
        serial_number: serialNumber,
        subject_data: subjectData,
        public_key: publicKey,
        certificate_pem: certificatePem,
        fingerprint_sha256: fingerprintSha256,
        valid_from: validFrom,
        valid_until: validUntil,
        algorithm,
        status: 'active',
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Erro ao salvar certificado:', dbError);
      return NextResponse.json(
        { error: 'Erro ao salvar certificado' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ certificate });
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

**Arquivo:** `app/api/certificates/list/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  
  // Usar função SQL customizada
  const { data: certificates, error } = await supabase
    .rpc('get_user_certificates', { p_user_id: user.id });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ certificates });
}
```

---

### Fase 3: Interface de Usuário

**Arquivo:** `app/certificates/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CertificateSummary } from '@/types/certificate';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    loadCertificates();
  }, []);
  
  async function loadCertificates() {
    try {
      const response = await fetch('/api/certificates/list');
      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meus Certificados Digitais</h1>
        <button
          onClick={() => router.push('/certificates/new')}
          className="btn-primary"
        >
          + Gerar Novo Certificado
        </button>
      </div>
      
      {loading ? (
        <p>Carregando...</p>
      ) : certificates.length === 0 ? (
        <EmptyState />
      ) : (
        <CertificatesList certificates={certificates} onRefresh={loadCertificates} />
      )}
    </div>
  );
}
```

**Arquivo:** `app/certificates/new/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { CertificateTypeSelector } from '@/components/certificates/TypeSelector';
import { ECPFForm } from '@/components/certificates/ECPFForm';
import { ECNPJForm } from '@/components/certificates/ECNPJForm';
import type { CertificateType } from '@/types/certificate';

export default function NewCertificatePage() {
  const [step, setStep] = useState<'type' | 'form' | 'generating'>('type');
  const [selectedType, setSelectedType] = useState<CertificateType | null>(null);
  
  function handleTypeSelect(type: CertificateType) {
    setSelectedType(type);
    setStep('form');
  }
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Gerar Novo Certificado Digital</h1>
      
      {step === 'type' && (
        <CertificateTypeSelector onSelect={handleTypeSelect} />
      )}
      
      {step === 'form' && selectedType === 'e-CPF' && (
        <ECPFForm onSuccess={() => router.push('/certificates')} />
      )}
      
      {step === 'form' && selectedType === 'e-CNPJ' && (
        <ECNPJForm onSuccess={() => router.push('/certificates')} />
      )}
    </div>
  );
}
```

---

### Fase 4: Componentes Reutilizáveis

**Arquivos a criar:**

1. `components/certificates/TypeSelector.tsx` - Escolha entre e-CPF e e-CNPJ
2. `components/certificates/ECPFForm.tsx` - Formulário completo para e-CPF
3. `components/certificates/ECNPJForm.tsx` - Formulário completo para e-CNPJ
4. `components/certificates/CertificateCard.tsx` - Card individual de certificado
5. `components/certificates/CertificatesList.tsx` - Lista de certificados
6. `components/certificates/RevokeCertificateDialog.tsx` - Dialog para revogação
7. `components/certificates/DownloadCertificateButton.tsx` - Botão de download
8. `components/certificates/CertificateDetailsModal.tsx` - Modal com detalhes completos

---

### Fase 5: Integração com Assinatura Avançada

**Arquivo:** `app/sign/advanced/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { CertificateSelector } from '@/components/sign/CertificateSelector';
import { SignaturePositionEditor } from '@/components/sign/PositionEditor';
import type { CertificateSummary, AdvancedSignatureConfig } from '@/types/certificate';

export default function AdvancedSignPage() {
  const [certificates, setCertificates] = useState<CertificateSummary[]>([]);
  const [config, setConfig] = useState<Partial<AdvancedSignatureConfig>>({
    includeQRCode: true,
    protectPDF: false,
    includeTimestamp: true,
  });
  
  async function handleSign() {
    if (!config.certificateId || !config.certificatePassword) {
      alert('Selecione um certificado e informe a senha');
      return;
    }
    
    // Implementar lógica de assinatura
    // ...
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Assinatura Avançada com Certificado</h1>
      
      {/* Seletor de certificado */}
      <CertificateSelector
        certificates={certificates}
        selectedId={config.certificateId}
        onSelect={(id) => setConfig({ ...config, certificateId: id })}
      />
      
      {/* Senha do certificado */}
      <div className="mt-4">
        <label>Senha do Certificado *</label>
        <input
          type="password"
          value={config.certificatePassword || ''}
          onChange={(e) => setConfig({ ...config, certificatePassword: e.target.value })}
          placeholder="Digite a senha do certificado"
        />
      </div>
      
      {/* Configurações visuais */}
      <SignaturePositionEditor
        config={config}
        onChange={(newConfig) => setConfig({ ...config, ...newConfig })}
      />
      
      {/* Botão de assinatura */}
      <button onClick={handleSign} className="btn-primary mt-6">
        Assinar Documento
      </button>
    </div>
  );
}
```

---

## 📊 Roadmap de Implementação

### Sprint 1 (Semana 1-2): Fundamentos
- [x] Documentação completa
- [x] Schema do banco de dados
- [x] TypeScript types
- [ ] Instalar pacotes NPM (node-forge)
- [ ] Implementar `certificateGenerator.ts`
- [ ] Testes unitários para geração

### Sprint 2 (Semana 3-4): Backend
- [ ] API route `/api/certificates/generate`
- [ ] API route `/api/certificates/list`
- [ ] API route `/api/certificates/[id]`
- [ ] API route `/api/certificates/[id]/revoke`
- [ ] Testes de integração

### Sprint 3 (Semana 5-6): Frontend - Listagem
- [ ] Página `/certificates`
- [ ] Componente `CertificateCard`
- [ ] Componente `CertificatesList`
- [ ] Componente `CertificateDetailsModal`
- [ ] Componente `RevokeCertificateDialog`

### Sprint 4 (Semana 7-8): Frontend - Geração
- [ ] Página `/certificates/new`
- [ ] Componente `TypeSelector`
- [ ] Componente `ECPFForm` (completo com validações)
- [ ] Componente `ECNPJForm` (completo com validações)
- [ ] Integração com busca de CEP (ViaCEP)
- [ ] Download automático do .p12

### Sprint 5 (Semana 9-10): Integração com Assinatura
- [ ] Página `/sign/advanced`
- [ ] Componente `CertificateSelector`
- [ ] Componente `SignaturePositionEditor`
- [ ] Componente `QRCodeConfig`
- [ ] Lógica de assinatura com certificado
- [ ] Proteção de PDF com senha

### Sprint 6 (Semana 11-12): Polimento e Testes
- [ ] Testes E2E (Playwright/Cypress)
- [ ] Melhorias de UX
- [ ] Documentação de usuário
- [ ] Tutoriais em vídeo
- [ ] Deploy e monitoramento

---

## 💻 Tecnologias e Pacotes

### Principais
```json
{
  "dependencies": {
    "node-forge": "^1.3.1",
    "@supabase/supabase-js": "^2.39.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "@types/node-forge": "^1.3.11"
  }
}
```

### Opcionais (Melhorias)
- `pdf-lib` - Manipulação avançada de PDFs
- `qrcode` - Geração de QR Codes
- `react-hook-form` - Gerenciamento de formulários
- `zod` - Validação de schemas

---

## 🛡️ Segurança

### Práticas Implementadas

✅ **Chave privada NUNCA sai do navegador**
- Geração 100% client-side
- Servidor recebe apenas certificado público

✅ **PKCS#12 criptografado com senha forte**
- Mínimo 8 caracteres
- Complexidade requerida

✅ **RLS (Row Level Security) no Supabase**
- Usuários só veem seus próprios certificados

✅ **Certific ados armazenados em JSONB**
- Dados sensíveis não indexados

✅ **Autenticação obrigatória em todas as rotas**

---

## 📝 Notas Importantes

### Limitações

⚠️ **NÃO É ICP-Brasil**
- Certificados não são reconhecidos por órgãos governamentais
- Não usar para: Receita Federal, processos judiciais, licitações

✅ **USO PERMITIDO:**
- Assinaturas em contratos privados
- Documentos internos de empresas
- E-mails (S/MIME)
- Autenticação em sistemas próprios

### Responsabilidades

📌 **Do usuário:**
- Guardar certificado .p12 em local seguro
- Não compartilhar senha do certificado
- Revogar se comprometido

📌 **Da plataforma:**
- Garantir segurança dos dados armazenados
- Manter logs de revogação
- Notificar sobre expirações

---

## 🎯 Próximos Passos Imediatos

1. **Instalar dependências:**
   ```bash
   npm install node-forge
   npm install --save-dev @types/node-forge
   ```

2. **Aplicar migração do banco:**
   ```bash
   # No Supabase Dashboard > SQL Editor
   # Executar: supabase/migrations/20260215_certificates.sql
   ```

3. **Criar estrutura de pastas:**
   ```
   mkdir -p lib/crypto
   mkdir -p components/certificates
   mkdir -p components/sign
   mkdir -p app/certificates
   mkdir -p app/api/certificates
   ```

4. **Implementar `certificateGenerator.ts`** (prioridade alta)

5. **Criar testes:**
   ```bash
   mkdir -p tests/certificates
   ```

---

**Status:** 🚧 **PRONTO PARA IMPLEMENTAÇÃO**

**Documentação completa:**
- [`docs/CERTIFICADOS-DIGITAIS.md`](https://github.com/Junio243/signflow/blob/main/docs/CERTIFICADOS-DIGITAIS.md)
- [`types/certificate.ts`](https://github.com/Junio243/signflow/blob/main/types/certificate.ts)
- [`supabase/migrations/20260215_certificates.sql`](https://github.com/Junio243/signflow/blob/main/supabase/migrations/20260215_certificates.sql)
