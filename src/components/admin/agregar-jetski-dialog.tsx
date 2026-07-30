"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subirArchivo } from "@/lib/storage";
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
import { toast } from "sonner";
import type { Jetski } from "@/lib/types";

export function AgregarJetskiDialog({ onCreado }: { onCreado: (jetski: Jetski) => void }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioHora, setPrecioHora] = useState("");
  const [anio, setAnio] = useState("");
  const [horasMaquina, setHorasMaquina] = useState("0");
  const [intervalo, setIntervalo] = useState("15");

  function limpiar() {
    setNombre("");
    setFoto(null);
    setPrecioCompra("");
    setPrecioHora("");
    setAnio("");
    setHorasMaquina("0");
    setIntervalo("15");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    try {
      const fotoUrl = foto ? await subirArchivo(supabase, "jetskis", foto) : null;
      const horas = Number(horasMaquina) || 0;

      const { data, error } = await supabase
        .from("jetskis")
        .insert({
          nombre: nombre.trim(),
          foto_url: fotoUrl,
          precio_compra: Number(precioCompra) || 0,
          precio_hora: Number(precioHora) || 0,
          anio: Number(anio) || new Date().getFullYear(),
          horas_maquina: horas,
          horas_ultimo_mantenimiento: horas,
          horas_mantenimiento_intervalo: Number(intervalo) || 15,
        })
        .select()
        .single();

      if (error || !data) throw error;

      onCreado(data);
      toast.success("Jetski agregado.");
      limpiar();
      setOpen(false);
    } catch {
      toast.error("No se pudo agregar el jetski.");
    }
    setGuardando(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground" />}>
        Agregar jetski
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar jetski</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              className="h-11"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="foto">Foto</Label>
            <Input
              id="foto"
              type="file"
              accept="image/*"
              className="h-11 pt-2"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="precioCompra">Precio de compra (RD$)</Label>
              <Input
                id="precioCompra"
                type="number"
                className="h-11"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="precioHora">Precio por hora (RD$)</Label>
              <Input
                id="precioHora"
                type="number"
                className="h-11"
                value={precioHora}
                onChange={(e) => setPrecioHora(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="anio">Año</Label>
              <Input
                id="anio"
                type="number"
                className="h-11"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="horasMaquina">Horas actuales</Label>
              <Input
                id="horasMaquina"
                type="number"
                className="h-11"
                value={horasMaquina}
                onChange={(e) => setHorasMaquina(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="intervalo">Intervalo de mantenimiento (horas)</Label>
            <Input
              id="intervalo"
              type="number"
              className="h-11"
              value={intervalo}
              onChange={(e) => setIntervalo(e.target.value)}
              required
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
