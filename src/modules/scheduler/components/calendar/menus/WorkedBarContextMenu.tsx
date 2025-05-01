import { Eye, Copy, Trash2 } from "lucide-react";
import { CustomContextMenuItem } from "./CustomContextMenu"; // Importa el item base

interface WorkedBarContextMenuContentProps {
  onViewDetails: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export function WorkedBarContextMenuContent({
  onViewDetails,
  onCopy,
  onDelete,
}: WorkedBarContextMenuContentProps) {
  return (
    <>
      <CustomContextMenuItem onClick={onViewDetails}>
        <Eye className="mr-2 h-4 w-4" />
        <span>Ver detalle</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem onClick={onCopy}>
        <Copy className="mr-2 h-4 w-4" />
        <span>Copiar</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem
        onClick={onDelete}
        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>Eliminar</span>
      </CustomContextMenuItem>
    </>
  );
}
