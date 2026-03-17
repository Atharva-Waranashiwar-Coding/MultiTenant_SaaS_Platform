'use client';

import { useRef } from 'react';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks/use-attachments';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Paperclip, Upload, Trash2, Download, FileText, Image, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AttachmentPanelProps {
  orgId: string;
  projectId?: string;
  taskId?: string;
  canUpload?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf') || mimeType.includes('text')) return FileText;
  return File;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPanel({ orgId, projectId, taskId, canUpload = true }: AttachmentPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: attachments, isLoading } = useAttachments(orgId, { projectId, taskId });
  const upload = useUploadAttachment(orgId);
  const remove = useDeleteAttachment(orgId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    upload.mutate(
      { file, projectId, taskId },
      {
        onSuccess: () => toast.success('File uploaded', file.name),
        onError: () => toast.error('Upload failed', 'Could not upload file. Max size is 10 MB.'),
      },
    );

    // Reset input so the same file can be re-uploaded if needed
    e.target.value = '';
  };

  const handleDownload = (orgId: string, attachmentId: string, fileName: string) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('auth-store') ?? '{}')?.state?.accessToken
      : null;

    const url = `${apiBase}/organizations/${orgId}/attachments/${attachmentId}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    // For auth header, we need a fetch approach
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      })
      .catch(() => toast.error('Download failed'));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          Attachments {attachments && attachments.length > 0 && (
            <span className="text-xs text-muted-foreground">({attachments.length})</span>
          )}
        </div>
        {canUpload && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={upload.isPending}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="*/*"
            />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : !attachments?.length ? (
        <p className="text-xs text-muted-foreground py-2">No attachments yet.</p>
      ) : (
        <div className="space-y-1">
          {attachments.map((a) => {
            const FileIcon = getFileIcon(a.mimeType);
            return (
              <div key={a.id} className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm hover:bg-muted/30 group">
                <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatBytes(a.fileSize)} · {formatDate(a.createdAt)} · {a.uploadedBy?.firstName}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    title="Download"
                    onClick={() => handleDownload(orgId, a.id, a.fileName)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  {canUpload && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() =>
                        remove.mutate(a.id, {
                          onSuccess: () => toast.success('Attachment deleted'),
                          onError: () => toast.error('Delete failed'),
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
