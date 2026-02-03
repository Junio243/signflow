#!/bin/bash

# Script para gerar certificado digital P12/PFX para assinatura de PDFs
# Uso: npm run generate-certificate

set -e

echo "====================================="
echo "🔐 Gerador de Certificado Digital PKI"
echo "====================================="
echo ""

# Cria diretório de certificados se não existir
if [ ! -d "certificates" ]; then
  echo "📁 Criando diretório certificates/..."
  mkdir -p certificates
fi

# Verifica se OpenSSL está instalado
if ! command -v openssl &> /dev/null; then
  echo "❌ Erro: OpenSSL não está instalado."
  echo "💻 Instale o OpenSSL:"
  echo "   - macOS: brew install openssl"
  echo "   - Ubuntu/Debian: sudo apt-get install openssl"
  echo "   - Windows: https://slproweb.com/products/Win32OpenSSL.html"
  exit 1
fi

echo "✅ OpenSSL encontrado: $(openssl version)"
echo ""

# Coleta informações do usuário
read -p "🇧🇷 País (default: BR): " COUNTRY
COUNTRY=${COUNTRY:-BR}

read -p "📍 Estado (default: Sao Paulo): " STATE
STATE=${STATE:-Sao Paulo}

read -p "🌆 Cidade (default: Sao Paulo): " CITY
CITY=${CITY:-Sao Paulo}

read -p "🏢 Organização (default: SignFlow): " ORG
ORG=${ORG:-SignFlow}

read -p "👥 Departamento (default: Digital Signature): " DEPT
DEPT=${DEPT:-Digital Signature}

read -p "👤 Nome Comum/CN (default: SignFlow Certificate): " CN
CN=${CN:-SignFlow Certificate}

read -sp "🔑 Senha do certificado (min 4 caracteres): " PASSWORD
echo ""

if [ ${#PASSWORD} -lt 4 ]; then
  echo "❌ Erro: Senha deve ter pelo menos 4 caracteres"
  exit 1
fi

echo ""
echo "🔧 Gerando certificado digital..."
echo ""

# 1. Gerar chave privada RSA 2048 bits
echo "1/3 Gerando chave privada RSA..."
openssl genrsa -out certificates/private-key.pem 2048 2>/dev/null
echo "✅ Chave privada gerada: certificates/private-key.pem"

# 2. Criar certificado auto-assinado (válido por 10 anos)
echo ""
echo "2/3 Criando certificado auto-assinado..."
openssl req -new -x509 -key certificates/private-key.pem \
  -out certificates/certificate.pem \
  -days 3650 \
  -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/OU=$DEPT/CN=$CN" 2>/dev/null
echo "✅ Certificado criado: certificates/certificate.pem"

# 3. Converter para formato P12/PFX
echo ""
echo "3/3 Convertendo para formato P12/PFX..."
openssl pkcs12 -export \
  -out certificates/certificate.p12 \
  -inkey certificates/private-key.pem \
  -in certificates/certificate.pem \
  -password pass:$PASSWORD 2>/dev/null
echo "✅ Certificado P12 gerado: certificates/certificate.p12"

echo ""
echo "====================================="
echo "✅ Certificado gerado com sucesso!"
echo "====================================="
echo ""
echo "📄 Arquivos gerados:"
echo "   - certificates/private-key.pem    (chave privada)"
echo "   - certificates/certificate.pem    (certificado X.509)"
echo "   - certificates/certificate.p12    (certificado P12 - usar este!)"
echo ""
echo "🔑 Senha do certificado: [OCULTA]"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Adicione a senha ao arquivo .env.local:"
echo "      CERTIFICATE_PASSWORD=sua_senha_aqui"
echo ""
echo "   2. NUNCA commite os arquivos de certificado para o Git!"
echo "      (Já está configurado no .gitignore)"
echo ""
echo "   3. Para produção, use um certificado de CA confiável:"
echo "      - Brasil: ICP-Brasil (e-CPF, e-CNPJ)"
echo "      - Internacional: GlobalSign, DigiCert, Sectigo"
echo ""
echo "📦 Próximos passos:"
echo "   1. Configure a senha no .env.local"
echo "   2. Teste assinando um documento"
echo "   3. Abra o PDF no Adobe Reader para validar"
echo ""
echo "📚 Documentação completa: docs/DIGITAL_SIGNATURE.md"
echo "====================================="
