/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";

import { useEffect, useRef } from "react";
import { useUI } from "../../hooks/useUI";
import { useEvents } from "../../hooks/useEvents";
import { useMarkings } from "../../hooks/useMarkings";
import type {
  ContextMenuType,
  ContextMenuPosition,
} from "../../interfaces/UIState";
import type { Event } from "../../interfaces/Event";
import type { Marking } from "../../interfaces/Marking";
import {
  Calendar,
  Clock,
  Copy,
  Edit,
  MapPin,
  MoreHorizontal,
  Plus,
  Trash,
  UserCog,
} from "lucide-react";

interface ContextMenuProps {
  position: ContextMenuPosition;
  type: ContextMenuType;
  data: any;
}

export default function ContextMenu({
  position,
  type,
  data,
}: ContextMenuProps) {
  const {
    closeContextMenu,
    openAddEventModal,
    openEditEventModal,
    openAddMarkingModal,
    openEditMarkingModal,
    openAddPermissionModal,
    openAddScheduleModal,
  } = useUI();

  const { deleteEvent, copyEvent } = useEvents();
  const { deleteMarking } = useMarkings();

  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (position.x + rect.width > windowWidth) {
        adjustedX = windowWidth - rect.width - 10;
      }

      if (position.y + rect.height > windowHeight) {
        adjustedY = windowHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  // Render different menu items based on context type
  const renderMenuItems = () => {
    switch (type) {
      case "cell": {
        const event = data as Event;

        return (
          <>
            <MenuItem
              icon={<Calendar />}
              label="Agregar eventoaa"
              onClick={() => {
                closeContextMenu();
                const validDate =
                  data.date instanceof Date && !isNaN(data.date.getTime())
                    ? data.date
                    : new Date();
                openAddEventModal(validDate, data.employeeId);
              }}
            />
            <MenuItem
              icon={<MapPin />}
              label="Agregar marcaje"
              onClick={() => {
                closeContextMenu();
                const validDate =
                  data.date instanceof Date && !isNaN(data.date.getTime())
                    ? data.date
                    : new Date();
                openAddMarkingModal(validDate, data.employeeId);
              }}
            />
            <MenuItem
              icon={<UserCog />}
              label="Agregar permiso"
              onClick={() => {
                closeContextMenu();
                const validDate =
                  data.date instanceof Date && !isNaN(data.date.getTime())
                    ? data.date
                    : new Date();
                openAddPermissionModal(validDate, data.employeeId);
              }}
            />
            <MenuItem
              icon={<Clock />}
              label="Agregar horario"
              onClick={() => {
                closeContextMenu();
                const validDate =
                  data.date instanceof Date && !isNaN(data.date.getTime())
                    ? data.date
                    : new Date();
                openAddScheduleModal(validDate, data.employeeId);
              }}
            />
          </>
        );
      }

      case "event": {
        const event = data as Event;
        return (
          <>
            <MenuItem
              icon={<Edit />}
              label="Editar evento"
              onClick={() => {
                closeContextMenu();
                openEditEventModal(event);
              }}
            />
            <MenuItem
              icon={<Copy />}
              label="Copiar evento"
              onClick={() => {
                closeContextMenu();
                copyEvent(event.id);
              }}
            />
            <MenuItem
              icon={<Trash />}
              label="Eliminar evento"
              onClick={() => {
                closeContextMenu();
                deleteEvent(event.id);
              }}
            />
          </>
        );
      }

      case "marking": {
        const marking = data as Marking;
        return (
          <>
            <MenuItem
              icon={<Edit />}
              label="Editar marcaje"
              onClick={() => {
                closeContextMenu();
                openEditMarkingModal(marking);
              }}
            />
            <MenuItem
              icon={<Trash />}
              label="Eliminar marcaje"
              onClick={() => {
                closeContextMenu();
                deleteMarking(marking.id);
              }}
            />
          </>
        );
      }

      case "employee": {
        return (
          <>
            <MenuItem
              icon={<Calendar />}
              label="Ver eventos"
              onClick={() => {
                closeContextMenu();
                // Implement view employee events
              }}
            />
            <MenuItem
              icon={<MapPin />}
              label="Ver marcajes"
              onClick={() => {
                closeContextMenu();
                // Implement view employee markings
              }}
            />
            <MenuItem
              icon={<UserCog />}
              label="Gestionar permisos"
              onClick={() => {
                closeContextMenu();
                // Implement manage employee permissions
              }}
            />
          </>
        );
      }

      case "calendar":
      case "timeline":
      default:
        return (
          <>
            <MenuItem
              icon={<Plus />}
              label="Agregar evento"
              onClick={() => {
                closeContextMenu();
                openAddEventModal(data.date);
              }}
            />
            <MenuItem
              icon={<MoreHorizontal />}
              label="Más opciones"
              onClick={() => {
                closeContextMenu();
                // Implement more options
              }}
            />
          </>
        );
    }
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-border rounded-md shadow-md py-1 w-48"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {renderMenuItems()}
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MenuItem({ icon, label, onClick }: MenuItemProps) {
  return (
    <div
      className="px-3 py-2 flex items-center gap-2 hover:bg-accent cursor-pointer text-sm"
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
