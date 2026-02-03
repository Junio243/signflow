#!/bin/bash

# Script para gerar certificado digital de teste para SignFlow
# Para uso em DESENVOLVIMENTO apenas
# Para PRODUÇÃO, adquira um certificado ICP-Brasil

set -e

echo "🔐 Gerando certificado digital de teste para SignFlow..."
echo ""

# Criar pasta certificates se não existir
mkdir -p certificates

# Solicitar senha do certificado
read -sp "🔑 Digite uma senha para o certificado (recomendado: signflow2026): " CERT_PASSWORD
echo ""

# Validar senha
if [ -z "$CERT_PASSWORD" ]; then
  echo "❌ Senha não pode ser vazia!"
  exit 1
fi

echo "🔍 Senha definida com sucesso!"
echo ""

echo "1/4 Gerando chave privada RSA (2048 bits)..."
openssl genrsa -out certificates/private-key.pem 2048 2>/dev/null
echo "✅ Chave privada gerada: certificates/private-key.pem"
echo ""

echo "2/4 Gerando certificado auto-assinado (válido por 10 anos)..."
openssl req -new -x509 -key certificates/private-key.pem -out certificates/certificate.pem -days 3650 \
  -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=SignFlow/OU=Digital Signature/CN=SignFlow Development Certificate" \
  2>/dev/null
echo "✅ Certificado gerado: certificates/certificate.pem"
echo ""

echo "3/4 Convertendo para formato P12/PFX..."
openssl pkcs12 -export -out certificates/certificate.p12 \
  -inkey certificates/private-key.pem \
  -in certificates/certificate.pem \
  -password pass:$CERT_PASSWORD \
  2>/dev/null
echo "✅ Certificado P12 gerado: certificates/certificate.p12"
echo ""

echo "4/4 Configurando variáveis de ambiente..."
if [ ! -f ".env.local" ]; then
  touch .env.local
fi

# Remover linhas antigas se existirem
sed -i '' '/CERTIFICATE_PATH/d' .env.local 2>/dev/null || sed -i '/CERTIFICATE_PATH/d' .env.local 2>/dev/null || true
sed -i '' '/CERTIFICATE_PASSWORD/d' .env.local 2>/dev/null || sed -i '/CERTIFICATE_PASSWORD/d' .env.local 2>/dev/null || true

# Adicionar novas variáveis
echo "" >> .env.local
echo "# Certificado Digital PKI" >> .env.local
echo "CERTIFICATE_PATH=./certificates/certificate.p12" >> .env.local
echo "CERTIFICATE_PASSWORD=$CERT_PASSWORD" >> .env.local

echo "✅ Variáveis adicionadas ao .env.local"
echo ""

echo "✨ Certificado digital gerado com sucesso!"
echo ""
echo "📝 Arquivos criados:"
echo "  • certificates/private-key.pem (chave privada)"
echo "  • certificates/certificate.pem (certificado público)"
echo "  • certificates/certificate.p12 (certificado PKCS#12)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. Este é um certificado AUTO-ASSINADO para DESENVOLVIMENTO"
echo "  2. Adobe Reader mostrará 'certificado não confiável' até ser adicionado manualmente"
echo "  3. Para PRODUÇÃO, adquira certificado ICP-Brasil (e-CPF/e-CNPJ)"
echo "  4. Não versione a pasta certificates/ (já está no .gitignore)"
echo ""
echo "🚀 Próximos passos:"
echo "  1. Reinicie o servidor de desenvolvimento: npm run dev"
echo "  2. Assine um documento no SignFlow"
echo "  3. Baixe o PDF e abra no Adobe Reader"
echo "  4. Verifique o painel 'Assinaturas' no PDF"
echo ""
echo "🔗 Recursos:"
echo "  • ICP-Brasil: https://www.gov.br/iti/pt-br/assuntos/icp-brasil"
echo "  • Certificados válidos: https://www.serpro.gov.br/links-fixos-superiores/assinador-digital/certificado-digital"
echo ""
