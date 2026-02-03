import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import forge from 'node-forge'
import { PDFDocument, rgb } from 'pdf-lib'
import type { CreateSignaturePayload } from '@/types/signatures'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const payload: CreateSignaturePayload = await request.json()

    if (!payload.certificate_id || !payload.certificate_password || !payload.document_base64) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    console.log('🔐 Iniciando processo de assinatura...')

    // 1. Buscar certificado
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', payload.certificate_id)
      .eq('user_id', user.id)
      .single()

    if (certError || !cert) {
      return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })
    }

    // 2. Baixar certificado .p12
    const { data: certFile, error: downloadError } = await supabase.storage
      .from('certificates')
      .download(cert.certificate_path)

    if (downloadError || !certFile) {
      console.error('Erro ao baixar certificado:', downloadError)
      return NextResponse.json({ error: 'Erro ao acessar certificado' }, { status: 500 })
    }

    const certArrayBuffer = await certFile.arrayBuffer()
    const certBuffer = Buffer.from(certArrayBuffer)

    // 3. Descriptografar PKCS#12
    let p12: forge.pkcs12.Pkcs12Pfx
    let certificate: forge.pki.Certificate
    let privateKey: forge.pki.rsa.PrivateKey

    try {
      const p12Der = forge.util.createBuffer(certBuffer.toString('binary'))
      const p12Asn1 = forge.asn1.fromDer(p12Der)
      p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, payload.certificate_password)

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })

      const certBag = certBags[forge.pki.oids.certBag]?.[0]
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]

      if (!certBag?.cert || !keyBag?.key) {
        throw new Error('Certificado ou chave privada não encontrados')
      }

      certificate = certBag.cert
      privateKey = keyBag.key as forge.pki.rsa.PrivateKey

      console.log('✅ Certificado descriptografado')
    } catch (decryptError) {
      console.error('Erro ao descriptografar:', decryptError)
      return NextResponse.json(
        { error: 'Senha incorreta ou certificado inválido' },
        { status: 400 }
      )
    }

    // 4. Decodificar PDF original
    const pdfBuffer = Buffer.from(payload.document_base64, 'base64')
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    console.log('✅ PDF carregado:', pdfDoc.getPageCount(), 'páginas')

    // 5. Adicionar assinatura visual (se necessário)
    if (payload.signature_type === 'visual' || payload.signature_type === 'both') {
      const pages = pdfDoc.getPages()
      const lastPage = pages[pages.length - 1]
      const { width, height } = lastPage.getSize()

      // Adicionar texto de assinatura no canto inferior direito
      const subject = certificate.subject.attributes
      const signerName = subject.find((a: any) => a.name === 'commonName')?.value || 'Assinante'
      const signatureText = [
        'Assinado digitalmente por:',
        signerName,
        `Data: ${new Date().toLocaleString('pt-BR')}`,
        'Certificado: SignFlow',
      ].join('\n')

      lastPage.drawText(signatureText, {
        x: width - 250,
        y: 50,
        size: 8,
        color: rgb(0, 0, 0),
      })

      // Adicionar retângulo ao redor
      lastPage.drawRectangle({
        x: width - 260,
        y: 40,
        width: 240,
        height: 60,
        borderColor: rgb(0, 0.4, 0.8),
        borderWidth: 1,
      })

      console.log('✅ Assinatura visual adicionada')
    }

    // 6. Gerar hash SHA-256 do documento
    const pdfBytes = await pdfDoc.save()
    const documentHash = crypto.createHash('sha256').update(pdfBytes).digest('hex')

    // 7. Assinar hash com chave privada
    const md = forge.md.sha256.create()
    md.update(documentHash)
    const signature = privateKey.sign(md)
    const signatureHash = forge.util.encode64(signature)

    console.log('✅ Assinatura digital criada')

    // 8. Upload do documento original
    const originalFileName = `${user.id}/originals/${crypto.randomUUID()}.pdf`
    const { error: uploadOriginalError } = await supabase.storage
      .from('documents')
      .upload(originalFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadOriginalError) {
      console.error('Erro ao fazer upload do original:', uploadOriginalError)
      return NextResponse.json(
        { error: 'Erro ao armazenar documento original' },
        { status: 500 }
      )
    }

    // 9. Upload do documento assinado
    const signedFileName = `${user.id}/signed/${crypto.randomUUID()}.pdf`
    const { error: uploadSignedError } = await supabase.storage
      .from('documents')
      .upload(signedFileName, Buffer.from(pdfBytes), {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadSignedError) {
      console.error('Erro ao fazer upload do assinado:', uploadSignedError)
      // Limpar arquivo original
      await supabase.storage.from('documents').remove([originalFileName])
      return NextResponse.json(
        { error: 'Erro ao armazenar documento assinado' },
        { status: 500 }
      )
    }

    console.log('✅ Documentos armazenados')

    // 10. Salvar registro de assinatura no banco
    const subject = certificate.subject.attributes
    const issuer = certificate.issuer.attributes

    const { data: signatureRecord, error: dbError } = await supabase
      .from('signatures')
      .insert({
        user_id: user.id,
        certificate_id: payload.certificate_id,
        original_document_name: payload.document_name,
        original_document_path: originalFileName,
        original_document_size: pdfBuffer.length,
        signed_document_path: signedFileName,
        signed_document_size: pdfBytes.length,
        document_hash: documentHash,
        signature_hash: signatureHash,
        signature_type: payload.signature_type,
        signature_data: {
          signerName: subject.find((a: any) => a.name === 'commonName')?.value || 'N/A',
          signerEmail: user.email,
          certificateSubject: subject.map((a: any) => `${a.name}=${a.value}`).join(', '),
          certificateIssuer: issuer.find((a: any) => a.name === 'commonName')?.value || 'N/A',
          certificateSerialNumber: certificate.serialNumber,
          signatureAlgorithm: 'RSA-SHA256',
          timestamp: new Date().toISOString(),
        },
        status: 'completed',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      // Limpar arquivos
      await supabase.storage.from('documents').remove([originalFileName, signedFileName])
      return NextResponse.json(
        { error: 'Erro ao salvar assinatura: ' + dbError.message },
        { status: 500 }
      )
    }

    // 11. Gerar URL de download
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(signedFileName, 3600) // 1 hora

    console.log('✅ Assinatura concluída:', signatureRecord.id)

    return NextResponse.json({
      success: true,
      signature: signatureRecord,
      signed_document_url: urlData?.signedUrl || null,
      message: 'Documento assinado com sucesso!',
    })
  } catch (error) {
    console.error('Erro ao processar assinatura:', error)
    return NextResponse.json(
      { error: 'Erro ao processar assinatura: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
