#!/bin/bash

# Script para gerar certificado digital P12 para testes
# Uso: bash scripts/generate-certificate.sh

echo "🔐 Gerando certificado digital P12 para testes..."
echo ""

# Criar pasta de certificados se não existir
mkdir -p certificates

# Verificar se OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo "❌ Erro: OpenSSL não está instalado."
    echo "Instale com: sudo apt-get install openssl (Linux) ou brew install openssl (macOS)"
    exit 1
fi

# Gerar chave privada
echo "1/3 Gerando chave privada..."
openssl genrsa -out certificates/private-key.pem 2048 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar chave privada"
    exit 1
fi

echo "✅ Chave privada gerada: certificates/private-key.pem"
echo ""

# Criar certificado auto-assinado
echo "2/3 Criando certificado auto-assinado..."
openssl req -new -x509 -key certificates/private-key.pem -out certificates/certificate.pem -days 3650 \
  -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=SignFlow/OU=Digital Signature/CN=SignFlow Certificate" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar certificado"
    exit 1
fi

echo "✅ Certificado criado: certificates/certificate.pem"
echo ""

# Converter para formato P12
echo "3/3 Convertendo para formato P12..."
openssl pkcs12 -export -out certificates/certificate.p12 \
  -inkey certificates/private-key.pem \
  -in certificates/certificate.pem \
  -password pass:signflow2026 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Erro ao converter para P12"
    exit 1
fi

echo "✅ Certificado P12 gerado: certificates/certificate.p12"
echo ""
echo "✨ Certificado digital gerado com sucesso!"
echo ""
echo "Informações:"
echo "  - Arquivo: certificates/certificate.p12"
echo "  - Senha: signflow2026"
echo "  - Validade: 10 anos"
echo "  - Tipo: Auto-assinado (apenas para testes)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - Este certificado é apenas para desenvolvimento/testes"
echo "  - Para produção, use certificado de CA confiável (ICP-Brasil, etc.)"
echo "  - Não versione este arquivo (já está no .gitignore)"
echo ""
echo "Próximos passos:"
echo "  1. Configure a senha no .env.local:"
echo "     CERTIFICATE_PASSWORD=signflow2026"
echo "  2. Execute 'npm run dev' e teste assinando um documento"
echo "  3. Abra o PDF no Adobe Reader para ver o selo de assinatura digital"
echo ""
