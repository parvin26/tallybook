import { supabase } from './supabase/supabaseClient'

export interface TransactionAttachment {
  id: string
  transaction_id: string
  business_id: string
  storage_path: string
  filename: string
  mime_type: string
  size_bytes: number
  created_at: string
}

const STORAGE_BUCKET = 'tally-attachments'

/**
 * Upload attachment file to Supabase Storage
 */
export async function uploadAttachment(
  file: File,
  transactionId: string,
  businessId: string
): Promise<{ success: boolean; storagePath?: string; error?: string }> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${transactionId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${businessId}/${fileName}`

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('[Attachments] Upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    return { success: true, storagePath: filePath }
  } catch (error: any) {
    console.error('[Attachments] Upload exception:', error)
    return { success: false, error: error.message || 'Upload failed' }
  }
}

/**
 * Save attachment metadata to database
 */
export async function saveAttachmentMetadata(
  transactionId: string,
  businessId: string,
  storagePath: string,
  filename: string,
  mimeType: string,
  sizeBytes: number
): Promise<{ success: boolean; attachment?: TransactionAttachment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transaction_attachments')
      .insert({
        transaction_id: transactionId,
        business_id: businessId,
        storage_path: storagePath,
        filename: filename,
        mime_type: mimeType,
        size_bytes: sizeBytes,
      })
      .select()
      .single()

    if (error) {
      console.error('[Attachments] Save metadata error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, attachment: data as TransactionAttachment }
  } catch (error: any) {
    console.error('[Attachments] Save metadata exception:', error)
    return { success: false, error: error.message || 'Save failed' }
  }
}

/**
 * Get all attachments for a transaction
 */
export async function getTransactionAttachments(
  transactionId: string
): Promise<TransactionAttachment[]> {
  try {
    const { data, error } = await supabase
      .from('transaction_attachments')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: true })

    if (error) {
      const msg = error?.message ?? (error as { code?: string })?.code ?? (error as { details?: string })?.details
      console.error('[Attachments] Fetch error:', msg || JSON.stringify(error) || String(error))
      return []
    }

    return (data || []) as TransactionAttachment[]
  } catch (error) {
    const err = error as Error
    console.error('[Attachments] Fetch exception:', err?.message ?? String(error))
    return []
  }
}

/**
 * Get download URL for an attachment
 */
export async function getAttachmentUrl(storagePath: string): Promise<string | null> {
  try {
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(storagePath, 3600) // 1 hour expiry

    return data?.signedUrl || null
  } catch (error) {
    console.error('[Attachments] Get URL error:', error)
    return null
  }
}

/**
 * Delete attachment (file and metadata)
 */
export async function deleteAttachment(
  attachmentId: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath])

    if (storageError) {
      console.error('[Attachments] Delete storage error:', storageError)
      // Continue to delete metadata even if storage delete fails
    }

    // Delete metadata
    const { error: dbError } = await supabase
      .from('transaction_attachments')
      .delete()
      .eq('id', attachmentId)

    if (dbError) {
      console.error('[Attachments] Delete metadata error:', dbError)
      return { success: false, error: dbError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[Attachments] Delete exception:', error)
    return { success: false, error: error.message || 'Delete failed' }
  }
}
