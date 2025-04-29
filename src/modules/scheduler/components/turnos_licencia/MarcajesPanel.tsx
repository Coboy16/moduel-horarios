"use client";

interface MarcajeItem {
  id: string;
  label: string;
  color: string;
}

const marcajesData: MarcajeItem[] = [
  { id: "at", label: "A tiempo", color: "#22c55e" },
  { id: "tard", label: "Tardanza", color: "#f97316" },
  { id: "sa", label: "Salida anticipada", color: "#eab308" },
  { id: "aus", label: "Ausencia", color: "#ef4444" },
];

export default function MarcajesPanel() {
  return (
    <div className="border-t border-border bg-card py-2 px-4">
      <div className="flex items-center">
        <div className="font-medium text-sm mr-3">Estado de marcajes:</div>
        <div className="flex items-center gap-4">
          {marcajesData.map((marcaje) => (
            <div key={marcaje.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: marcaje.color }}
              />
              <span className="text-sm">{marcaje.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
