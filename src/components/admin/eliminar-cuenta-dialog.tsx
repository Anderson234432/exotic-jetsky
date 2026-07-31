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
import type { CuentaBancaria } from "@/lib/types";

const TIPO_LABEL: Record<CuentaBancaria["tipo"], string> = {
  ahorro: "Cuenta de ahorro",
  corriente: "Cuenta corriente",
};

export function EliminarCuentaDialog({
  cuenta,
  onEliminar,
}: {
  cuenta: CuentaBancaria;
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
          <DialogTitle>Eliminar cuenta bancaria</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1 rounded-[16px] bg-ej-crema p-4 text-sm text-ej-tinta">
          <p>
            <span className="text-ej-tinta-mut">Banco: </span>
            {cuenta.banco}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Tipo: </span>
            {TIPO_LABEL[cuenta.tipo]}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Número: </span>
            {cuenta.numero}
          </p>
          <p>
            <span className="text-ej-tinta-mut">Titular: </span>
            {cuenta.titular}
          </p>
        </div>

        <div className="rounded-[16px] bg-[#FCEBEB] p-4 text-sm text-[#A32D2D]">
          Esta acción es irreversible. Los clientes dejarán de verla en el paso de pago.
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
            {eliminando ? "Eliminando..." : "Eliminar cuenta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
