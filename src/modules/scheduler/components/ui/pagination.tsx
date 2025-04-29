"use client";

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../utils/formatters"; // Asumo que cn viene de un utility como classnames o clsx
import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  selectedItems?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  selectedItems = 0,
}: PaginationProps) {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false); // Esto controla la rotación de la flecha abajo, aunque no hay contenido desplegable en este componente según la imagen.

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Esta función alterna el estado, lo que hace que la flecha rote.
  const toggleSelectionInfo = () => {
    setIsSelectionOpen(!isSelectionOpen);
  };

  return (
    <div className="border-t border-border">
      {/* Fila 1: navegación de páginas */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Fila 2: información de selección */}
      <div
        className={cn(
          "flex items-center justify-between p-2",
          "cursor-pointer select-none"
        )}
        onClick={toggleSelectionInfo}
      >
        <div className="text-sm text-muted-foreground">
          Seleccionados: {selectedItems} de {totalItems}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isSelectionOpen && "transform rotate-180"
          )}
        />
      </div>
    </div>
  );
}
