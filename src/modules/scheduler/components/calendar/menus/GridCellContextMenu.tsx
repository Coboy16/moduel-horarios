import { Pin, Flag, CalendarPlus } from "lucide-react";
import { CustomContextMenuItem } from "./CustomContextMenu";

interface GridCellContextMenuContentProps {
  formattedDateTime: string;
  onAddMarking: () => void;
  onAddLeave: () => void;
  onAddShift: () => void;
}

export function GridCellContextMenuContent({
  formattedDateTime,
  onAddMarking,
  onAddLeave,
  onAddShift,
}: GridCellContextMenuContentProps) {
  return (
    <>
      <CustomContextMenuItem isLabel>{formattedDateTime}</CustomContextMenuItem>
      <CustomContextMenuItem isSeparator children={undefined} />
      <CustomContextMenuItem onClick={onAddMarking}>
        <Pin className="mr-2 h-4 w-4 text-blue-500" />
        <span>Agregar marcaje</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem onClick={onAddLeave}>
        <Flag className="mr-2 h-4 w-4 text-orange-500" />
        <span>Agregar licencia/permiso</span>
      </CustomContextMenuItem>
      <CustomContextMenuItem onClick={onAddShift}>
        <CalendarPlus className="mr-2 h-4 w-4 text-green-500" />
        <span>Agregar turno</span>
      </CustomContextMenuItem>
    </>
  );
}
