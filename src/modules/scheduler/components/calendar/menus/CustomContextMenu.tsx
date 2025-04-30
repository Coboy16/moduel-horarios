import React, { useEffect, useRef } from "react";
import { cn } from "../../../utils/formatters";

interface CustomContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function CustomContextMenu({
  isOpen,
  position,
  onClose,
  children,
  className,
}: CustomContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Efecto para cerrar al hacer click fuera (sin cambios)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Efecto para cerrar con Escape (sin cambios)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // --- ESTILO DE POSICIONAMIENTO ---
  // Usar position: fixed para que sea relativo al viewport
  // Añadir un pequeño offset (ej. 2px) para mejor UX
  const menuStyle: React.CSSProperties = {
    position: "fixed", // Clave: posiciona relativo al viewport
    top: `${position.y + 2}px`, // Coordenada Y del viewport + offset
    left: `${position.x + 2}px`, // Coordenada X del viewport + offset
    zIndex: 50, // Asegura que esté por encima de otros elementos
  };
  // --- FIN ESTILO ---

  return (
    <div
      ref={menuRef}
      // Quita 'absolute' y 'z-50' de aquí, ya están en menuStyle
      className={cn(
        "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg p-1 min-w-[150px]", // Estilos base
        className
      )}
      style={menuStyle} // Aplica el estilo de posicionamiento calculado
      onContextMenu={(e) => e.preventDefault()} // Evita menú nativo dentro del custom
    >
      {children}
    </div>
  );
}

// Componente CustomContextMenuItem (sin cambios)
interface CustomContextMenuItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  isSeparator?: boolean;
  isLabel?: boolean;
}

export function CustomContextMenuItem({
  onClick,
  children,
  className,
  isSeparator = false,
  isLabel = false,
}: CustomContextMenuItemProps) {
  if (isSeparator) {
    return <hr className="my-1 border-gray-200 dark:border-slate-700" />;
  }
  if (isLabel) {
    return (
      <div
        className={cn(
          "px-2 py-1 text-xs text-gray-500 dark:text-slate-400 select-none",
          className
        )}
      >
        {" "}
        {/* select-none para labels */}
        {children}
      </div>
    );
  }
  return (
    <button
      type="button" // Añadir type="button"
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-2 py-1.5 text-sm text-left text-gray-700 dark:text-slate-200 rounded-sm hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none", // Estilos base y hover/focus
        className
      )}
    >
      {children}
    </button>
  );
}
