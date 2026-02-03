# 🔐 Assinatura Digital PKI no SignFlow

## 🎯 Visão Geral

O SignFlow agora suporta **assinatura digital com certificado PKI (Public Key Infrastructure)**, tornando os PDFs reconhecidos nativamente por leitores como **Adobe Acrobat Reader**, **Foxit PDF** e outros.

### ✨ Benefícios

✅ **Selo Azul de Validação** - Adobe Reader exibe automaticamente selo de documento confiável  
✅ **Validade Jurídica** - Conformidade com ICP-Brasil e MP 2.200-2/2001  
✅ **Integridade Garantida** - Qualquer modificação invalida a assinatura  
✅ **Não-Repúdio** - O assinante não pode negar autoria  
✅ **Timestamp Criptográfico** - Data/hora protegida criptograficamente  

---

## 🛠️ Tecnologias Utilizadas

- **[@signpdf/signpdf](https://www.npmjs.com/package/@signpdf/signpdf)** - Biblioteca Node.js para assinatura digital
- **Padrão PKCS#7** - Formato de assinatura reconhecido por Adobe Reader
- **Certificado P12/PFX** - Padrão PKI para certificados digitais
- **ICP-Brasil** (opcional) - Autoridade certificadora brasileira

---

## 🚀 Como Funciona

### Fluxo de Assinatura

```
1. Usuário assina documento no SignFlow
   ↓
2. Backend gera PDF com:
   • Assinaturas visuais (imagens)
   • QR Code de validação
   ↓
3. Sistema adiciona placeholder de assinatura digital
   ↓
4. Sistema assina PDF com certificado P12 (PKCS#7)
   ↓
5. PDF final contém:
   • Assinaturas visuais
   • QR Code
   • Assinatura digital PKI (invisível mas validável)
   ↓
6. Adobe Reader reconhece e exibe selo azul ✅
```

---

## 📝 Configuração

### Desenvolvimento (Certificado Auto-Assinado)

#### Passo 1: Gerar Certificado de Teste

```bash
npm run generate-certificate
```

Este comando:
1. Cria chave privada RSA (2048 bits)
2. Gera certificado auto-assinado (válido por 10 anos)
3. Converte para formato P12/PFX
4. Configura variáveis de ambiente automaticamente

#### Passo 2: Verificar Arquivo .env.local

O script adiciona automaticamente:

```env
# Certificado Digital PKI
CERTIFICATE_PATH=./certificates/certificate.p12
CERTIFICATE_PASSWORD=signflow2026
```

#### Passo 3: Reiniciar Servidor

```bash
npm run dev
```

### Produção (Certificado ICP-Brasil)

#### Opção 1: e-CPF/e-CNPJ (Pessoa Física/Jurídica)

1. **Adquirir certificado**:
   - [Serpro](https://www.serpro.gov.br/links-fixos-superiores/assinador-digital/certificado-digital)
   - [Caixa Econômica](https://certificadodigital.caixa.gov.br/)
   - [Correios](https://www.correios.com.br/enviar/certificado-digital)
   - Custo: R$ 200-500/ano

2. **Exportar para P12**:
   - Abrir certificado no Windows
   - Exportar como `.pfx` ou `.p12`
   - Definir senha forte

3. **Fazer upload para servidor**:
   ```bash
   # Via SCP
   scp certificado-producao.p12 usuario@servidor:/caminho/certificates/
   
   # Ou via Vercel (variáveis de ambiente)
   # Converter para base64:
   base64 certificado-producao.p12 > certificate.txt
   ```

4. **Configurar variáveis de ambiente**:
   ```env
   CERTIFICATE_PATH=/caminho/completo/certificado-producao.p12
   CERTIFICATE_PASSWORD=senha-segura-aqui
   ```

#### Opção 2: Certificado Internacional

- [GlobalSign](https://www.globalsign.com/)
- [DigiCert](https://www.digicert.com/)
- [Sectigo](https://sectigo.com/)

**Observação**: Certificados internacionais não têm validade jurídica automática no Brasil (ICP-Brasil é obrigatório para documentos oficiais).

---

## 🧪 Testando a Assinatura Digital

### 1. Assinar Documento

1. Acesse o SignFlow
2. Faça upload de um PDF
3. Adicione assinaturas visuais
4. Clique em "Assinar"

### 2. Baixar PDF Assinado

1. Vá para o Dashboard
2. Clique em "Baixar" no documento assinado
3. Salve o PDF no seu computador

### 3. Validar no Adobe Reader

#### Certificado de Desenvolvimento (Auto-Assinado)

1. Abra o PDF no Adobe Reader
2. Verá aviso: 🟡 **"Assinatura inválida - certificado não confiável"**
3. Clique com botão direito na assinatura
4. Escolha "Mostrar propriedades da assinatura"
5. Clique em "Mostrar certificado"
6. Clique em "Adicionar à lista de certificados confiáveis"
7. Reinicie o Adobe Reader
8. Abra o PDF novamente
9. Agora verá: 🟢 **"Assinado e todas as assinaturas são válidas"**

#### Certificado ICP-Brasil (Produção)

1. Abra o PDF no Adobe Reader
2. Verá automaticamente: 🟢 **"Assinado e todas as assinaturas são válidas"**
3. Selo azul exibido no topo do documento
4. Clique no painel "Assinaturas" (lado esquerdo) para ver detalhes:
   - ✅ **Assinado por**: SignFlow Digital Signature
   - ✅ **Data/Hora**: Timestamp da assinatura
   - ✅ **Localização**: SignFlow Platform
   - ✅ **Motivo**: Documento assinado digitalmente

---

## 🔍 Detalhes Técnicos

### Arquivos Envolvidos

```
signflow/
├── lib/
│   └── digitalSignature.ts      # Módulo principal de assinatura PKI
├── app/api/
│   ├── sign/route.ts            # API de assinatura (usa PKI)
│   └── batch-sign/route.ts      # API de lote (usa PKI)
├── scripts/
│   └── generate-certificate.sh  # Script para gerar certificado
└── certificates/              # Pasta com certificados (ignorada no Git)
    ├── private-key.pem
    ├── certificate.pem
    └── certificate.p12          # Usado pela aplicação
```

### Funções Principais

#### `signPdfComplete(pdfBuffer, options)`

Assina PDF com certificado digital PKI.

```typescript
import { signPdfComplete } from '@/lib/digitalSignature';

const pdfBuffer = fs.readFileSync('documento.pdf');
const signedPdf = await signPdfComplete(pdfBuffer, {
  reason: 'Aprovação de contrato',
  contactInfo: 'joao@empresa.com',
  name: 'João Silva',
  location: 'São Paulo, Brasil'
});
fs.writeFileSync('documento-assinado.pdf', signedPdf);
```

#### `isCertificateConfigured()`

Verifica se certificado está configurado.

```typescript
import { isCertificateConfigured } from '@/lib/digitalSignature';

if (isCertificateConfigured()) {
  console.log('✅ Certificado configurado');
} else {
  console.log('⚠️ Certificado não encontrado');
}
```

### Comportamento Inteligente

✅ **Com certificado configurado**: PDF recebe assinatura digital PKI automaticamente  
⚠️ **Sem certificado**: PDF é assinado apenas visualmente (imagem + QR Code)  
🛡️ **Erro na assinatura PKI**: Sistema continua com assinatura visual (graceful fallback)  

---

## 📊 Comparação: Antes vs Depois

| Característica | Antes | Depois |
|----------------|-------|--------|
| **Assinatura visual** | ✅ Sim | ✅ Sim |
| **QR Code** | ✅ Sim | ✅ Sim |
| **Certificado digital** | ❌ Não | ✅ Sim |
| **Reconhecido por Adobe** | ❌ Não | ✅ Sim |
| **Selo azul de validação** | ❌ Não | ✅ Sim |
| **Criptografia PKI** | ❌ Não | ✅ Sim |
| **Prova de integridade** | ⚠️ Via QR | ✅ Nativo no PDF |
| **Validade jurídica** | ⚠️ Limitada | ✅ Plena (ICP-Brasil) |

---

## ⚠️ Segurança

### Boas Práticas

✅ **Não versione certificados**: Pasta `certificates/` já está no `.gitignore`  
✅ **Use senhas fortes**: Mínimo 12 caracteres para produção  
✅ **Proteja a chave privada**: Permissões 600 (`chmod 600`)  
✅ **Renove certificados**: ICP-Brasil geralmente válido por 1-3 anos  
✅ **Use variáveis de ambiente**: Nunca hardcode senhas no código  

### Vercel/Produção

Para deploy em Vercel:

1. Converter certificado para base64:
   ```bash
   base64 certificate.p12 > certificate-base64.txt
   ```

2. Adicionar variável de ambiente no Vercel:
   - Nome: `CERTIFICATE_BASE64`
   - Valor: Conteúdo do arquivo `certificate-base64.txt`

3. Modificar `lib/digitalSignature.ts` para decodificar de base64:
   ```typescript
   const certBuffer = process.env.CERTIFICATE_BASE64
     ? Buffer.from(process.env.CERTIFICATE_BASE64, 'base64')
     : fs.readFileSync(certPath);
   ```

---

## 📚 Recursos e Referências

### Documentação Oficial

- [Adobe: Como funcionam assinaturas digitais](https://helpx.adobe.com/acrobat/using/digital-signatures.html)
- [ICP-Brasil: Certificação Digital](https://www.gov.br/iti/pt-br/assuntos/icp-brasil)
- [node-signpdf: Documentação](https://www.npmjs.com/package/@signpdf/signpdf)
- [ISO 32000-2: PDF 2.0 Specification](https://www.iso.org/standard/63534.html)

### Legislação Brasileira

- [MP 2.200-2/2001](http://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm) - Institui a ICP-Brasil
- [Lei 14.063/2020](http://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/L14063.htm) - Assinaturas eletrônicas

### Fornecedores de Certificados

#### ICP-Brasil
- [Serpro](https://www.serpro.gov.br/links-fixos-superiores/assinador-digital/certificado-digital)
- [Caixa Econômica](https://certificadodigital.caixa.gov.br/)
- [Correios](https://www.correios.com.br/enviar/certificado-digital)
- [Certisign](https://www.certisign.com.br/)
- [Serasa](https://certificadodigital.serasa.com.br/)

#### Internacional
- [GlobalSign](https://www.globalsign.com/)
- [DigiCert](https://www.digicert.com/)
- [Sectigo](https://sectigo.com/)

---

## 🐛 Troubleshooting

### Erro: "Certificado não encontrado"

```bash
# Verificar se certificado existe
ls -la certificates/certificate.p12

# Se não existir, gerar novo
npm run generate-certificate
```

### Erro: "Senha incorreta"

```bash
# Verificar senha no .env.local
cat .env.local | grep CERTIFICATE_PASSWORD

# Regenerar certificado se necessário
rm certificates/*
npm run generate-certificate
```

### Adobe Reader não reconhece assinatura

1. Verificar se o PDF foi assinado com certificado:
   - Logs do servidor devem mostrar: `✅ Assinatura digital PKI aplicada`

2. Adicionar certificado à lista confiável (apenas desenvolvimento):
   - Adobe Reader → Editar → Preferências → Assinaturas
   - Verificação → Mais...
   - Adicionar certificado manualmente

### Erro no build/deploy

```bash
# Verificar dependências
npm list @signpdf/signpdf

# Reinstalar se necessário
npm install @signpdf/signpdf @signpdf/signer-p12 @signpdf/placeholder-plain
```

---

## 🚀 Próximos Passos

- [ ] Suporte para múltiplos certificados (assinaturas conjuntas)
- [ ] Timestamp server (RFC 3161) para provas de tempo
- [ ] Suporte para certificados em HSM (Hardware Security Module)
- [ ] API para validar assinatura digital programaticamente
- [ ] Dashboard para gestão de certificados

---

## 💬 Suporte

Para dúvidas ou problemas:

1. Consulte a [Issue #88](https://github.com/Junio243/signflow/issues/88)
2. Abra uma nova issue com a tag `digital-signature`
3. Contate o time de desenvolvimento

---

**Desenvolvido com ❤️ pelo time SignFlow**
