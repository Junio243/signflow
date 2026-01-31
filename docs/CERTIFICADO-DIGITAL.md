# 🔐 Certificado Digital - SignFlow

## O que é Assinatura Digital com Certificado?

Assinatura digital com certificado PKI (Public Key Infrastructure) é uma tecnologia criptográfica que:

- ✅ **Autentica** o signatário (prova quem assinou)
- ✅ **Garante integridade** (documento não foi alterado)
- ✅ **Não-repúdio** (signatário não pode negar)
- ✅ **Timestamp** (data/hora criptograficamente protegida)
- ✅ **Reconhecida** por leitores de PDF (Adobe, Foxit, etc.)

---

## 🎯 Benefícios para o SignFlow

### Antes (sem certificado digital)
- ❌ Leitores de PDF não reconhecem assinatura
- ❌ Sem selo azul de validação
- ❌ Validade jurídica limitada
- ⚠️ Validação apenas via QR Code externo

### Depois (com certificado digital)
- ✅ Adobe Reader exibe **selo azul** "Assinado"
- ✅ Validação **nativa** no leitor de PDF
- ✅ **Validade jurídica plena** (ICP-Brasil)
- ✅ **Integridade garantida** por criptografia
- ✅ **Não-repúdio** legal

---

## 🛠️ Gerar Certificado Digital

### Para Desenvolvimento

#### Opção 1: Script Automático (Recomendado)

```bash
chmod +x scripts/generate-certificate.sh
./scripts/generate-certificate.sh
```

Ou adicione no `package.json`:

```json
{
  "scripts": {
    "generate-certificate": "bash scripts/generate-certificate.sh"
  }
}
```

E execute:

```bash
npm run generate-certificate
```

#### Opção 2: Manual com OpenSSL

```bash
# 1. Criar pasta
mkdir -p certificates

# 2. Gerar chave privada
openssl genrsa -out certificates/private-key.pem 2048

# 3. Criar certificado auto-assinado (válido 10 anos)
openssl req -new -x509 -key certificates/private-key.pem \
  -out certificates/certificate.pem -days 3650 \
  -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=SignFlow/OU=Digital Signature/CN=SignFlow Certificate"

# 4. Converter para P12/PFX (senha: signflow2026)
openssl pkcs12 -export -out certificates/certificate.p12 \
  -inkey certificates/private-key.pem \
  -in certificates/certificate.pem \
  -password pass:signflow2026
```

### Para Produção

⚠️ **Certificados auto-assinados NÃO devem ser usados em produção!**

Adquira certificado de **Autoridade Certificadora (CA) confiável**:

#### Brasil: ICP-Brasil

- **e-CPF:** Pessoa física (R$ 200-300/ano)
- **e-CNPJ:** Pessoa jurídica (R$ 300-500/ano)
- **Onde comprar:** Serasa, Certisign, Soluti, Valid
- **Validade:** Reconhecido por lei (MP 2.200-2/2001)
- **Site:** https://www.gov.br/iti/pt-br/assuntos/icp-brasil

#### Internacional

- **GlobalSign:** https://www.globalsign.com/
- **DigiCert:** https://www.digicert.com/
- **Sectigo:** https://www.sectigo.com/
- **Custo:** $50-200 USD/ano

---

## ⚙️ Configurar Certificado

### 1. Variáveis de Ambiente

Adicionar em `.env.local`:

```env
# Certificado Digital PKI
CERTIFICATE_PATH=./certificates/certificate.p12
CERTIFICATE_PASSWORD=signflow2026
```

### 2. Estrutura de Pastas

```
signflow/
├── certificates/          # Pasta de certificados (não versionar!)
│   ├── certificate.p12   # Certificado P12/PFX
│   ├── certificate.pem   # Certificado PEM (opcional)
│   └── private-key.pem   # Chave privada (opcional)
├── lib/
│   └── digitalSignature.ts  # Módulo de assinatura
└── scripts/
    └── generate-certificate.sh  # Script para gerar certificado
```

### 3. Adicionar ao .gitignore

```gitignore
# Certificados digitais (nunca versionar!)
certificates/
*.p12
*.pfx
*.pem
*.key
```

---

## 💻 Usar Assinatura Digital

### Exemplo Básico

```typescript
import { signPdfComplete } from '@/lib/digitalSignature';
import fs from 'fs';

// Ler PDF original
const pdfBuffer = fs.readFileSync('documento.pdf');

// Assinar digitalmente
const signedPdf = await signPdfComplete(pdfBuffer, {
  reason: 'Aprovação de contrato',
  contactInfo: 'joao@empresa.com',
  name: 'João Silva',
  location: 'São Paulo, Brasil'
});

// Salvar PDF assinado
fs.writeFileSync('documento-assinado.pdf', signedPdf);
```

### Integrar na API

```typescript
// app/api/sign-pdf/route.ts
import { signPdfComplete } from '@/lib/digitalSignature';

export async function POST(request: Request) {
  // ... gerar PDF com assinaturas visuais ...

  // Adicionar assinatura digital
  const digitallySignedPdf = await signPdfComplete(pdfWithVisualSignatures, {
    reason: 'Documento assinado via SignFlow',
    contactInfo: 'suporte@signflow.com',
  });

  // Upload para Supabase
  await supabase.storage
    .from('signed-pdfs')
    .upload(`signed/${documentId}.pdf`, digitallySignedPdf);
}
```

---

## 📊 Como Validar no Adobe Reader

### 1. Abrir PDF Assinado

Ao abrir o PDF no Adobe Reader, você verá:

- ✅ **Selo azul** no topo: "Assinado e todas as assinaturas são válidas"
- 🕵️ **Painel Assinaturas** (lado esquerdo)

### 2. Ver Detalhes da Assinatura

Clicar no painel "Assinaturas" mostra:

```
✅ Assinado por: SignFlow Certificate
📅 Data/Hora: 31/01/2026 18:30:45 -03:00
📍 Localização: SignFlow Platform
📝 Motivo: Documento assinado digitalmente
✅ Status: Assinatura válida
```

### 3. Verificar Certificado

1. Clicar em "Propriedades da Assinatura"
2. Ver detalhes do certificado:
   - Emissor
   - Validade
   - Algoritmo (RSA + SHA-256)
   - Cadeia de confiança

### 4. Adicionar à Lista Confiável (Certificado Auto-Assinado)

Para certificados de desenvolvimento:

1. Clique na assinatura
2. "Propriedades da Assinatura"
3. "Mostrar Certificado do Signatário"
4. Aba "Confiança"
5. "Adicionar aos Certificados Confiáveis"
6. Selecionar "Usar este certificado como raíz confiável"
7. OK

Depois disso, o selo ficará completamente verde ✅

---

## 🔍 Como Funciona Tecnicamente

### 1. Placeholder

PDF reserva espaço para assinatura:

```
/Type /Sig
/Filter /Adobe.PPKLite
/SubFilter /adbe.pkcs7.detached
/ByteRange [0 1234 5678 9012]
/Contents <00000...00000>  <- Placeholder (hex zeros)
```

### 2. Assinatura PKCS#7

Certificado P12 gera estrutura PKCS#7:

```
PKCS#7 SignedData {
  version: 1
  digestAlgorithm: SHA-256
  signerInfo: {
    issuer: "CN=SignFlow Certificate"
    serialNumber: 0x123456
    signature: <assinatura RSA do hash do documento>
  }
  certificates: [ ... certificado X.509 ... ]
}
```

### 3. Hash do Documento

```
1. Hash SHA-256 de todo o PDF (exceto placeholder)
2. Criptografar hash com chave privada do certificado
3. Resultado = assinatura digital
```

### 4. Validação

Leitor de PDF (Adobe Reader):

```
1. Extrai certificado da assinatura
2. Calcula hash do documento atual
3. Descriptografa assinatura com chave pública do certificado
4. Compara hashes:
   - Iguais = ✅ Válido
   - Diferentes = ❌ Modificado
```

---

## 📚 Referências

### Documentação Técnica

- [Adobe: Digital Signatures](https://helpx.adobe.com/acrobat/using/digital-signatures.html)
- [PDF Specification ISO 32000-2](https://www.iso.org/standard/63534.html)
- [PKCS#7: Cryptographic Message Syntax](https://www.rfc-editor.org/rfc/rfc2315)
- [X.509 Certificate Standard](https://www.itu.int/rec/T-REC-X.509)

### Bibliotecas Node.js

- [@signpdf/signpdf](https://www.npmjs.com/package/@signpdf/signpdf)
- [node-forge](https://www.npmjs.com/package/node-forge)
- [PDFKit](https://pdfkit.org/)

### Legislação (Brasil)

- [MP 2.200-2/2001 - ICP-Brasil](http://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm)
- [Lei 14.063/2020 - Assinaturas Eletrônicas](http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/L14063.htm)
- [Resolução CNJ 234/2016 - Documentos Eletrônicos](https://atos.cnj.jus.br/atos/detalhar/2326)

### Autoridades Certificadoras

- [ICP-Brasil](https://www.gov.br/iti/pt-br/assuntos/icp-brasil)
- [GlobalSign](https://www.globalsign.com/)
- [DigiCert](https://www.digicert.com/)
- [Sectigo](https://www.sectigo.com/)

---

## ❓ FAQ

### P: Certificado auto-assinado é válido?

**R:** Tecnicamente sim, mas:
- ⚠️ Adobe Reader mostrará aviso "não confiável"
- ❌ Não tem validade jurídica plena
- ✅ Ótimo para desenvolvimento/testes
- ❌ Não use em produção

### P: Quanto custa certificado ICP-Brasil?

**R:** 
- **e-CPF:** R$ 200-300/ano
- **e-CNPJ:** R$ 300-500/ano
- **Validade:** 1-3 anos

### P: Posso usar certificado internacional no Brasil?

**R:**
- ✅ Tecnicamente funciona
- ⚠️ Pode não ter validade jurídica em órgãos públicos
- ✅ ICP-Brasil é o padrão legal no Brasil

### P: Preciso renovar o certificado?

**R:**
- ✅ Sim, certificados expiram (1-3 anos)
- ⚠️ Documentos assinados continuam válidos após expiração
- 🔄 Renove antes de expirar para continuar assinando

### P: O que acontece se o PDF for modificado?

**R:**
- ❌ Assinatura digital fica **inválida**
- 🚨 Adobe Reader mostra aviso vermelho
- ⚠️ "Documento foi modificado após assinatura"
- ✅ Isso é o esperado - prova integridade!

---

_Documentação atualizada em 31/01/2026_ 🚀
