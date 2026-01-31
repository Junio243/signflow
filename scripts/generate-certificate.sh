#!/bin/bash

# Script para gerar certificado digital auto-assinado para desenvolvimento
# Para produção, usar certificado de CA confiável (ICP-Brasil, GlobalSign, etc.)

echo "🔐 Gerando certificado digital para SignFlow..."
echo ""

# Criar pasta certificates se não existir
mkdir -p certificates

# Verificar se OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL não encontrado!"
    echo "Instale com: apt-get install openssl (Linux) ou brew install openssl (Mac)"
    exit 1
fi

echo "1/3 Gerando chave privada RSA 2048 bits..."
openssl genrsa -out certificates/private-key.pem 2048

if [ $? -ne 0 ]; then
    echo "❌ Erro ao gerar chave privada"
    exit 1
fi

echo "✅ Chave privada gerada: certificates/private-key.pem"
echo ""

echo "2/3 Criando certificado auto-assinado (válido por 10 anos)..."
openssl req -new -x509 -key certificates/private-key.pem -out certificates/certificate.pem -days 3650 \
  -subj "/C=BR/ST=Sao Paulo/L=Sao Paulo/O=SignFlow/OU=Digital Signature/CN=SignFlow Certificate"

if [ $? -ne 0 ]; then
    echo "❌ Erro ao criar certificado"
    exit 1
fi

echo "✅ Certificado gerado: certificates/certificate.pem"
echo ""

echo "3/3 Convertendo para formato P12/PFX..."
echo "Senha do certificado: signflow2026"
openssl pkcs12 -export -out certificates/certificate.p12 \
  -inkey certificates/private-key.pem \
  -in certificates/certificate.pem \
  -password pass:signflow2026

if [ $? -ne 0 ]; then
    echo "❌ Erro ao converter para P12"
    exit 1
fi

echo "✅ Certificado P12 gerado: certificates/certificate.p12"
echo ""

echo "✨ Certificado digital criado com sucesso!"
echo ""
echo "📝 Informações do certificado:"
echo "  - Arquivo: certificates/certificate.p12"
echo "  - Senha: signflow2026"
echo "  - Validade: 10 anos"
echo "  - Emissor: SignFlow (auto-assinado)"
echo ""
echo "⚠️  IMPORTANTE:"
echo "  - Este é um certificado AUTO-ASSINADO para desenvolvimento"
echo "  - Leitores de PDF mostrarão aviso 'certificado não confiável'"
echo "  - Para produção, use certificado de CA confiável:"
echo "    * Brasil: ICP-Brasil (e-CPF, e-CNPJ)"
echo "    * Internacional: GlobalSign, DigiCert, Sectigo"
echo ""
echo "✅ Para usar o certificado, adicione no .env.local:"
echo "   CERTIFICATE_PATH=./certificates/certificate.p12"
echo "   CERTIFICATE_PASSWORD=signflow2026"
