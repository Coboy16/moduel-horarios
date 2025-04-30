import {
  History,
  Flag,
  ClipboardList,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { CustomContextMenuItem } from "./CustomContextMenu";
// Ya no necesitas importar Employee aquí a menos que lo uses en el futuro

interface EmployeeContextMenuContentProps {
  onViewMarkings: () => void;
  onCopyLeave: () => void;
  onCopySchedules: () => void;
  onCopyAll: () => void;
  onPaste: () => void;
}

export function EmployeeContextMenuContent({
  onViewMarkings,
  onCopyLeave,
  onCopySchedules,
  onCopyAll,
  onPaste,
}: EmployeeContextMenuContentProps) {
  return (
    <>
      <CustomContextMenuItem onClick={onViewMarkings}>
        <History className="mr-2 h-4 w-4" />
        <span>Ver marcajes</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem isSeparator children={undefined} />
      <CustomContextMenuItem onClick={onCopyLeave}>
        <Flag className="mr-2 h-4 w-4" />
        <span>Copiar licencias y permisos</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem onClick={onCopySchedules}>
        <ClipboardList className="mr-2 h-4 w-4" />
        <span>Copiar horarios</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem onClick={onCopyAll}>
        <Copy className="mr-2 h-4 w-4" />
        <span>Copiar todo</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem isSeparator children={undefined} />
      <CustomContextMenuItem onClick={onPaste}>
        <ClipboardPaste className="mr-2 h-4 w-4" />
        <span>Pegar</span>
      </CustomContextMenuItem>
    </>
  );
}
