#!/bin/bash

# Script para gerar certificado digital auto-assinado para desenvolvimento
# Para produção, use certificados de uma CA confiável (ICP-Brasil, GlobalSign, etc.)

set -e

echo "🔐 Gerando Certificado Digital para SignFlow"
echo "============================================="
echo ""

# Criar pasta de certificados se não existir
mkdir -p certificates

# Configurações do certificado
COUNTRY="BR"
STATE="Sao Paulo"
CITY="Sao Paulo"
ORGANIZATION="SignFlow"
ORGANIZATIONAL_UNIT="Digital Signature"
COMMON_NAME="SignFlow Certificate"
EMAIL="suporte@signflow.com"
VALIDITY_DAYS=3650  # 10 anos
PASSWORD="signflow2026"

echo "📝 Configurações:"
echo "   País: $COUNTRY"
echo "   Estado: $STATE"
echo "   Cidade: $CITY"
echo "   Organização: $ORGANIZATION"
echo "   Nome Comum: $COMMON_NAME"
echo "   Validade: $VALIDITY_DAYS dias ($(($VALIDITY_DAYS / 365)) anos)"
echo "   Senha: $PASSWORD"
echo ""

# Verificar se OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo "❌ Erro: OpenSSL não está instalado"
    echo "   Instale com: brew install openssl (macOS) ou apt-get install openssl (Linux)"
    exit 1
fi

echo "1️⃣ Gerando chave privada RSA (2048 bits)..."
openssl genrsa -out certificates/private-key.pem 2048 2>/dev/null
echo "   ✅ Chave privada criada: certificates/private-key.pem"
echo ""

echo "2️⃣ Criando certificado auto-assinado X.509..."
openssl req -new -x509 \
  -key certificates/private-key.pem \
  -out certificates/certificate.pem \
  -days $VALIDITY_DAYS \
  -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$COMMON_NAME/emailAddress=$EMAIL" \
  2>/dev/null
echo "   ✅ Certificado criado: certificates/certificate.pem"
echo ""

echo "3️⃣ Convertendo para formato P12/PFX..."
openssl pkcs12 -export \
  -out certificates/certificate.p12 \
  -inkey certificates/private-key.pem \
  -in certificates/certificate.pem \
  -password pass:$PASSWORD \
  2>/dev/null
echo "   ✅ Certificado P12 criado: certificates/certificate.p12"
echo ""

echo "4️⃣ Extraindo informações do certificado..."
CERT_INFO=$(openssl x509 -in certificates/certificate.pem -noout -subject -dates 2>/dev/null)
echo "$CERT_INFO"
echo ""

echo "✨ Certificado gerado com sucesso!"
echo ""
echo "📂 Arquivos criados:"
echo "   - certificates/private-key.pem    (Chave privada)"
echo "   - certificates/certificate.pem    (Certificado X.509)"
echo "   - certificates/certificate.p12    (Certificado P12 para uso)"
echo ""
echo "🔧 Próximos passos:"
echo "   1. Configure a variável de ambiente no .env.local:"
echo "      CERTIFICATE_PASSWORD=$PASSWORD"
echo ""
echo "   2. Reinicie o servidor Next.js:"
echo "      npm run dev"
echo ""
echo "⚠️  Nota: Este é um certificado AUTO-ASSINADO para desenvolvimento"
echo "   Para produção, adquira um certificado de uma CA confiável:"
echo "   - ICP-Brasil (e-CPF, e-CNPJ): https://www.gov.br/iti/pt-br/assuntos/icp-brasil"
echo "   - GlobalSign: https://www.globalsign.com"
echo "   - DigiCert: https://www.digicert.com"
echo ""
echo "🔒 O Adobe Reader exibirá aviso 'certificado não confiável' até que você:"
echo "   - Adicione o certificado à lista de certificados confiáveis do Adobe"
echo "   - Ou use um certificado de CA confiável em produção"
echo ""
