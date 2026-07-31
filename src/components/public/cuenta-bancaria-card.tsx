"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CuentaBancaria } from "@/lib/types";

const TIPO_LABEL: Record<CuentaBancaria["tipo"], string> = {
  ahorro: "Cuenta de ahorro",
  corriente: "Cuenta corriente",
};

export function CuentaBancariaCard({ cuenta }: { cuenta: CuentaBancaria }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const numeroLimpio = cuenta.numero.replace(/[\s-]/g, "");
    try {
      await navigator.clipboard.writeText(numeroLimpio);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Fallback para navegadores viejos o contextos no seguros (http)
      // donde navigator.clipboard no existe o rechaza el permiso.
      const textarea = document.createElement("textarea");
      textarea.value = numeroLimpio;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      } catch {
        // Último recurso: selecciona el texto para que el usuario copie manual.
        window.getSelection()?.selectAllChildren(document.getElementById(`numero-${cuenta.id}`)!);
      }
      document.body.removeChild(textarea);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-ej-blanco p-4">
      <div>
        <p className="font-medium text-ej-tinta">{cuenta.banco}</p>
        <p className="text-xs text-ej-tinta-mut">{TIPO_LABEL[cuenta.tipo]}</p>
        <p id={`numero-${cuenta.id}`} className="mt-1 font-mono text-lg text-ej-tinta">
          {cuenta.numero}
        </p>
        <p className="text-[13px] text-ej-tinta-sv">{cuenta.titular}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-11 shrink-0 gap-1.5 rounded-full bg-ej-turquesa-sv px-4 text-ej-turquesa-tx hover:bg-ej-turquesa-sv/70"
        onClick={copiar}
      >
        {copiado ? (
          <>
            <Check className="size-4" /> Copiado
          </>
        ) : (
          <>
            <Copy className="size-4" /> Copiar
          </>
        )}
      </Button>
    </div>
  );
}
