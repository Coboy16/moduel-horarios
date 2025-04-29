import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  selectedItems: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  selectedItems,
}: PaginationProps) {
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

  return (
    <div className="border-t border-border">
      {/* Fila 1: navegación */}
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

      {/* Fila 2: texto de selección */}
      <div className="flex items-center justify-center p-2 cursor-pointer select-none">
        <div className="text-sm text-muted-foreground">
          Seleccionados: {selectedItems} de {totalItems}
        </div>
      </div>
    </div>
  );
}
