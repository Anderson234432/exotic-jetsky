"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { mensajeError } from "@/lib/errors";
import type { CuentaBancaria, TipoCuenta } from "@/lib/types";

const BANCOS_RD = [
  "Banreservas",
  "Banco Popular",
  "BHD",
  "Scotiabank",
  "Banco Santa Cruz",
  "Banco Caribe",
  "Banco Promerica",
  "Asociación Popular",
  "Asociación Cibao",
  "Banesco",
];

export function CuentaBancariaDialog({
  cuenta,
  siguienteOrden,
  onGuardado,
}: {
  cuenta?: CuentaBancaria;
  siguienteOrden: number;
  onGuardado: (cuenta: CuentaBancaria) => void;
}) {
  const supabase = createClient();
  const esEdicion = !!cuenta;

  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [banco, setBanco] = useState(cuenta?.banco ?? "");
  const [tipo, setTipo] = useState<TipoCuenta>(cuenta?.tipo ?? "ahorro");
  const [numero, setNumero] = useState(cuenta?.numero ?? "");
  const [titular, setTitular] = useState(cuenta?.titular ?? "");

  function resetear() {
    setBanco(cuenta?.banco ?? "");
    setTipo(cuenta?.tipo ?? "ahorro");
    setNumero(cuenta?.numero ?? "");
    setTitular(cuenta?.titular ?? "");
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      if (esEdicion) {
        const { data, error } = await supabase
          .from("cuentas_bancarias")
          .update({ banco: banco.trim(), tipo, numero: numero.trim(), titular: titular.trim() })
          .eq("id", cuenta.id)
          .select()
          .single();
        if (error || !data) throw error;
        onGuardado(data);
        toast.success("Cuenta actualizada.");
      } else {
        const { data, error } = await supabase
          .from("cuentas_bancarias")
          .insert({
            banco: banco.trim(),
            tipo,
            numero: numero.trim(),
            titular: titular.trim(),
            orden: siguienteOrden,
          })
          .select()
          .single();
        if (error || !data) throw error;
        onGuardado(data);
        toast.success("Cuenta agregada.");
      }
      setOpen(false);
      if (!esEdicion) {
        setBanco("");
        setNumero("");
        setTitular("");
        setTipo("ahorro");
      }
    } catch (error) {
      toast.error(mensajeError(error));
    }
    setGuardando(false);
  }

  const valido = banco.trim() && numero.trim() && titular.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!guardando) {
          setOpen(v);
          if (!v) resetear();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={esEdicion ? "outline" : undefined}
            size={esEdicion ? "sm" : "default"}
            className={
              esEdicion ? "h-11" : "h-11 w-fit bg-brand hover:bg-brand/90 text-brand-foreground"
            }
          />
        }
      >
        {esEdicion ? "Editar" : "Agregar cuenta"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{esEdicion ? "Editar cuenta" : "Agregar cuenta"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="banco">Banco</Label>
            <Input
              id="banco"
              list="bancos-rd"
              className="h-11"
              maxLength={100}
              value={banco}
              onChange={(e) => setBanco(e.target.value)}
              placeholder="Banreservas"
            />
            <datalist id="bancos-rd">
              {BANCOS_RD.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo de cuenta</Label>
            <Select value={tipo} onValueChange={(v) => setTipo((v as TipoCuenta) ?? "ahorro")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ahorro">Ahorro</SelectItem>
                <SelectItem value="corriente">Corriente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="numero">Número de cuenta</Label>
            <Input
              id="numero"
              className="h-11"
              maxLength={40}
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="000-000000-0"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="titular">Titular</Label>
            <Input
              id="titular"
              className="h-11"
              maxLength={100}
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleGuardar}
            disabled={guardando || !valido}
            className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
