'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2 } from 'lucide-react';
import { openGoogleDrivePicker, GooglePickerDocument } from '@/lib/google-drive';
import { supabase } from '@/lib/supabase';
import { DraftAttachment } from '@/types';

interface GoogleDrivePickerProps {
  onFilesSelected: (files: DraftAttachment[]) => void;
}

export default function GoogleDrivePicker({ onFilesSelected }: GoogleDrivePickerProps) {
  const [loading, setLoading] = useState(false);

  async function handlePickFiles() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.provider_token || session?.access_token;

      if (!accessToken) {
        alert('Please sign in with Google to access Drive.');
        return;
      }

      await openGoogleDrivePicker(accessToken, (docs: GooglePickerDocument[]) => {
        const attachments: DraftAttachment[] = docs.map(doc => ({
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file_name: doc.name,
          google_drive_file_id: doc.id,
          google_drive_url: doc.url,
          mime_type: doc.mimeType,
        }));
        onFilesSelected(attachments);
      });
    } catch (err) {
      console.error('Error opening Drive picker:', err);
      alert('Could not open Google Drive picker. Make sure popups are not blocked.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handlePickFiles}
      disabled={loading}
      className="gap-2 text-xs"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Paperclip className="h-3 w-3" />
      )}
      Attach from Drive
    </Button>
  );
}
