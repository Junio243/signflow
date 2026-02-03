#!/bin/bash

# Script para gerar certificado digital de teste para assinatura PKI
# Para produção, use certificados emitidos por CA confiável (ICP-Brasil, GlobalSign, etc.)

set -e

echo "🔐 Gerando certificado digital de teste para SignFlow..."
echo ""

# Criar pasta certificates se não existir
mkdir -p certificates
cd certificates

# Configurar variáveis
COUNTRY="BR"
STATE="Sao Paulo"
CITY="Sao Paulo"
ORGANIZATION="SignFlow"
ORGANIZATIONAL_UNIT="Digital Signature"
COMMON_NAME="SignFlow Certificate"
EMAIL="suporte@signflow.com"
PASSWORD="signflow2026"
VALIDITY_DAYS=3650  # 10 anos

echo "1/3 Gerando chave privada..."
openssl genrsa -out private-key.pem 2048 2>/dev/null

echo "2/3 Criando certificado auto-assinado (válido por 10 anos)..."
openssl req -new -x509 \
  -key private-key.pem \
  -out certificate.pem \
  -days $VALIDITY_DAYS \
  -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORGANIZATIONAL_UNIT/CN=$COMMON_NAME/emailAddress=$EMAIL" \
  2>/dev/null

echo "3/3 Convertendo para formato P12/PFX..."
openssl pkcs12 -export \
  -out certificate.p12 \
  -inkey private-key.pem \
  -in certificate.pem \
  -password pass:$PASSWORD \
  2>/dev/null

cd ..

echo ""
echo "✅ Certificado gerado com sucesso!"
echo ""
echo "📝 Arquivos criados:"
echo "  - certificates/private-key.pem   (Chave privada)"
echo "  - certificates/certificate.pem   (Certificado)"
echo "  - certificates/certificate.p12   (Certificado P12 para assinatura)"
echo ""
echo "🔑 Senha do certificado: $PASSWORD"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  1. Este é um certificado AUTO-ASSINADO apenas para TESTES"
echo "  2. Adobe Reader mostrará aviso 'certificado não confiável'"
echo "  3. Para PRODUÇÃO, use certificado de CA confiável (ICP-Brasil)"
echo ""
echo "🚀 Próximos passos:"
echo "  1. Adicione no .env.local:"
echo "     CERTIFICATE_PASSWORD=$PASSWORD"
echo ""
echo "  2. Reinicie o servidor: npm run dev"
echo ""
echo "  3. PDFs assinados agora terão assinatura digital PKI!"
echo ""
