// src/components/ui/Modal.tsx
import React from "react";
import { X } from "lucide-react";
import { cn } from "../../../utils/formatters";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl"; // Opcional para controlar el ancho
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md", // Tamaño por defecto
}: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl", // Ajusta según necesites
  };

  // Detiene la propagación para evitar cerrar el modal al hacer clic dentro
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose} // Cierra al hacer clic en el overlay
    >
      {/* Contenedor del Modal */}
      <div
        className={cn(
          "bg-white rounded-lg shadow-xl w-full flex flex-col overflow-hidden",
          sizeClasses[size]
        )}
        onClick={handleContentClick} // Evita cierre al clickear dentro
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-t-lg">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido (el formulario) */}
        <div className="p-5 md:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
