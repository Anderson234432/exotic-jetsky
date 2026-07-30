"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { EstadoJetskiBadge } from "@/components/admin/badges";
import { RegistrarMantenimientoDialog } from "@/components/admin/registrar-mantenimiento-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFecha, formatMoneda } from "@/lib/format";
import { horasHastaMantenimiento } from "@/lib/mantenimiento";
import { toast } from "sonner";
import type { EstadoJetski, Jetski, Mantenimiento, Renta } from "@/lib/types";

const ESTADOS: EstadoJetski[] = ["disponible", "en_renta", "mantenimiento"];

export default function JetskiDetallePage() {
  const params = useParams<{ id: string }>();
  const supabase = createClient();

  const [jetski, setJetski] = useState<Jetski | null>(null);
  const [rentas, setRentas] = useState<Renta[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      const [{ data: j }, { data: r }, { data: m }] = await Promise.all([
        supabase.from("jetskis").select("*").eq("id", params.id).single(),
        supabase
          .from("rentas")
          .select("*")
          .eq("jetski_id", params.id)
          .order("fecha", { ascending: false }),
        supabase
          .from("mantenimientos")
          .select("*")
          .eq("jetski_id", params.id)
          .order("fecha", { ascending: false }),
      ]);
      setJetski(j);
      setRentas(r ?? []);
      setMantenimientos(m ?? []);
      setCargando(false);
    }
    cargar();
  }, [supabase, params.id]);

  async function cambiarEstado(estado: EstadoJetski) {
    if (!jetski) return;
    const anterior = jetski.estado;
    setJetski({ ...jetski, estado });
    const { error } = await supabase.from("jetskis").update({ estado }).eq("id", jetski.id);
    if (error) {
      toast.error("No se pudo actualizar el estado.");
      setJetski({ ...jetski, estado: anterior });
    }
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  if (!jetski) return <p className="text-sm text-muted-foreground">Jetski no encontrado.</p>;

  const horasParaMantenimiento = horasHastaMantenimiento(jetski);

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden py-0">
        <div className="relative h-56 w-full bg-slate-100">
          {jetski.foto_url ? (
            <Image src={jetski.foto_url} alt={jetski.nombre} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">Sin foto</div>
          )}
        </div>
        <CardContent className="flex flex-col gap-4 pb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{jetski.nombre}</h1>
            <EstadoJetskiBadge estado={jetski.estado} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Año</p>
              <p className="font-medium">{jetski.anio}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Precio/hora</p>
              <p className="font-medium">{formatMoneda(jetski.precio_hora)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Horas de uso</p>
              <p className="font-medium">{jetski.horas_maquina.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Próx. mantenimiento</p>
              <p className={`font-medium ${horasParaMantenimiento <= 2 ? "text-red-600" : ""}`}>
                {horasParaMantenimiento <= 0 ? "0" : horasParaMantenimiento.toFixed(1)}h
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <span className="text-sm text-muted-foreground">Estado</span>
            <Select value={jetski.estado} onValueChange={(v) => v && cambiarEstado(v as EstadoJetski)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <RegistrarMantenimientoDialog
              jetski={jetski}
              onRegistrado={(j, m) => {
                setJetski(j);
                setMantenimientos((prev) => [m, ...prev]);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-bold">Historial de rentas</h2>
          {rentas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin rentas registradas.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {rentas.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{formatFecha(r.fecha)}</span>
                  <span className="text-muted-foreground">{r.horas_renta}h</span>
                  <span className="capitalize">{r.estado.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-bold">Historial de mantenimientos</h2>
          {mantenimientos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin mantenimientos registrados.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {mantenimientos.map((m) => (
                <li key={m.id} className="flex flex-col gap-1 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatFecha(m.fecha)}</span>
                    <span>{formatMoneda(m.costo)}</span>
                  </div>
                  {m.descripcion && <p className="text-muted-foreground">{m.descripcion}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
