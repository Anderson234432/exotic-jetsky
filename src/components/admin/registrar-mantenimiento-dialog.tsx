"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Jetski, Mantenimiento } from "@/lib/types";
import { hoyRD } from "@/lib/format";

export function RegistrarMantenimientoDialog({
  jetski,
  onRegistrado,
}: {
  jetski: Jetski;
  onRegistrado: (jetski: Jetski, mantenimiento: Mantenimiento) => void;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fecha, setFecha] = useState(hoyRD());
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState("0");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      const { data: mantenimiento, error: errorMant } = await supabase
        .from("mantenimientos")
        .insert({
          jetski_id: jetski.id,
          fecha,
          descripcion: descripcion.trim() || null,
          costo: Number(costo) || 0,
          horas_en_mantenimiento: jetski.horas_maquina,
        })
        .select()
        .single();
      if (errorMant || !mantenimiento) throw errorMant;

      const { data: jetskiActualizado, error: errorJetski } = await supabase
        .from("jetskis")
        .update({ horas_ultimo_mantenimiento: jetski.horas_maquina })
        .eq("id", jetski.id)
        .select()
        .single();
      if (errorJetski || !jetskiActualizado) throw errorJetski;

      onRegistrado(jetskiActualizado, mantenimiento);
      toast.success("Mantenimiento registrado.");
      setDescripcion("");
      setCosto("0");
      setOpen(false);
    } catch {
      toast.error("No se pudo registrar el mantenimiento.");
    }
    setGuardando(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground" />}>
        Registrar mantenimiento completado
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar mantenimiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              className="h-11"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="costo">Costo (RD$)</Label>
            <Input
              id="costo"
              type="number"
              className="h-11"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={guardando}
              className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground"
            >
              {guardando ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
