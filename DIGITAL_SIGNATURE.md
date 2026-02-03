# 🔐 Assinatura Digital PKI no SignFlow

## 🎯 Visão Geral

O SignFlow agora suporta **assinatura digital com certificado PKI** (PKCS#7), tornando os PDFs válidos e verificáveis em leitores como Adobe Reader, Foxit PDF e outros.

### ✨ O que você ganha?

- ✅ **Selo azul de validação** no Adobe Reader
- ✅ **Criptografia PKI** padrão ICP-Brasil
- ✅ **Verificação nativa** em qualquer leitor de PDF
- ✅ **Validade jurídica** reconhecida nacionalmente
- ✅ **Prova de integridade** criptográfica
- ✅ **Não-repúdio** - assinante não pode negar autoria

---

## 📚 Diferenças: Antes vs Depois

| Característica | Antes | Depois |
|----------------|-------|--------|
| **Assinatura visual** | ✅ Sim | ✅ Sim |
| **QR Code** | ✅ Sim | ✅ Sim |
| **Certificado digital PKI** | ❌ Não | ✅ **Sim** |
| **Selo azul Adobe Reader** | ❌ Não | ✅ **Sim** |
| **Criptografia PKCS#7** | ❌ Não | ✅ **Sim** |
| **Validação nativa PDF** | ⚠️ Via QR | ✅ **Nativo** |
| **Validade jurídica plena** | ⚠️ Limitada | ✅ **Plena** |

---

## 🛠️ Como Funciona?

### Fluxo de Assinatura

```
1. Usuário assina documento no SignFlow
   ↓
2. Backend gera PDF com:
   - Assinaturas visuais (imagens)
   - QR Code de validação
   ↓
3. Sistema adiciona placeholder de assinatura digital
   ↓
4. Sistema assina PDF com certificado P12 (PKCS#7)
   ↓
5. PDF final contém:
   ✅ Assinaturas visuais
   ✅ QR Code
   ✅ Assinatura digital PKI (invisível mas verificável)
   ↓
6. Adobe Reader reconhece e exibe selo azul ✅
```

### Tecnologias Usadas

- **[@signpdf/signpdf](https://www.npmjs.com/package/@signpdf/signpdf)** - Biblioteca de assinatura digital
- **PKCS#7** - Padrão de assinatura digital
- **Certificado P12/PFX** - Formato de certificado digital
- **ICP-Brasil** (opcional para produção) - Infraestrutura de Chaves Públicas Brasileira

---

## 🚀 Configuração

### Para Desenvolvimento/Testes

#### 1. Gerar Certificado Auto-Assinado

```bash
npm run generate-certificate
```

Isso criará:
- `certificates/certificate.p12` - Certificado digital
- Senha: `signflow2026`
- Validade: 10 anos

#### 2. Configurar Senha no `.env.local`

```env
CERTIFICATE_PASSWORD=signflow2026
```

#### 3. Testar

```bash
npm run dev
```

1. Crie e assine um documento no SignFlow
2. Baixe o PDF assinado
3. Abra no **Adobe Reader**
4. Veja o selo de assinatura digital no topo

⚠️ **Nota**: Certificados auto-assinados mostrarão "certificado não confiável" até serem adicionados à lista de confiança.

---

### Para Produção

#### Optar por Certificado Profissional

Para ter validade jurídica plena no Brasil, use certificado **ICP-Brasil**:

**Opções:**
- **e-CPF** (pessoa física) - R$ 200-300/ano
- **e-CNPJ** (pessoa jurídica) - R$ 300-500/ano

**Onde comprar:**
- [Serpro](https://certificados.serpro.gov.br/)
- [Serasa Experian](https://www.serasaexperian.com.br/)
- [Valid](https://www.validcertificadora.com.br/)
- [Certisign](https://www.certisign.com.br/)

**Certificados Internacionais (sem validade ICP-Brasil):**
- [GlobalSign](https://www.globalsign.com/)
- [DigiCert](https://www.digicert.com/)
- [Sectigo](https://sectigo.com/)

#### Instalar Certificado de Produção

1. **Obtenha seu certificado P12/PFX**
2. **Coloque em local seguro no servidor**:
   ```bash
   # Exemplo: pasta privada fora do repositório
   /opt/signflow/certificates/production.p12
   ```

3. **Configure variáveis de ambiente**:
   ```env
   CERTIFICATE_PATH=/opt/signflow/certificates/production.p12
   CERTIFICATE_PASSWORD=sua_senha_super_secreta
   ```

4. **Proteja as permissões**:
   ```bash
   chmod 600 /opt/signflow/certificates/production.p12
   chown signflow:signflow /opt/signflow/certificates/production.p12
   ```

---

## 💻 Uso no Código

### API de Assinatura Simples

A assinatura digital PKI é **automática** se o certificado estiver configurado.

```typescript
// app/api/sign/route.ts
import { signPdfComplete, isCertificateConfigured } from '@/lib/digitalSignature';

const hasCertificate = isCertificateConfigured();

if (hasCertificate) {
  // Aplica assinatura digital automaticamente
  finalPdfBytes = await signPdfComplete(Buffer.from(finalPdfBytes), {
    reason: 'Documento assinado digitalmente via SignFlow',
    contactInfo: 'suporte@signflow.com',
    name: 'Nome do Signatário',
    location: 'SignFlow Platform',
  });
}
```

### Assinatura Manual (se necessário)

```typescript
import { signPdfComplete } from '@/lib/digitalSignature';

const pdfBuffer = fs.readFileSync('documento.pdf');

const signedPdf = await signPdfComplete(pdfBuffer, {
  reason: 'Aprovação de contrato',
  contactInfo: 'joao@empresa.com',
  name: 'João Silva',
  location: 'São Paulo, Brasil',
  certificatePath: './custom/certificate.p12', // opcional
  certificatePassword: 'senha123', // opcional
});

fs.writeFileSync('documento-assinado.pdf', signedPdf);
```

---

## ✅ Validação

### Como Verificar a Assinatura Digital?

#### No Adobe Acrobat Reader

1. **Abra o PDF assinado**
2. **Veja o selo azul** no topo:
   - “✅ Assinado e todas as assinaturas são válidas”
3. **Clique no painel “Assinaturas”** (lado esquerdo)
4. **Detalhes visíveis**:
   - ✅ **Assinado por:** SignFlow Certificate (ou nome do certificado)
   - ✅ **Data/Hora:** Timestamp da assinatura
   - ✅ **Localização:** SignFlow Platform
   - ✅ **Motivo:** Documento assinado digitalmente
   - ✅ **Status:** Assinatura válida

#### No Foxit PDF Reader

Mesmo processo que Adobe Reader.

#### Em Navegadores (Chrome, Firefox, Edge)

Visualizadores nativos também reconhecem assinatura digital.

---

## 🔒 Segurança

### Boas Práticas

✅ **Nunca versione certificados no Git**
- Já adicionado ao `.gitignore`: `certificates/`

✅ **Use variáveis de ambiente para senhas**
```env
CERTIFICATE_PASSWORD=senha_super_secreta
```

✅ **Proteja permissões de arquivos**
```bash
chmod 600 certificate.p12
```

✅ **Renove certificados antes do vencimento**
- ICP-Brasil: validade de 1-3 anos
- Configure alertas de vencimento

✅ **Use certificados diferentes para dev/prod**
- Dev: auto-assinado
- Prod: ICP-Brasil ou CA confiável

---

## 🐛 Troubleshooting

### Erro: "Certificado não encontrado"

```bash
# Verifique se o certificado existe
ls -la certificates/certificate.p12

# Gere novamente se necessário
npm run generate-certificate
```

### Erro: "Senha do certificado inválida"

```bash
# Verifique a senha no .env.local
cat .env.local | grep CERTIFICATE_PASSWORD

# Teste manualmente com OpenSSL
openssl pkcs12 -info -in certificates/certificate.p12 -passin pass:signflow2026
```

### Adobe Reader mostra "Certificado não confiável"

**Para certificados auto-assinados (desenvolvimento):**

1. Abra o PDF no Adobe Reader
2. Clique na assinatura
3. Clique em "Propriedades da Assinatura"
4. Clique em "Mostrar Certificado"
5. Clique em "Confiar"
6. Selecione "Usar este certificado como âncora de confiança"
7. Marque "Assinaturas de documentos"
8. Clique em "OK"

**Para produção:**
- Use certificado ICP-Brasil (já confiável por padrão)

### PDFs não estão sendo assinados digitalmente

```bash
# Verifique os logs do servidor
npm run dev

# Deve aparecer:
# 🔐 Aplicando assinatura digital PKI...
# ✅ Assinatura digital PKI aplicada com sucesso!

# Se aparecer:
# ℹ️ Certificado digital não configurado.
# Então gere o certificado: npm run generate-certificate
```

---

## 📚 Referências

- [Adobe: Como funcionam assinaturas digitais](https://helpx.adobe.com/acrobat/using/digital-signatures.html)
- [ICP-Brasil: Certificação Digital](https://www.gov.br/iti/pt-br/assuntos/icp-brasil)
- [node-signpdf: Documentação](https://www.npmjs.com/package/@signpdf/signpdf)
- [ISO 32000-2: PDF 2.0 Specification](https://www.iso.org/standard/63534.html)
- [MP 2.200-2/2001: Validade jurídica de documentos eletrônicos](http://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm)

---

## ❓ FAQ

### A assinatura digital substitui o QR Code?

Não, ambos são complementares:
- **QR Code**: Validação via web (acessível para qualquer um)
- **Assinatura Digital**: Validação nativa no PDF (mais segura e automática)

### É obrigatório ter certificado digital?

Não. O sistema funciona sem certificado, usando apenas:
- Assinatura visual (imagem)
- QR Code de validação

Mas com certificado digital, você ganha:
- Selo azul no Adobe Reader
- Validade jurídica plena (ICP-Brasil)
- Validação nativa sem depender do QR Code

### Qual a diferença entre certificado auto-assinado e ICP-Brasil?

| Característica | Auto-assinado | ICP-Brasil |
|----------------|---------------|------------|
| **Custo** | Gratuito | R$ 200-500/ano |
| **Validade jurídica** | Limitada | Plena (MP 2.200-2) |
| **Confiança padrão** | Não | Sim |
| **Uso recomendado** | Desenvolvimento | Produção |

### Posso usar o mesmo certificado em múltiplos servidores?

Sim, mas:
- ⚠️ **Risco de segurança** se um servidor for comprometido
- ✅ **Melhor prática**: Um certificado por ambiente

---

## 📧 Suporte

Precisa de ajuda?
- **Issues**: [GitHub Issues](https://github.com/Junio243/signflow/issues)
- **Email**: suporte@signflow.com
- **Documentação**: [signflow.com/docs](https://signflow.com/docs)
