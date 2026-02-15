import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Create supabase client with user auth
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    // Get certificate
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (certError || !certificate) {
      return NextResponse.json(
        { error: 'Certificado não encontrado' },
        { status: 404 }
      )
    }

    // Download file from storage using service key for better access
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: fileData, error: downloadError } = await supabaseService
      .storage
      .from('certificates')
      .download(certificate.certificate_path)

    if (downloadError || !fileData) {
      console.error('Error downloading certificate:', downloadError)
      return NextResponse.json(
        { error: 'Erro ao baixar certificado: ' + (downloadError?.message || 'Arquivo não encontrado') },
        { status: 500 }
      )
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Create filename
    const filename = `${certificate.certificate_name.replace(/[^a-zA-Z0-9]/g, '_')}.p12`

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-pkcs12',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error in download route:', error)
    return NextResponse.json(
      { error: 'Erro ao processar download: ' + (error instanceof Error ? error.message : 'Desconhecido') },
      { status: 500 }
    )
  }
}
