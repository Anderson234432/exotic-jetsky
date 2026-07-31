"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Renta } from "@/lib/types";

interface Props {
  renta: Renta;
  procesando: boolean;
  onVerFoto: (url: string, titulo: string) => void;
  onConfirmar: () => void;
  onRechazar: () => void;
  onCompletar: () => void;
  onToggleDeposito: (valor: boolean) => void;
  onSubirFotoAntes: (file: File) => void;
  onSubirFotoDespues: (file: File) => void;
}

export function RentaAcciones({
  renta,
  procesando,
  onVerFoto,
  onConfirmar,
  onRechazar,
  onCompletar,
  onToggleDeposito,
  onSubirFotoAntes,
  onSubirFotoDespues,
}: Props) {
  const [idAntes] = useState(() => `foto-antes-${renta.id}`);
  const [idDespues] = useState(() => `foto-despues-${renta.id}`);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {renta.adelanto_foto_url && (
          <Button
            variant="outline"
            size="sm"
            className="h-11"
            onClick={() => onVerFoto(renta.adelanto_foto_url!, "Comprobante de adelanto")}
          >
            Ver adelanto
          </Button>
        )}

        {renta.estado === "en_espera" && (
          <>
            <Button
              size="sm"
              className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground"
              disabled={procesando}
              onClick={onConfirmar}
            >
              Confirmar pago
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-11"
              disabled={procesando}
              onClick={onRechazar}
            >
              Rechazar
            </Button>
          </>
        )}

        {renta.estado === "confirmada" && (
          <Button
            size="sm"
            className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground"
            disabled={procesando}
            onClick={onCompletar}
          >
            Completar renta
          </Button>
        )}
      </div>

      {(renta.estado === "confirmada" || renta.estado === "completada") && (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor={idAntes} className="text-xs text-muted-foreground">
              Foto antes
            </Label>
            <div className="flex items-center gap-2">
              <input
                id={idAntes}
                type="file"
                accept="image/*"
                className="max-w-40 text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onSubirFotoAntes(file);
                }}
              />
              {renta.foto_antes_url && (
                <button
                  type="button"
                  className="text-xs text-ej-turquesa-tx underline"
                  onClick={() => onVerFoto(renta.foto_antes_url!, "Foto antes de la renta")}
                >
                  Ver
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={idDespues} className="text-xs text-muted-foreground">
              Foto después
            </Label>
            <div className="flex items-center gap-2">
              <input
                id={idDespues}
                type="file"
                accept="image/*"
                className="max-w-40 text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onSubirFotoDespues(file);
                }}
              />
              {renta.foto_despues_url && (
                <button
                  type="button"
                  className="text-xs text-ej-turquesa-tx underline"
                  onClick={() => onVerFoto(renta.foto_despues_url!, "Foto después de la renta")}
                >
                  Ver
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox
          id={`deposito-${renta.id}`}
          checked={renta.deposito_devuelto}
          onCheckedChange={(checked) => onToggleDeposito(checked === true)}
        />
        <Label htmlFor={`deposito-${renta.id}`} className="text-sm font-normal">
          Depósito devuelto
        </Label>
      </div>
    </div>
  );
}
