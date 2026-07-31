"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function limpiarEntrada(texto: string): string {
  let limpio = texto.replace(/[^0-9.]/g, "");
  const partes = limpio.split(".");
  if (partes.length > 2) {
    limpio = partes[0] + "." + partes.slice(1).join("");
  }
  const [entero, decimal] = limpio.split(".");
  if (decimal !== undefined) {
    limpio = entero + "." + decimal.slice(0, 2);
  }
  return limpio;
}

function formatearMiles(valorRaw: string): string {
  if (!valorRaw) return "";
  const [entero, decimal] = valorRaw.split(".");
  const enteroFormateado = entero === "" ? "" : Number(entero).toLocaleString("en-US");
  return decimal !== undefined ? `${enteroFormateado}.${decimal}` : enteroFormateado;
}

interface InputMonedaProps {
  id?: string;
  value: string;
  onValueChange: (valorRaw: string) => void;
  required?: boolean;
  className?: string;
}

export function InputMoneda({ id, value, onValueChange, required, className }: InputMonedaProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-muted-foreground md:text-sm">
        RD$
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        required={required}
        value={formatearMiles(value)}
        onChange={(e) => onValueChange(limpiarEntrada(e.target.value))}
        className={cn("pl-10", className)}
      />
    </div>
  );
}
