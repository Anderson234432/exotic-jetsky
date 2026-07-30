"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { hoyRD } from "@/lib/format";
import { toast } from "sonner";
import type { Gasto, TipoGasto } from "@/lib/types";

const TIPOS: { value: TipoGasto; label: string }[] = [
  { value: "combustible", label: "Combustible" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "general", label: "General" },
];

export function AgregarGastoForm({ onCreado }: { onCreado: (gasto: Gasto) => void }) {
  const supabase = createClient();
  const [tipo, setTipo] = useState<TipoGasto>("general");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(hoyRD());
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    const { data, error } = await supabase
      .from("gastos")
      .insert({
        tipo,
        monto: Number(monto) || 0,
        descripcion: descripcion.trim() || null,
        fecha,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error("No se pudo agregar el gasto.");
    } else {
      onCreado(data);
      toast.success("Gasto agregado.");
      setMonto("");
      setDescripcion("");
    }
    setGuardando(false);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="mb-4 font-bold">Agregar gasto</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => v && setTipo(v as TipoGasto)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="monto">Monto (RD$)</Label>
            <Input
              id="monto"
              type="number"
              className="h-11"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fechaGasto">Fecha</Label>
            <Input
              id="fechaGasto"
              type="date"
              className="h-11"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcionGasto">Descripción</Label>
            <Input
              id="descripcionGasto"
              className="h-11"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={guardando}
            className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground sm:col-span-4 sm:w-fit"
          >
            {guardando ? "Guardando..." : "Agregar gasto"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
