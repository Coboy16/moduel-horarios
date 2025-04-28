import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { DraggableSidebarItemData } from "../../interfaces/DndData";

interface DraggableSidebarItemProps {
  id: string;
  itemType: string; // e.g., 'shift-s1', 'permission-vacation'
  data: Omit<DraggableSidebarItemData["itemData"], "category"> & {
    category: string;
  }; // Datos como nombre, color, duración default
  children: React.ReactNode;
}

export function DraggableSidebarItem({
  id,
  itemType,
  data,
  children,
}: DraggableSidebarItemProps) {
  const draggableData: DraggableSidebarItemData = {
    type: "sidebarItem",
    itemType: itemType,
    itemData: data,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: id,
      data: draggableData,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
    touchAction: "none", // importante para dispositivos táctiles
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
