/**
 * Módulo de Extração de Dados de Certificados Digitais
 * 
 * Extrai informações de certificados P12/PFX:
 * - Nome do titular
 * - CPF/CNPJ
 * - E-mail
 * - Validade (início e fim)
 * - Emissor (Autoridade Certificadora)
 * - Serial Number
 * - Fingerprint
 * 
 * Suporta certificados ICP-Brasil (e-CPF, e-CNPJ) e certificados personalizados.
 * 
 * @requires node-forge
 */

import forge from 'node-forge';

/**
 * Dados extraídos de um certificado digital
 */
export interface ExtractedCertificateData {
  /** Nome completo do titular */
  commonName: string;
  
  /** E-mail do titular */
  email?: string;
  
  /** CPF (apenas e-CPF) */
  cpf?: string;
  
  /** CNPJ (apenas e-CNPJ) */
  cnpj?: string;
  
  /** Organização (empresa) */
  organization?: string;
  
  /** Unidade organizacional */
  organizationalUnit?: string;
  
  /** País (BR para Brasil) */
  country?: string;
  
  /** Estado/Província */
  state?: string;
  
  /** Cidade/Localidade */
  locality?: string;
  
  /** Data de início de validade */
  validFrom: Date;
  
  /** Data de expiração */
  validUntil: Date;
  
  /** Dias restantes de validade */
  daysRemaining: number;
  
  /** Certificado está válido? */
  isValid: boolean;
  
  /** Certificado expirou? */
  isExpired: boolean;
  
  /** Emissor (Autoridade Certificadora) */
  issuer: string;
  
  /** Número de série do certificado */
  serialNumber: string;
  
  /** Fingerprint SHA-256 */
  fingerprint: string;
  
  /** Tipo de certificado (e-CPF, e-CNPJ, custom) */
  certificateType: 'e-CPF' | 'e-CNPJ' | 'custom';
  
  /** Algoritmo de chave pública */
  keyAlgorithm: string;
  
  /** Tamanho da chave em bits */
  keySize: number;
  
  /** Subject DN completo */
  subjectDN: string;
  
  /** Issuer DN completo */
  issuerDN: string;
}

/**
 * Extrai dados de um certificado P12/PFX
 * 
 * Lê o arquivo .p12 ou .pfx e extrai todas as informações relevantes
 * do certificado digital, incluindo identificação do titular, validade,
 * e metadados.
 * 
 * @param p12Buffer Buffer do arquivo P12/PFX
 * @param password Senha do certificado
 * @returns Dados extraídos do certificado
 * @throws Error se senha incorreta ou formato inválido
 * 
 * @example
 * ```typescript
 * const certificateData = await extractCertificateData(p12Buffer, 'senha123');
 * console.log(`Nome: ${certificateData.commonName}`);
 * console.log(`CPF: ${certificateData.cpf}`);
 * console.log(`Válido até: ${certificateData.validUntil}`);
 * ```
 */
export async function extractCertificateData(
  p12Buffer: Buffer,
  password: string
): Promise<ExtractedCertificateData> {
  try {
    console.log('🔍 Extraindo dados do certificado P12...');

    // Converter Buffer para formato node-forge
    const p12Der = forge.util.decode64(p12Buffer.toString('base64'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);

    // Decriptar PKCS#12 com senha
    let p12: forge.pkcs12.Pkcs12Pfx;
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (error) {
      throw new Error('Senha incorreta ou formato P12 inválido');
    }

    // Obter bags (contéineres) do P12
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];

    if (!certBag || certBag.length === 0) {
      throw new Error('Nenhum certificado encontrado no arquivo P12');
    }

    // Pegar primeiro certificado (geralmente o certificado do usuário)
    const cert = certBag[0].cert;
    if (!cert) {
      throw new Error('Certificado inválido');
    }

    console.log('✅ Certificado carregado com sucesso');

    // Extrair Subject (titular)
    const subject = cert.subject.attributes;
    const issuer = cert.issuer.attributes;

    // Helper para buscar atributos
    const getAttribute = (attrs: any[], name: string): string | undefined => {
      const attr = attrs.find(a => a.name === name || a.shortName === name);
      return attr?.value;
    };

    // Extrair dados do subject
    const commonName = getAttribute(subject, 'CN') || getAttribute(subject, 'commonName') || '';
    const email = getAttribute(subject, 'emailAddress') || getAttribute(subject, 'E');
    const organization = getAttribute(subject, 'O') || getAttribute(subject, 'organizationName');
    const organizationalUnit = getAttribute(subject, 'OU') || getAttribute(subject, 'organizationalUnitName');
    const country = getAttribute(subject, 'C') || getAttribute(subject, 'countryName');
    const state = getAttribute(subject, 'ST') || getAttribute(subject, 'stateOrProvinceName');
    const locality = getAttribute(subject, 'L') || getAttribute(subject, 'localityName');

    // Extrair CPF/CNPJ do certificado ICP-Brasil
    // CPF/CNPJ geralmente está no OID 2.16.76.1.3.1 (CPF) ou 2.16.76.1.3.3 (CNPJ)
    let cpf: string | undefined;
    let cnpj: string | undefined;
    let certificateType: 'e-CPF' | 'e-CNPJ' | 'custom' = 'custom';

    // Tentar extrair CPF/CNPJ de extensões
    const extensions = cert.extensions || [];
    for (const ext of extensions) {
      if (ext.id === '2.16.76.1.3.1') {
        // OID do CPF
        cpf = extractCPFFromExtension(ext);
        certificateType = 'e-CPF';
      } else if (ext.id === '2.16.76.1.3.3') {
        // OID do CNPJ
        cnpj = extractCNPJFromExtension(ext);
        certificateType = 'e-CNPJ';
      }
    }

    // Se não encontrou CPF/CNPJ nas extensões, tentar extrair do CN ou serialNumber
    if (!cpf && !cnpj) {
      const extracted = extractCPFCNPJFromString(commonName);
      if (extracted.cpf) {
        cpf = extracted.cpf;
        certificateType = 'e-CPF';
      } else if (extracted.cnpj) {
        cnpj = extracted.cnpj;
        certificateType = 'e-CNPJ';
      }
    }

    // Datas de validade
    const validFrom = cert.validity.notBefore;
    const validUntil = cert.validity.notAfter;
    const now = new Date();
    const daysRemaining = Math.floor((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isValid = now >= validFrom && now <= validUntil;
    const isExpired = now > validUntil;

    // Emissor
    const issuerCN = getAttribute(issuer, 'CN') || getAttribute(issuer, 'commonName') || 'Desconhecido';

    // Serial Number
    const serialNumber = cert.serialNumber;

    // Fingerprint SHA-256
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const md = forge.md.sha256.create();
    md.update(certDer);
    const fingerprint = md.digest().toHex().toUpperCase();

    // Algoritmo e tamanho da chave
    const publicKey = cert.publicKey as forge.pki.rsa.PublicKey;
    const keySize = publicKey.n.bitLength();
    const keyAlgorithm = 'RSA';

    // Subject DN e Issuer DN completos
    const subjectDN = cert.subject.attributes
      .map(attr => `${attr.shortName || attr.name}=${attr.value}`)
      .join(', ');
    const issuerDN = cert.issuer.attributes
      .map(attr => `${attr.shortName || attr.name}=${attr.value}`)
      .join(', ');

    console.log('✅ Dados extraídos com sucesso');
    console.log(`   Titular: ${commonName}`);
    console.log(`   Tipo: ${certificateType}`);
    if (cpf) console.log(`   CPF: ${formatCPF(cpf)}`);
    if (cnpj) console.log(`   CNPJ: ${formatCNPJ(cnpj)}`);
    console.log(`   Validade: ${validFrom.toLocaleDateString()} a ${validUntil.toLocaleDateString()}`);
    console.log(`   Status: ${isValid ? '✅ Válido' : isExpired ? '❌ Expirado' : '⚠️ Ainda não válido'}`);

    return {
      commonName,
      email,
      cpf,
      cnpj,
      organization,
      organizationalUnit,
      country,
      state,
      locality,
      validFrom,
      validUntil,
      daysRemaining,
      isValid,
      isExpired,
      issuer: issuerCN,
      serialNumber,
      fingerprint,
      certificateType,
      keyAlgorithm,
      keySize,
      subjectDN,
      issuerDN,
    };
  } catch (error) {
    console.error('❌ Erro ao extrair dados do certificado:', error);
    throw error;
  }
}

/**
 * Extrai CPF de extensão X.509
 * 
 * @param extension Extensão do certificado
 * @returns CPF formatado (apenas números)
 */
function extractCPFFromExtension(extension: any): string | undefined {
  try {
    // Implementação simplificada - precisa ser adaptada para formato real
    const value = extension.value;
    if (!value) return undefined;

    // Extrair CPF (11 dígitos)
    const match = value.match(/\d{11}/);
    return match ? match[0] : undefined;
  } catch (error) {
    console.warn('Erro ao extrair CPF da extensão:', error);
    return undefined;
  }
}

/**
 * Extrai CNPJ de extensão X.509
 * 
 * @param extension Extensão do certificado
 * @returns CNPJ formatado (apenas números)
 */
function extractCNPJFromExtension(extension: any): string | undefined {
  try {
    // Implementação simplificada - precisa ser adaptada para formato real
    const value = extension.value;
    if (!value) return undefined;

    // Extrair CNPJ (14 dígitos)
    const match = value.match(/\d{14}/);
    return match ? match[0] : undefined;
  } catch (error) {
    console.warn('Erro ao extrair CNPJ da extensão:', error);
    return undefined;
  }
}

/**
 * Extrai CPF ou CNPJ de uma string (Common Name, etc.)
 * 
 * @param text Texto contendo CPF/CNPJ
 * @returns Objeto com CPF ou CNPJ encontrado
 */
function extractCPFCNPJFromString(text: string): { cpf?: string; cnpj?: string } {
  // Remover caracteres não numéricos
  const numbers = text.replace(/\D/g, '');

  // Procurar por CPF (11 dígitos)
  const cpfMatch = numbers.match(/\b\d{11}\b/);
  if (cpfMatch) {
    return { cpf: cpfMatch[0] };
  }

  // Procurar por CNPJ (14 dígitos)
  const cnpjMatch = numbers.match(/\b\d{14}\b/);
  if (cnpjMatch) {
    return { cnpj: cnpjMatch[0] };
  }

  return {};
}

/**
 * Formata CPF (000.000.000-00)
 * 
 * @param cpf CPF (apenas números)
 * @returns CPF formatado
 */
function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ (00.000.000/0000-00)
 * 
 * @param cnpj CNPJ (apenas números)
 * @returns CNPJ formatado
 */
function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Valida se certificado ainda é válido
 * 
 * @param validUntil Data de expiração
 * @returns true se ainda válido
 */
export function isCertificateValid(validUntil: Date): boolean {
  return new Date() <= validUntil;
}

/**
 * Calcula dias restantes de validade
 * 
 * @param validUntil Data de expiração
 * @returns Número de dias (negativo se expirado)
 */
export function getDaysRemaining(validUntil: Date): number {
  const now = new Date();
  return Math.floor((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se certificado expira em breve (menos de 30 dias)
 * 
 * @param validUntil Data de expiração
 * @returns true se expira em menos de 30 dias
 */
export function isCertificateExpiringSoon(validUntil: Date): boolean {
  const daysRemaining = getDaysRemaining(validUntil);
  return daysRemaining > 0 && daysRemaining <= 30;
}

/**
 * Exportações padrão
 */
export default {
  extractCertificateData,
  isCertificateValid,
  getDaysRemaining,
  isCertificateExpiringSoon,
};
