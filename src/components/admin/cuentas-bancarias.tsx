"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CuentaBancariaDialog } from "@/components/admin/cuenta-bancaria-dialog";
import { EliminarCuentaDialog } from "@/components/admin/eliminar-cuenta-dialog";
import { toast } from "sonner";
import { mensajeError } from "@/lib/errors";
import type { CuentaBancaria } from "@/lib/types";

const TIPO_LABEL: Record<CuentaBancaria["tipo"], string> = {
  ahorro: "Cuenta de ahorro",
  corriente: "Cuenta corriente",
};

export function CuentasBancarias() {
  const supabase = createClient();
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from("cuentas_bancarias")
      .select("*")
      .order("orden")
      .order("created_at")
      .then(({ data }) => {
        setCuentas(data ?? []);
        setCargando(false);
      });
  }, [supabase]);

  function actualizarLocal(cuenta: CuentaBancaria) {
    setCuentas((prev) => {
      const existe = prev.some((c) => c.id === cuenta.id);
      return existe ? prev.map((c) => (c.id === cuenta.id ? cuenta : c)) : [...prev, cuenta];
    });
  }

  async function toggleActiva(cuenta: CuentaBancaria, valor: boolean) {
    actualizarLocal({ ...cuenta, activa: valor });
    const { error } = await supabase
      .from("cuentas_bancarias")
      .update({ activa: valor })
      .eq("id", cuenta.id);
    if (error) {
      toast.error(mensajeError(error));
      actualizarLocal({ ...cuenta, activa: !valor });
    }
  }

  async function eliminarCuenta(cuenta: CuentaBancaria): Promise<boolean> {
    const { error } = await supabase.from("cuentas_bancarias").delete().eq("id", cuenta.id);
    if (error) {
      toast.error(mensajeError(error));
      return false;
    }
    setCuentas((prev) => prev.filter((c) => c.id !== cuenta.id));
    toast.success("Cuenta eliminada.");
    return true;
  }

  const siguienteOrden = cuentas.length
    ? Math.max(...cuentas.map((c) => c.orden)) + 1
    : 0;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-ej-tinta">Cuentas bancarias</h2>
          <CuentaBancariaDialog siguienteOrden={siguienteOrden} onGuardado={actualizarLocal} />
        </div>

        {cargando ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : cuentas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay cuentas registradas. Los clientes verán las instrucciones de WhatsApp en su
            lugar.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {cuentas.map((cuenta) => (
              <div
                key={cuenta.id}
                className="flex flex-col gap-3 rounded-[16px] bg-ej-crema p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ej-tinta">{cuenta.banco}</p>
                  <p className="text-xs text-ej-tinta-mut">{TIPO_LABEL[cuenta.tipo]}</p>
                  <p className="font-mono text-sm text-ej-tinta">{cuenta.numero}</p>
                  <p className="text-xs text-ej-tinta-sv">{cuenta.titular}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`activa-${cuenta.id}`}
                      checked={cuenta.activa}
                      onCheckedChange={(checked) => toggleActiva(cuenta, checked === true)}
                    />
                    <Label htmlFor={`activa-${cuenta.id}`} className="text-sm font-normal">
                      Activa
                    </Label>
                  </div>
                  <CuentaBancariaDialog
                    cuenta={cuenta}
                    siguienteOrden={siguienteOrden}
                    onGuardado={actualizarLocal}
                  />
                  <EliminarCuentaDialog cuenta={cuenta} onEliminar={() => eliminarCuenta(cuenta)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
