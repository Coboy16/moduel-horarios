"use client";
import React, { useRef, useState } from "react";
import { FileUp, X, Paperclip } from "lucide-react";
import { Button } from "../../../ui/button";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  className?: string;
  buttonText?: string;
  acceptedFileTypes?: string;
  maxFileSize?: number; // en bytes
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  className = "",
  buttonText = "Subir archivos",
  acceptedFileTypes = "*/*",
  maxFileSize = 5 * 1024 * 1024, // 5MB por defecto
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError(null);

    if (!file) {
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    // Validación de tamaño
    if (file.size > maxFileSize) {
      setError(
        `El archivo excede el tamaño máximo de ${maxFileSize / (1024 * 1024)}MB`
      );
      setSelectedFile(null);
      onFileSelect(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);

    // Reset el input para permitir seleccionar el mismo archivo nuevamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={acceptedFileTypes}
        />

        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
          className="flex items-center"
        >
          <FileUp className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>

        {selectedFile && (
          <div className="flex items-center gap-2 py-1 px-2 bg-blue-50 rounded border border-blue-200">
            <Paperclip className="h-4 w-4 text-blue-500" />
            <span
              className="text-sm text-gray-800 max-w-[200px] truncate"
              title={selectedFile.name}
            >
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={clearSelectedFile}
              className="text-gray-500 hover:text-gray-700"
              title="Eliminar archivo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FileUploader;
