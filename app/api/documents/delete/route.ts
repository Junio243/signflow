import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit, extractIpFromRequest } from '@/lib/audit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [DELETE API] Starting document deletion...')

    // Get document ID from query params
    const url = new URL(request.url)
    const documentId = url.searchParams.get('id')
    const clientIp = extractIpFromRequest(request);

    if (!documentId) {
      console.error('❌ [DELETE API] Document ID missing')
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    console.log('📝 [DELETE API] Document ID:', documentId)

    // 1. Get document info first
    console.log('🔍 [DELETE API] Fetching document details...')
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('id, status, signed_pdf_url')
      .eq('id', documentId)
      .single()

    if (fetchError || !doc) {
      console.error('❌ [DELETE API] Document not found:', fetchError)
      
      // Audit log: document not found
      await logAudit({
        action: 'document.delete',
        resourceType: 'document',
        resourceId: documentId,
        status: 'failure',
        ip: clientIp,
        details: { reason: 'document_not_found' }
      });
      
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    console.log('✅ [DELETE API] Document found, status:', doc.status)

    // 2. Check if document can be deleted (only draft, canceled, or expired)
    const allowedStatuses = ['draft', 'canceled', 'expired']
    if (!allowedStatuses.includes(doc.status?.toLowerCase() || '')) {
      console.warn('⚠️ [DELETE API] Cannot delete signed document')
      
      // Audit log: deletion denied
      await logAudit({
        action: 'auth.denied',
        resourceType: 'document',
        resourceId: documentId,
        status: 'denied',
        ip: clientIp,
        details: { 
          reason: 'cannot_delete_signed_document',
          documentStatus: doc.status
        }
      });
      
      return NextResponse.json(
        { error: 'Cannot delete signed documents. Cancel them first.' },
        { status: 403 }
      )
    }

    // 3. Delete PDF from storage if exists
    if (doc.signed_pdf_url) {
      console.log('📁 [DELETE API] Deleting PDF from storage...')
      const fileName = `${documentId}.pdf`
      
      const { error: storageError } = await supabase.storage
        .from('signed-documents')
        .remove([fileName])

      if (storageError) {
        console.warn('⚠️ [DELETE API] Storage deletion failed:', storageError.message)
        // Continue anyway - file might not exist
      } else {
        console.log('✅ [DELETE API] PDF deleted from storage')
      }
    }

    // 4. Delete document record from database
    console.log('💾 [DELETE API] Deleting document record...')
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error('❌ [DELETE API] Database deletion failed:', deleteError)
      
      // Audit log: deletion failed
      await logAudit({
        action: 'document.delete',
        resourceType: 'document',
        resourceId: documentId,
        status: 'error',
        ip: clientIp,
        details: { error: deleteError.message }
      });
      
      return NextResponse.json(
        { error: `Failed to delete document: ${deleteError.message}` },
        { status: 500 }
      )
    }

    // Audit log: successful deletion
    await logAudit({
      action: 'document.delete',
      resourceType: 'document',
      resourceId: documentId,
      status: 'success',
      ip: clientIp,
      userAgent: request.headers.get('user-agent') || undefined,
      details: { 
        documentStatus: doc.status,
        hadPdf: !!doc.signed_pdf_url
      }
    });

    console.log('✅✅✅ [DELETE API] Document deleted successfully!')
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('❌❌❌ [DELETE API] FATAL ERROR:', error)
    
    // Audit log: exception
    const clientIp = extractIpFromRequest(request);
    await logAudit({
      action: 'document.delete',
      resourceType: 'document',
      status: 'error',
      ip: clientIp,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to delete document', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
