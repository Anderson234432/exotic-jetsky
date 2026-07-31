"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatFecha, formatHora12h, formatMoneda } from "@/lib/format";
import type { EstadoJetski, EstadoRenta, Renta } from "@/lib/types";

// Solo los campos que este diálogo necesita mostrar — así acepta tanto el
// RentaConRelaciones de /admin/rentas como cualquier otra forma que incluya
// estos datos, sin acoplarse a la forma exacta del select() de la página.
export interface RentaParaEliminar extends Renta {
  jetski: { nombre: string; estado: EstadoJetski; precio_hora: number } | null;
  cliente: { nombre: string; telefono: string } | null;
}

const ESTADO_LABEL: Record<EstadoRenta, string> = {
  en_espera: "En espera",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
  completada: "Completada",
};

export function EliminarRentaDialog({
  renta,
  disabled,
  onEliminar,
}: {
  renta: RentaParaEliminar;
  disabled?: boolean;
  onEliminar: () => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function handleConfirmar() {
    setEliminando(true);
    const ok = await onEliminar();
    setEliminando(false);
    if (ok) setOpen(false);
  }

  const costo = formatMoneda((renta.jetski?.precio_hora ?? 0) * renta.horas_renta);

  return (
    <Dialog open={open} onOpenChange={(v) => !eliminando && setOpen(v)}>
      <DialogTrigger
        render={<Button variant="destructive" size="sm" className="h-11" disabled={disabled} />}
      >
        Eliminar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar renta</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1 rounded-[16px] bg-ej-crema p-4 text-sm text-ej-tinta">
          <p>
            <span className="text-ej-tinta-mut">Cliente: </span>
            {renta.cliente?.nombre} — {renta.cliente?.telefono}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Jetski: </span>
            {renta.jetski?.nombre}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Fecha: </span>
            {formatFecha(renta.fecha)} — {formatHora12h(renta.hora_inicio)}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Estado: </span>
            {ESTADO_LABEL[renta.estado]}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Costo: </span>
            {costo}
          </p>
        </div>

        <div className="rounded-[16px] bg-[#FCEBEB] p-4 text-sm text-[#A32D2D]">
          {renta.estado === "completada" ? (
            <p>
              Esta acción es irreversible. Se van a <strong>restar {renta.horas_renta}h</strong>{" "}
              de la máquina del jetski {renta.jetski?.nombre} y los ingresos del período van a
              cambiar.
            </p>
          ) : (
            <p>
              Esta acción es irreversible. Se van a perder las fotos y el registro completo de
              esta renta.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="h-11 rounded-full bg-ej-turquesa-sv text-ej-turquesa-tx hover:bg-ej-turquesa-sv/70"
            disabled={eliminando}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="h-11"
            disabled={eliminando}
            onClick={handleConfirmar}
          >
            {eliminando ? "Eliminando..." : "Eliminar renta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
