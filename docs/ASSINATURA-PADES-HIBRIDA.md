# 🔐 Assinatura PAdES Híbrida - SignFlow

## 🎯 Objetivo

Implementar assinatura digital que seja **reconhecida automaticamente** pelos leitores de PDF (Adobe Reader, Foxit, etc.) com o **check verde de validação**.

---

## ⚠️ **PROBLEMA ATUAL**

### Certificados Auto-Gerados (O que implementamos)

Os certificados gerados pela plataforma atualmente são:
```
❌ NÃO reconhecidos pelo Adobe Reader
❌ NÃO estão na Adobe Approved Trust List (AATL)
❌ NÃO são emitidos por AC confiável (ICP-Brasil)
❌ NÃO têm LTV (Long Term Validation)
❌ NÃO têm Timestamping de TSA
```

**Resultado no Adobe Reader:**
- ⚠️ "Assinatura não confiável"
- ⚠️ "A identidade do signatário não foi verificada"
- ❌ Marca amarela ou vermelha
- ❌ Usuário precisa confiar manualmente no certificado

**Estes certificados são úteis para:**
- ✅ Uso interno da empresa
- ✅ Contratos entre partes que confiam uma na outra
- ✅ Documentos que não precisam de validação automática
- ✅ Ambientes de desenvolvimento/teste

**NÃO são úteis para:**
- ❌ Documentos legais que precisam de validação automática
- ❌ Contratos com terceiros desconhecidos
- ❌ Documentos que serão apresentados em juízo
- ❌ Situações que exigem ICP-Brasil

---

## ✅ **SOLUÇÃO: ASSINATURA HÍBRIDA (Padrão SaaS)**

### Como DocuSign, ClickSign, D4Sign fazem:

```
👤 Usuário sem certificado próprio
     ↓
📄 Plataforma coleta evidências:
     - IP do signatário
     - E-mail verificado
     - Geolocalização
     - Foto de documento (opcional)
     - Data/hora precisa
     - Dispositivo usado
     ↓
🏢 Plataforma assina com SEU próprio certificado ICP-Brasil:
     - Certificado A1 da EMPRESA (CNPJ da SignFlow)
     - Emitido por AC confiável (Serasa, Certisign, Soluti)
     - Padrão PAdES completo
     - LTV habilitado
     - Timestamping de TSA
     ↓
✅ Resultado no Adobe Reader:
     - ✅ Check VERDE
     - ✅ "Assinado digitalmente por SignFlow Plataforma"
     - ✅ "Documento não foi modificado"
     - 📄 Dentro do PDF: "João Silva assinou eletronicamente em 15/02/2026"
```

---

## 📝 **REQUISITOS TÉCNICOS OBRIGATÓRIOS (PAdES)**

### 1. **Dicionário de Assinatura (Signature Dictionary)**

```javascript
// O PDF deve conter objeto /V com:
{
  Type: /Sig
  Filter: /Adobe.PPKLite
  SubFilter: /adbe.pkcs7.detached  // ou /ETSI.CAdES.detached
  Name: "SignFlow Plataforma"
  Reason: "Documento assinado eletronicamente"
  Location: "São Paulo, Brasil"
  M: "D:20260215225500-03'00'"  // Data/hora
  ContactInfo: "suporte@signflow.com"
  ByteRange: [0 1234 5678 9012]  // Bytes cobertos
  Contents: <assinatura PKCS#7>
}
```

### 2. **ByteRange (Cobertura da Assinatura)**

```javascript
// Formato: [offset1 length1 offset2 length2]
// Exemplo: [0 1000 5000 3000]
// Significa:
//   - Bytes 0 a 999 (1000 bytes)
//   - Bytes 5000 a 7999 (3000 bytes)
// A assinatura fica entre 1000 e 4999 (não coberta por ela mesma)

ByteRange: [0 1234 5678 9012]
           ↑     ↑     ↑     ↑
           |     |     |     |
          início tam   início tam
          parte1     parte2
```

### 3. **LTV - Long Term Validation** ⭐ **CRÍTICO**

```javascript
// Sem LTV:
❌ Certificado expira em 1 ano
❌ Assinatura válida hoje = INVÁLIDA amanhã
❌ Adobe não consegue validar no futuro

// Com LTV:
✅ Embute resposta OCSP no PDF
✅ Embute CRL (Certificate Revocation List)
✅ Prova que certificado era válido no momento da assinatura
✅ Assinatura permanece válida PARA SEMPRE
```

**O que embutir no PDF:**
```javascript
// DSS (Document Security Store)
{
  Type: /DSS
  Certs: [certificado_da_AC, certificado_intermediario, ...]
  OCSPs: [resposta_OCSP_da_AC]
  CRLs: [lista_de_revogacao]
}
```

### 4. **Timestamping (Carimbo de Tempo)** ⏰

```javascript
// Sem Timestamping:
❌ Depende do relógio do usuário
❌ Pode ser adulterado
❌ Não é confiável

// Com Timestamping:
✅ Servidor TSA (Time Stamping Authority) confiável
✅ Prova inequívoca do momento da assinatura
✅ Independente do relógio local
✅ RFC 3161 compliant
```

**TSAs confiáveis no Brasil:**
- **Válida (ICP-Brasil):** https://ts.validcertificadora.com.br
- **Certisign:** https://tsa.certisign.com.br
- **Serasa:** https://tsa.serasa.com.br
- **Soluti:** https://timestamp.soluti.com.br

---

## 🛠️ **IMPLEMENTAÇÃO TÉCNICA**

### **Passo 1: Adquirir Certificado A1 da Empresa**

```bash
# Opções de ACs ICP-Brasil:
1. Serasa Experian - https://certificadodigital.serasa.com.br
2. Certisign - https://www.certisign.com.br
3. Soluti - https://www.soluti.com.br
4. Válida - https://www.validcertificadora.com.br

# Tipo: Certificado A1 (arquivo digital)
# Titular: CNPJ da SignFlow
# Validade: 1 ano (renovável)
# Custo: R$ 200 a R$ 500/ano
```

### **Passo 2: Coletar Evidências do Signatário**

```typescript
// lib/signatureEvidence.ts
export interface SignatureEvidence {
  // Identificação
  signerName: string;
  signerEmail: string;
  signerCPF?: string;
  
  // Contexto da assinatura
  ipAddress: string;
  userAgent: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
  };
  
  // Temporal
  signedAt: Date;
  timezone: string;
  
  // Dispositivo
  deviceInfo: {
    os: string;
    browser: string;
    screenResolution: string;
  };
  
  // Autenticação
  authMethod: 'email' | 'sms' | '2fa' | 'biometrics';
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Documentos (opcional)
  documentPhotos?: string[];  // Base64
  selfiePhoto?: string;        // Base64
  
  // Aceitação de termos
  acceptedTerms: boolean;
  termsVersion: string;
}

// Coletar evidências no frontend
export async function collectEvidence(req: Request): Promise<SignatureEvidence> {
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
  const userAgent = req.headers.get('user-agent');
  
  // Geolocalização (via IP)
  const geoData = await fetch(`https://ipapi.co/${ipAddress}/json/`).then(r => r.json());
  
  return {
    ipAddress,
    userAgent,
    geolocation: {
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      city: geoData.city,
      state: geoData.region,
      country: geoData.country_name,
    },
    signedAt: new Date(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    // ...
  };
}
```

### **Passo 3: Gerar Manifesto Visual no PDF**

```typescript
// lib/visualSignature.ts
import { PDFDocument, rgb } from 'pdf-lib';

export async function addVisualSignature(
  pdfBuffer: Buffer,
  evidence: SignatureEvidence,
  position: { page: number; x: number; y: number }
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const page = pages[position.page];
  
  // Adicionar retângulo de assinatura
  page.drawRectangle({
    x: position.x,
    y: position.y,
    width: 300,
    height: 100,
    borderColor: rgb(0.2, 0.4, 0.8),
    borderWidth: 2,
  });
  
  // Adicionar texto
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText(`🔐 ASSINADO DIGITALMENTE`, {
    x: position.x + 10,
    y: position.y + 75,
    size: 12,
    font,
    color: rgb(0.2, 0.4, 0.8),
  });
  
  page.drawText(`Por: ${evidence.signerName}`, {
    x: position.x + 10,
    y: position.y + 55,
    size: 10,
    font,
  });
  
  page.drawText(`CPF: ${evidence.signerCPF || 'N/A'}`, {
    x: position.x + 10,
    y: position.y + 40,
    size: 9,
    font,
  });
  
  page.drawText(`Data: ${evidence.signedAt.toLocaleString('pt-BR')}`, {
    x: position.x + 10,
    y: position.y + 25,
    size: 9,
    font,
  });
  
  page.drawText(`IP: ${evidence.ipAddress}`, {
    x: position.x + 10,
    y: position.y + 10,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
```

### **Passo 4: Assinar com PAdES + LTV + Timestamping**

```typescript
// lib/padesSignature.ts
import { signpdf } from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';
import { plainAddPlaceholder } from '@signpdf/placeholder-plain';
import fetch from 'node-fetch';

export async function signWithPAdES(
  pdfBuffer: Buffer,
  companyP12: Buffer,
  companyPassword: string,
  evidence: SignatureEvidence
): Promise<Buffer> {
  
  // 1. Adicionar placeholder
  const pdfWithPlaceholder = plainAddPlaceholder({
    pdfBuffer,
    reason: 'Documento assinado eletronicamente via SignFlow',
    contactInfo: 'suporte@signflow.com',
    name: 'SignFlow Plataforma',
    location: `${evidence.geolocation.city}, ${evidence.geolocation.state}`,
  });
  
  // 2. Criar signer com certificado da empresa
  const signer = new P12Signer(companyP12, {
    passphrase: companyPassword,
  });
  
  // 3. Assinar com PKCS#7 detached
  let signedPdf = await signpdf.sign(pdfWithPlaceholder, signer);
  
  // 4. Adicionar LTV (OCSP + CRL)
  signedPdf = await addLTV(signedPdf, companyP12);
  
  // 5. Adicionar Timestamp
  signedPdf = await addTimestamp(signedPdf);
  
  return signedPdf;
}

// Adicionar LTV
async function addLTV(pdfBuffer: Buffer, certP12: Buffer): Promise<Buffer> {
  // Extrair certificado
  const cert = extractCertFromP12(certP12);
  
  // Buscar resposta OCSP
  const ocspResponse = await fetchOCSPResponse(cert);
  
  // Buscar CRL
  const crlData = await fetchCRL(cert);
  
  // Embutir no PDF (DSS - Document Security Store)
  const pdfWithLTV = embedDSS(pdfBuffer, {
    certs: [cert],
    ocsps: [ocspResponse],
    crls: [crlData],
  });
  
  return pdfWithLTV;
}

// Adicionar Timestamp (RFC 3161)
async function addTimestamp(pdfBuffer: Buffer): Promise<Buffer> {
  const TSA_URL = 'https://ts.validcertificadora.com.br';
  
  // Criar requisição TSA
  const tsRequest = createTimestampRequest(pdfBuffer);
  
  // Enviar para TSA
  const response = await fetch(TSA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/timestamp-query' },
    body: tsRequest,
  });
  
  const tsResponse = await response.buffer();
  
  // Embutir timestamp no PDF
  const pdfWithTimestamp = embedTimestamp(pdfBuffer, tsResponse);
  
  return pdfWithTimestamp;
}
```

---

## 📊 **ROADMAP DE IMPLEMENTAÇÃO**

### **Fase 1: Infraestrutura (Semana 1-2)**
- [ ] Adquirir certificado A1 ICP-Brasil da SignFlow
- [ ] Configurar armazenamento seguro do certificado
- [ ] Testar certificado com @signpdf/signpdf

### **Fase 2: Coleta de Evidências (Semana 3)**
- [ ] Implementar `collectEvidence()`
- [ ] Armazenar evidências no banco (tabela `signature_evidences`)
- [ ] API para buscar evidências por documento

### **Fase 3: Manifesto Visual (Semana 4)**
- [ ] Implementar `addVisualSignature()`
- [ ] Componente React para configurar posição
- [ ] Preview da assinatura visual

### **Fase 4: PAdES Básico (Semana 5)**
- [ ] Assinar com certificado da empresa
- [ ] Validar no Adobe Reader (check verde)
- [ ] Testar ByteRange e SubFilter

### **Fase 5: LTV (Semana 6-7)**
- [ ] Implementar fetch OCSP
- [ ] Implementar fetch CRL
- [ ] Embutir DSS no PDF
- [ ] Testar validade após expiração do certificado

### **Fase 6: Timestamping (Semana 8)**
- [ ] Integrar com TSA (Válida ou Certisign)
- [ ] Criar requisição RFC 3161
- [ ] Embutir timestamp no PDF
- [ ] Validar no Adobe Reader

### **Fase 7: Testes e Homologação (Semana 9-10)**
- [ ] Testes com Adobe Reader
- [ ] Testes com Foxit Reader
- [ ] Testes com navegadores (Chrome PDF Viewer)
- [ ] Validação em cartório (opcional)

---

## 💰 **CUSTOS ESTIMADOS**

| Item | Custo Anual | Observações |
|------|-------------|---------------|
| **Certificado A1 ICP-Brasil** | R$ 200-500 | CNPJ da SignFlow |
| **TSA (Timestamping)** | R$ 0-1.000 | Algumas ACs incluem gratuitamente |
| **Consultas OCSP** | Grátis | Ilimitado |
| **Desenvolvimento** | R$ 20.000-40.000 | 8-10 semanas |
| **TOTAL SETUP** | ~R$ 20.500 | Investimento inicial |
| **TOTAL ANUAL** | ~R$ 500 | Apenas renovação do cert |

---

## 📚 **BIBLIOTECAS NECESSÁRIAS**

```bash
npm install @signpdf/signpdf
npm install @signpdf/signer-p12
npm install @signpdf/placeholder-plain
npm install node-forge
npm install pdf-lib
npm install asn1js
npm install pkijs
```

---

## ✅ **RESULTADO FINAL**

### Ao abrir no Adobe Reader:

```
✅ Painel de assinaturas:
   ✅ Check VERDE
   ✅ "Assinado digitalmente por SignFlow Plataforma"
   ✅ "CNPJ: 00.000.000/0001-00"
   ✅ "Certificado emitido por: Certisign AC"
   ✅ "Assinado em: 15/02/2026 22:55:30"
   ✅ "Timestamp: 15/02/2026 22:55:31 (Válida TSA)"
   ✅ "O documento não foi modificado"

📄 Dentro do PDF (visual):
   🔐 ASSINADO DIGITALMENTE
   Por: João Silva
   CPF: 123.456.789-00
   Data: 15/02/2026 22:55:30
   IP: 192.168.1.100
   Local: São Paulo, SP
```

---

## ⚠️ **IMPORTANTE**

### O certificado auto-gerado continua útil para:
- ✅ Assinaturas internas (workflows da empresa)
- ✅ Testes e desenvolvimento
- ✅ Documentação entre partes que confiam
- ✅ E-mails seguros (S/MIME)

### Para assinaturas com check verde, use:
- ✅ Certificado A1 ICP-Brasil da EMPRESA
- ✅ PAdES completo (LTV + Timestamping)
- ✅ Manifesto visual das evidências

---

## 📞 **PRÓXIMA AÇÃO IMEDIATA**

1. **Adquirir certificado A1 da SignFlow**
   - Escolher AC (Serasa, Certisign, Soluti)
   - Comprar certificado A1 (CNPJ)
   - Armazenar com segurança

2. **Implementar Fase 1**
   - Testar assinatura com certificado da empresa
   - Validar check verde no Adobe Reader

3. **Planejar Fases 2-7**
   - Definir timeline
   - Alocar recursos
   - Iniciar desenvolvimento

---

**Status:** 🔴 **DOCUMENTAÇÃO COMPLETA - AGUARDANDO IMPLEMENTAÇÃO**

**Última atualização:** 15/02/2026 22:55
