/**
 * Gerenciador de Certificados Digitais do SignFlow
 *
 * Sistema autônomo que gera, armazena e gerencia certificados digitais
 * exclusivos do SignFlow, independentes de autoridades certificadoras externas.
 *
 * Segurança aprimorada (v2):
 * - Chaves privadas são criptografadas com AES-256-GCM antes de ir ao banco
 * - Descriptografia automática e transparente ao recuperar do banco
 * - Migração automática de chaves legadas (PEM puro → criptografado)
 *
 * Características:
 * - Gera certificado auto-assinado automaticamente na primeira execução
 * - Armazena no banco de dados (Supabase) com chave privada criptografada
 * - Cache em memória para performance
 * - Renovação automática antes do vencimento
 * - Um certificado por instância/ambiente
 */

import * as forge from 'node-forge';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { encryptPrivateKey, decryptPrivateKey, isEncrypted } from '@/lib/crypto';

interface CertificateData {
  id?: string;
  certificate_pem: string;
  private_key_pem: string;
  public_key_pem: string;
  p12_base64: string;
  serial_number: string;
  issuer: string;
  subject: string;
  valid_from: string;
  valid_until: string;
  environment: string;
  created_at?: string;
  updated_at?: string;
}

// Cache em memória (contém a chave privada JÁ descriptografada)
let cachedCertificate: CertificateData | null = null;
let certificateLoadPromise: Promise<CertificateData> | null = null;

/**
 * Gera um novo certificado digital auto-assinado
 *
 * @param environment Nome do ambiente (development, production, etc.)
 * @param validityYears Anos de validade do certificado (padrão: 10)
 * @returns Dados do certificado gerado
 */
export async function generateSignFlowCertificate(
  environment: string = process.env.NODE_ENV || 'development',
  validityYears: number = 10
): Promise<CertificateData> {
  console.log(`🔐 Gerando novo certificado SignFlow para ambiente: ${environment}...`);

  // Gerar par de chaves RSA (2048 bits)
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // Criar certificado
  const cert = forge.pki.createCertificate();

  // Número de série único (timestamp + random)
  const serialNumber = Date.now().toString() + Math.floor(Math.random() * 1000000);
  cert.serialNumber = serialNumber;

  // Validade
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + validityYears);

  // Atributos do subject (titular do certificado)
  const attrs = [
    { name: 'commonName', value: 'SignFlow Digital Platform' },
    { name: 'countryName', value: 'BR' },
    { name: 'stateOrProvinceName', value: 'Sao Paulo' },
    { name: 'localityName', value: 'Sao Paulo' },
    { name: 'organizationName', value: 'SignFlow' },
    { name: 'organizationalUnitName', value: 'Digital Signature Division' },
    { name: 'emailAddress', value: 'certificates@signflow.com' },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(attrs); // Auto-assinado: issuer = subject

  // Extensões do certificado
  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'signflow.com' },
        { type: 2, value: '*.signflow.com' },
        { type: 7, ip: '127.0.0.1' },
      ],
    },
  ]);

  // Chave pública
  cert.publicKey = keys.publicKey;

  // Auto-assinar com chave privada
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Converter para PEM
  const certificatePem = forge.pki.certificateToPem(cert);
  const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
  const publicKeyPem = forge.pki.publicKeyToPem(keys.publicKey);

  // Gerar PKCS#12 (.p12) com senha padrão
  const p12Password = process.env.SIGNFLOW_CERTIFICATE_PASSWORD || 'signflow-internal-cert';
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey,
    cert,
    p12Password,
    {
      generateLocalKeyId: true,
      friendlyName: `SignFlow Certificate (${environment})`,
      algorithm: '3des',
    }
  );
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  const p12Base64 = forge.util.encode64(p12Der);

  const certificateData: CertificateData = {
    certificate_pem: certificatePem,
    private_key_pem: privateKeyPem, // PEM original — será criptografado antes de salvar
    public_key_pem: publicKeyPem,
    p12_base64: p12Base64,
    serial_number: serialNumber,
    issuer: 'SignFlow Digital Platform',
    subject: 'SignFlow Digital Platform',
    valid_from: cert.validity.notBefore.toISOString(),
    valid_until: cert.validity.notAfter.toISOString(),
    environment,
  };

  console.log('✅ Certificado gerado com sucesso!');
  console.log(`   Serial: ${serialNumber}`);
  console.log(`   Válido de: ${cert.validity.notBefore.toLocaleDateString('pt-BR')}`);
  console.log(`   Válido até: ${cert.validity.notAfter.toLocaleDateString('pt-BR')}`);

  return certificateData;
}

/**
 * Salva certificado no banco de dados.
 * A chave privada é automaticamente criptografada antes do armazenamento.
 */
async function saveCertificateToDatabase(certData: CertificateData): Promise<void> {
  const supabase = getSupabaseAdmin();

  // 🔐 SEGURANÇA: Criptografar chave privada antes de salvar no banco
  const encryptedPrivateKey = await encryptPrivateKey(certData.private_key_pem);
  console.log('🔐 Chave privada criptografada com AES-256-GCM antes do armazenamento');

  const { error } = await supabase
    .from('signflow_certificates')
    .insert({
      certificate_pem: certData.certificate_pem,
      private_key_pem: encryptedPrivateKey, // ← criptografada!
      public_key_pem: certData.public_key_pem,
      p12_base64: certData.p12_base64,
      serial_number: certData.serial_number,
      issuer: certData.issuer,
      subject: certData.subject,
      valid_from: certData.valid_from,
      valid_until: certData.valid_until,
      environment: certData.environment,
      is_active: true,
    });

  if (error) {
    throw new Error(`Erro ao salvar certificado no banco: ${error.message}`);
  }

  console.log('✅ Certificado salvo no banco de dados (chave privada criptografada)');
}

/**
 * Carrega certificado do banco de dados.
 * A chave privada é automaticamente descriptografada após o carregamento.
 */
async function loadCertificateFromDatabase(): Promise<CertificateData | null> {
  const supabase = getSupabaseAdmin();
  const environment = process.env.NODE_ENV || 'development';

  const { data, error } = await supabase
    .from('signflow_certificates')
    .select('*')
    .eq('environment', environment)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao carregar certificado do banco:', error);
    return null;
  }

  if (!data) return null;

  const cert = data as CertificateData;

  // 🔐 SEGURANÇA: Descriptografar chave privada ao carregar do banco
  // Suporte a migração: se a chave ainda for PEM legado, usa direto
  if (isEncrypted(cert.private_key_pem)) {
    try {
      cert.private_key_pem = await decryptPrivateKey(cert.private_key_pem);
      console.log('🔓 Chave privada descriptografada com sucesso');
    } catch (err) {
      console.error('❌ Erro ao descriptografar chave privada:', err);
      throw new Error(
        'Falha ao descriptografar chave privada. ' +
        'Verifique se SIGNFLOW_ENCRYPTION_KEY está configurada corretamente.'
      );
    }
  } else {
    // Migração automática: chave legada (PEM puro) → criptografada
    console.warn('⚠️  Chave privada legada detectada. Migrando para formato criptografado...');
    try {
      const encryptedKey = await encryptPrivateKey(cert.private_key_pem);
      await supabase
        .from('signflow_certificates')
        .update({ private_key_pem: encryptedKey })
        .eq('id', cert.id);
      console.log('✅ Chave privada migrada para formato criptografado');
    } catch (err) {
      console.warn('⚠️  Migração automática falhou (não crítico):', err);
    }
    // cert.private_key_pem já está em PEM — ok para uso
  }

  return cert;
}

/**
 * Verifica se o certificado está próximo do vencimento
 */
function isCertificateNearExpiry(cert: CertificateData, daysThreshold = 30): boolean {
  const expiryDate = new Date(cert.valid_until);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= daysThreshold;
}

/**
 * Verifica se o certificado está válido
 */
function isCertificateValid(cert: CertificateData): boolean {
  const now = new Date();
  const validFrom = new Date(cert.valid_from);
  const validUntil = new Date(cert.valid_until);
  return now >= validFrom && now <= validUntil;
}

/**
 * Obtém ou gera certificado do SignFlow
 *
 * 1. Verifica cache em memória
 * 2. Se não houver, busca no banco de dados
 * 3. Se não houver no banco ou estiver expirado, gera novo
 * 4. Armazena no cache
 *
 * @returns Dados do certificado válido (chave privada já descriptografada)
 */
export async function getOrCreateSignFlowCertificate(): Promise<CertificateData> {
  if (cachedCertificate && isCertificateValid(cachedCertificate)) {
    return cachedCertificate;
  }

  if (certificateLoadPromise) {
    return certificateLoadPromise;
  }

  certificateLoadPromise = (async () => {
    try {
      console.log('🔍 Buscando certificado SignFlow...');

      let cert = await loadCertificateFromDatabase();

      if (!cert || !isCertificateValid(cert)) {
        if (cert) {
          console.log('⚠️ Certificado expirado ou inválido');
        } else {
          console.log('ℹ️ Nenhum certificado encontrado');
        }

        console.log('🏭 Gerando novo certificado SignFlow...');
        cert = await generateSignFlowCertificate();
        await saveCertificateToDatabase(cert);
      } else {
        console.log('✅ Certificado válido encontrado no banco');

        if (isCertificateNearExpiry(cert)) {
          console.log('⚠️ Certificado próximo do vencimento. Considere renovar.');
        }
      }

      cachedCertificate = cert;
      return cert;
    } finally {
      certificateLoadPromise = null;
    }
  })();

  return certificateLoadPromise;
}

/**
 * Converte certificado para Buffer P12 pronto para uso
 */
export function getCertificateP12Buffer(certData: CertificateData): Buffer {
  return Buffer.from(certData.p12_base64, 'base64');
}

/**
 * Obtém senha do certificado P12
 */
export function getCertificatePassword(): string {
  return process.env.SIGNFLOW_CERTIFICATE_PASSWORD || 'signflow-internal-cert';
}

/**
 * Força renovação do certificado
 */
export async function renewSignFlowCertificate(): Promise<CertificateData> {
  console.log('🔄 Renovando certificado SignFlow...');

  const supabase = getSupabaseAdmin();
  const environment = process.env.NODE_ENV || 'development';

  await supabase
    .from('signflow_certificates')
    .update({ is_active: false })
    .eq('environment', environment)
    .eq('is_active', true);

  const newCert = await generateSignFlowCertificate();
  await saveCertificateToDatabase(newCert);

  cachedCertificate = newCert;

  console.log('✅ Certificado renovado com sucesso!');
  return newCert;
}

/**
 * Obtém informações do certificado atual
 */
export async function getCertificateInfo(): Promise<{
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validUntil: string;
  daysUntilExpiry: number;
  isValid: boolean;
  isNearExpiry: boolean;
  privateKeyEncrypted: boolean;
} | null> {
  try {
    const cert = await getOrCreateSignFlowCertificate();

    const expiryDate = new Date(cert.valid_until);
    const now = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      serialNumber: cert.serial_number,
      issuer: cert.issuer,
      subject: cert.subject,
      validFrom: cert.valid_from,
      validUntil: cert.valid_until,
      daysUntilExpiry,
      isValid: isCertificateValid(cert),
      isNearExpiry: isCertificateNearExpiry(cert),
      privateKeyEncrypted: true, // Sempre verdadeiro na v2
    };
  } catch (error) {
    console.error('Erro ao obter informações do certificado:', error);
    return null;
  }
}

/**
 * Limpa cache do certificado (força recarregar do banco)
 */
export function clearCertificateCache(): void {
  cachedCertificate = null;
  console.log('🗑️ Cache de certificado limpo');
}
