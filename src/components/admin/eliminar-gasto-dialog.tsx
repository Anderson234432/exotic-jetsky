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
import { formatFecha, formatMoneda } from "@/lib/format";
import type { Gasto, TipoGasto } from "@/lib/types";

const TIPO_LABEL: Record<TipoGasto, string> = {
  combustible: "Combustible",
  mantenimiento: "Mantenimiento",
  general: "General",
};

export function EliminarGastoDialog({
  gasto,
  onEliminar,
}: {
  gasto: Gasto;
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

  return (
    <Dialog open={open} onOpenChange={(v) => !eliminando && setOpen(v)}>
      <DialogTrigger render={<Button variant="destructive" size="sm" className="h-11" />}>
        Eliminar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar gasto</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1 rounded-[16px] bg-ej-crema p-4 text-sm text-ej-tinta">
          <p>
            <span className="text-ej-tinta-mut">Tipo: </span>
            {TIPO_LABEL[gasto.tipo]}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Monto: </span>
            {formatMoneda(gasto.monto)}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Fecha: </span>
            {formatFecha(gasto.fecha)}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Descripción: </span>
            {gasto.descripcion || "—"}
          </p>
        </div>

        <div className="rounded-[16px] bg-[#FCEBEB] p-4 text-sm text-[#A32D2D]">
          Esta acción es irreversible. El gasto se elimina por completo y los totales de este
          período se recalculan.
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
            {eliminando ? "Eliminando..." : "Eliminar gasto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
