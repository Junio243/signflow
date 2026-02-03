# 🔐 Assinatura Digital PKI

## Visão Geral

O SignFlow agora suporta **assinatura digital com certificado PKI** (Public Key Infrastructure), tornando os PDFs assinados **reconhecidos nativamente** por leitores como Adobe Acrobat Reader, Foxit PDF e outros.

## ✨ Benefícios

| Recurso | Sem PKI | Com PKI |
|---------|---------|--------|
| **Assinatura visual** | ✅ | ✅ |
| **QR Code de validação** | ✅ | ✅ |
| **Selo azul no Adobe Reader** | ❌ | ✅ |
| **Validação nativa no PDF** | ❌ | ✅ |
| **Prova criptográfica de integridade** | ❌ | ✅ |
| **Validade jurídica plena** | ⚠️ Limitada | ✅ Total |
| **Timestamp protegido** | ❌ | ✅ |
| **Não-repúdio** | ❌ | ✅ |

---

## 🛠️ Configuração

### Opção 1: Certificado de Teste (Desenvolvimento)

**1. Gerar certificado auto-assinado:**

```bash
npm run generate-certificate
```

Isso criará:
- `certificates/certificate.p12` - Certificado para assinatura
- Senha padrão: `signflow2026`

**2. Configurar variável de ambiente:**

Adicione no `.env.local`:

```env
CERTIFICATE_PASSWORD=signflow2026
```

**3. Reiniciar servidor:**

```bash
npm run dev
```

✅ **Pronto!** PDFs assinados agora incluirão assinatura digital PKI.

---

### Opção 2: Certificado de Produção (ICP-Brasil)

Para validade jurídica total no Brasil:

**1. Adquirir certificado ICP-Brasil:**

- **e-CPF** (Pessoa Física): R$ 200-400/ano
- **e-CNPJ** (Pessoa Jurídica): R$ 400-600/ano

Autoridadoras certificadoras:
- Certisign
- Serasa
- Soluti
- Valid

**2. Exportar para formato P12:**

Se você já tem o certificado A1:
1. Abra o Gerenciador de Certificados (Windows) ou Keychain (macOS)
2. Localize seu certificado ICP-Brasil
3. Exporte para formato `.p12` ou `.pfx`
4. Defina uma senha forte

**3. Configurar no SignFlow:**

```bash
# Copiar certificado para a pasta
mkdir -p certificates
cp /caminho/do/seu/certificado.p12 certificates/certificate.p12
```

Adicione no `.env.local`:

```env
CERTIFICATE_PASSWORD=sua_senha_forte_aqui
```

**4. Deploy no Vercel:**

```bash
# Fazer upload do certificado (criptografado)
vercel env add CERTIFICATE_P12_BASE64
# Cole o conteúdo: cat certificates/certificate.p12 | base64

vercel env add CERTIFICATE_PASSWORD
# Digite a senha do certificado
```

No código, descodifique em runtime:

```typescript
// Adicionar em lib/digitalSignature.ts
if (process.env.CERTIFICATE_P12_BASE64) {
  const certBuffer = Buffer.from(process.env.CERTIFICATE_P12_BASE64, 'base64');
  // Salvar temporário em /tmp para uso
}
```

---

## 📝 Como Funciona

### Fluxo Completo de Assinatura

```
1. Usuário faz upload do PDF
   ↓
2. Sistema adiciona assinaturas visuais (imagens)
   ↓
3. Sistema insere QR Code de validação
   ↓
4. Sistema adiciona placeholder de assinatura digital
   ↓
5. Sistema assina com certificado P12 (PKCS#7)
   ↓
6. PDF final contém:
   • Assinaturas visuais
   • QR Code
   • Assinatura digital PKI (invisível mas validável)
   ↓
7. Adobe Reader valida automaticamente e exibe selo azul ✅
```

### Tecnologias Utilizadas

- **[@signpdf/signpdf](https://www.npmjs.com/package/@signpdf/signpdf)** - Assinatura digital em PDFs
- **PKCS#7** - Padrão de assinatura criptográfica
- **P12/PFX** - Formato de certificado digital
- **ICP-Brasil** - Infraestrutura de Chaves Públicas Brasileira

---

## 🧪 Testando a Assinatura Digital

### 1. Assinar um Documento

1. Faça upload de um PDF no SignFlow
2. Adicione assinaturas visuais
3. Clique em "Assinar Documento"

### 2. Validar no Adobe Reader

1. Baixe o PDF assinado
2. Abra no **Adobe Acrobat Reader DC**
3. Observe:

**Com certificado auto-assinado (teste):**
- 🟡 **Selo amarelo**: "Assinado e todas as assinaturas são válidas"
- ⚠️ Aviso: "A identidade do signatário não foi verificada"
- Para remover o aviso: Adicionar certificado à lista confiável

**Com certificado ICP-Brasil (produção):**
- 🟢 **Selo azul**: "Assinado e todas as assinaturas são válidas"
- ✅ "Assinado por: [Seu Nome/Empresa]"
- ✅ "Certificado emitido por: [AC ICP-Brasil]"

### 3. Painel de Assinaturas

1. No Adobe Reader, clique no painel **"Assinaturas"** (lado esquerdo)
2. Você verá:
   - ✅ **Nome do signatário**
   - ✅ **Data/hora da assinatura**
   - ✅ **Local**: SignFlow Platform
   - ✅ **Motivo**: Documento assinado digitalmente via SignFlow
   - ✅ **Certificado**: Detalhes completos

---

## 🔍 Solução de Problemas

### Erro: "Certificado não encontrado"

```bash
# Verificar se certificado existe
ls -la certificates/certificate.p12

# Se não existir, gerar:
npm run generate-certificate
```

### Erro: "Senha do certificado inválida"

```bash
# Verificar variável de ambiente
echo $CERTIFICATE_PASSWORD

# Ou checar no .env.local
cat .env.local | grep CERTIFICATE_PASSWORD
```

### PDF sem selo azul no Adobe Reader

**Certificado auto-assinado:**
1. Isso é esperado para certificados de teste
2. Adobe Reader exibe selo amarelo com aviso
3. Para produo, use certificado ICP-Brasil

**Certificado ICP-Brasil:**
1. Verificar se certificado é válido (não expirado)
2. Verificar se Adobe Reader está atualizado
3. Verificar conexão com internet (validação OCSP)

### Assinatura digital não está sendo aplicada

**Verificar logs do servidor:**

```bash
npm run dev
# Ao assinar documento, procure por:
# 🔐 Aplicando assinatura digital PKI...
# ✅ Assinatura digital PKI aplicada com sucesso!
```

**Se aparecer:**
- `ℹ️ Certificado digital não configurado` → Gerar certificado
- `⚠️ Erro ao aplicar assinatura digital PKI` → Verificar logs de erro

---

## 📚 Referências

### Documentação Oficial

- [Adobe: Como funcionam assinaturas digitais](https://helpx.adobe.com/br/acrobat/using/digital-signatures.html)
- [ICP-Brasil: Certificação Digital](https://www.gov.br/iti/pt-br/assuntos/icp-brasil)
- [node-signpdf: Documentação](https://github.com/vbuch/node-signpdf)
- [ISO 32000-2: PDF 2.0 Specification](https://www.iso.org/standard/63534.html)

### Legislação Brasileira

- **MP 2.200-2/2001**: Institui a ICP-Brasil
- **Lei 14.063/2020**: Uso de assinaturas eletrônicas
- **Decreto 10.543/2020**: Regulamenta assinatura eletrônica

### Validade Jurídica

| Tipo de Assinatura | Validade | Casos de Uso |
|-------------------|----------|-------------|
| **Assinatura Simples** (QR Code) | Baixa | Documentos internos, acordos simples |
| **Assinatura Avançada** (PKI auto-assinado) | Média | Contratos entre empresas, workflows |
| **Assinatura Qualificada** (ICP-Brasil) | **Plena** | Contratos, procurações, documentos oficiais |

---

## ❓ FAQ

### Qual a diferença entre assinatura visual e digital?

**Assinatura Visual:**
- 🖼️ Imagem da assinatura inserida no PDF
- 👁️ Visível para qualquer leitor
- ❌ Não comprova integridade tecnicamente

**Assinatura Digital PKI:**
- 🔐 Dados criptográficos embutidos no PDF
- 🔍 Invisível, mas validável por leitores
- ✅ Prova matemática de integridade
- ✅ Identifica o signatário via certificado

**SignFlow usa AMBAS** para máxima compatibilidade!

### Preciso de certificado ICP-Brasil?

**Para desenvolvimento:**
- ❌ Não. Use certificado auto-assinado (gratuito)

**Para produo:**
- ✅ **Sim, se** precisar de validade jurídica plena no Brasil
- ✅ **Sim, se** clientes exigirem certificado confiável
- ❌ **Não, se** for apenas para controle interno

### O QR Code ainda é necessário?

✅ **Sim!** O QR Code oferece:
- Validação via navegador (sem precisar do Adobe)
- Interface amigável para usuários leigos
- Backup de validação caso a PKI falhe

A assinatura digital PKI **complementa** o QR Code, não o substitui.

### Quanto custa um certificado ICP-Brasil?

| Tipo | Validade | Preço Médio |
|------|----------|-------------|
| **e-CPF A1** (pessoa física) | 1 ano | R$ 200-400 |
| **e-CNPJ A1** (pessoa jurídica) | 1 ano | R$ 400-600 |
| **e-CPF A3** (cartão/token) | 1-3 anos | R$ 250-500 |
| **e-CNPJ A3** (cartão/token) | 1-3 anos | R$ 500-800 |

**Recomendação:** Use **A1** para servidores (mais fácil de integrar).

---

## 🚀 Próximos Passos

1. ✅ Gerar certificado de teste: `npm run generate-certificate`
2. ✅ Configurar `.env.local` com senha
3. ✅ Testar assinatura no Adobe Reader
4. 🔲 Adquirir certificado ICP-Brasil para produção
5. 🔲 Configurar certificado em produção (Vercel)
6. 🔲 Notificar clientes sobre selo azul de validação

---

## 💬 Suporte

Dúvidas ou problemas? Abra uma [issue no GitHub](https://github.com/Junio243/signflow/issues).
