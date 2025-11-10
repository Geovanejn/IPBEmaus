import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete: (url: string, filename: string) => void;
  accept?: string;
  maxSize?: number;
  type: 'comprovante' | 'foto' | 'pdf';
  currentFile?: string;
  label?: string;
  className?: string;
}

export function FileUpload({ 
  onUploadComplete, 
  accept = "image/*,application/pdf",
  maxSize = 5 * 1024 * 1024,
  type,
  currentFile,
  label = "Selecionar arquivo",
  className = ""
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: `O arquivo deve ter no máximo ${Math.round(maxSize / 1024 / 1024)}MB`
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload?type=${type}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar arquivo');
      }

      const data = await response.json();
      setPreview(data.url);
      onUploadComplete(data.url, data.filename);

      toast({
        title: "Arquivo enviado",
        description: "Arquivo enviado com sucesso!"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: error.message || "Erro ao enviar arquivo"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete(null as any, '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = preview && (preview.endsWith('.jpg') || preview.endsWith('.jpeg') || 
                               preview.endsWith('.png') || preview.endsWith('.gif') || 
                               preview.endsWith('.webp'));

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />

      {preview ? (
        <div className="relative inline-block">
          {isImage ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-xs max-h-48 rounded-md border"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {preview.split('/').pop()}
              </span>
            </div>
          )}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
            data-testid="button-remove-file"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          data-testid="button-select-file"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Enviando..." : label}
        </Button>
      )}
    </div>
  );
}
