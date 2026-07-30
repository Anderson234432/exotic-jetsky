"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subirArchivo } from "@/lib/storage";
import { formatFecha, formatHora12h, formatMoneda } from "@/lib/format";
import { EstadoRentaBadge } from "@/components/admin/badges";
import { RentaAcciones } from "@/components/admin/renta-acciones";
import { PhotoDialog } from "@/components/admin/photo-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { EstadoRenta, Jetski, Renta } from "@/lib/types";

type RentaConRelaciones = Renta & {
  jetski: Jetski | null;
  cliente: { nombre: string; cedula: string; telefono: string } | null;
};

const ESTADOS: EstadoRenta[] = ["en_espera", "confirmada", "rechazada", "completada"];

export default function AdminRentasPage() {
  const supabase = createClient();

  const [rentas, setRentas] = useState<RentaConRelaciones[]>([]);
  const [jetskis, setJetskis] = useState<Jetski[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<Set<string>>(new Set());
  const [fotoAbierta, setFotoAbierta] = useState<{ url: string; titulo: string } | null>(null);

  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroJetski, setFiltroJetski] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  useEffect(() => {
    supabase
      .from("jetskis")
      .select("*")
      .order("nombre")
      .then(({ data }) => setJetskis(data ?? []));
  }, [supabase]);

  useEffect(() => {
    setCargando(true);
    let query = supabase
      .from("rentas")
      .select("*, jetski:jetskis(*), cliente:clientes(nombre, cedula, telefono)")
      .order("fecha", { ascending: false })
      .order("hora_inicio", { ascending: false });

    if (filtroFecha) query = query.eq("fecha", filtroFecha);
    if (filtroJetski !== "todos") query = query.eq("jetski_id", filtroJetski);
    if (filtroEstado !== "todos") query = query.eq("estado", filtroEstado as EstadoRenta);

    query.returns<RentaConRelaciones[]>().then(({ data }) => {
      setRentas(data ?? []);
      setCargando(false);
    });
  }, [supabase, filtroFecha, filtroJetski, filtroEstado]);

  function marcarProcesando(id: string, activo: boolean) {
    setProcesando((prev) => {
      const next = new Set(prev);
      if (activo) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function actualizarRentaLocal(id: string, cambios: Partial<Renta>) {
    setRentas((prev) => prev.map((r) => (r.id === id ? { ...r, ...cambios } : r)));
  }

  async function cambiarEstado(renta: RentaConRelaciones, estado: EstadoRenta) {
    marcarProcesando(renta.id, true);
    const { error } = await supabase.from("rentas").update({ estado }).eq("id", renta.id);
    if (error) {
      toast.error("No se pudo actualizar la renta.");
    } else {
      actualizarRentaLocal(renta.id, { estado });
      toast.success("Renta actualizada.");
    }
    marcarProcesando(renta.id, false);
  }

  async function completarRenta(renta: RentaConRelaciones) {
    if (!renta.jetski_id) return;
    marcarProcesando(renta.id, true);

    const { data: jetski } = await supabase
      .from("jetskis")
      .select("horas_maquina")
      .eq("id", renta.jetski_id)
      .single();

    if (jetski) {
      await supabase
        .from("jetskis")
        .update({ horas_maquina: jetski.horas_maquina + renta.horas_renta })
        .eq("id", renta.jetski_id);
    }

    const { error } = await supabase
      .from("rentas")
      .update({ estado: "completada" })
      .eq("id", renta.id);

    if (error) {
      toast.error("No se pudo completar la renta.");
    } else {
      actualizarRentaLocal(renta.id, { estado: "completada" });
      toast.success("Renta completada.");
    }
    marcarProcesando(renta.id, false);
  }

  async function toggleDeposito(renta: RentaConRelaciones, valor: boolean) {
    actualizarRentaLocal(renta.id, { deposito_devuelto: valor });
    const { error } = await supabase
      .from("rentas")
      .update({ deposito_devuelto: valor })
      .eq("id", renta.id);
    if (error) {
      toast.error("No se pudo actualizar el depósito.");
      actualizarRentaLocal(renta.id, { deposito_devuelto: !valor });
    }
  }

  async function subirFoto(
    renta: RentaConRelaciones,
    file: File,
    campo: "foto_antes_url" | "foto_despues_url"
  ) {
    marcarProcesando(renta.id, true);
    try {
      const url = await subirArchivo(supabase, "rentas", file);
      const cambios: Partial<Renta> =
        campo === "foto_antes_url" ? { foto_antes_url: url } : { foto_despues_url: url };
      const { error } = await supabase.from("rentas").update(cambios).eq("id", renta.id);
      if (error) throw error;
      actualizarRentaLocal(renta.id, cambios);
      toast.success("Foto subida.");
    } catch {
      toast.error("No se pudo subir la foto.");
    }
    marcarProcesando(renta.id, false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Rentas</h1>

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-fecha">Fecha</Label>
            <Input
              id="filtro-fecha"
              type="date"
              className="h-11"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Jetski</Label>
            <Select value={filtroJetski} onValueChange={(v) => setFiltroJetski(v ?? "todos")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {jetskis.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Estado</Label>
            <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? "todos")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : rentas.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay rentas para estos filtros.</p>
      ) : (
        <>
          {/* Desktop */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Jetski</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rentas.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.cliente?.nombre}</div>
                        <div className="text-xs text-muted-foreground">{r.cliente?.telefono}</div>
                      </TableCell>
                      <TableCell>{r.jetski?.nombre}</TableCell>
                      <TableCell>
                        {formatFecha(r.fecha)} — {formatHora12h(r.hora_inicio)} ({r.horas_renta}h)
                      </TableCell>
                      <TableCell>
                        {formatMoneda((r.jetski?.precio_hora ?? 0) * r.horas_renta)}
                      </TableCell>
                      <TableCell>
                        <EstadoRentaBadge estado={r.estado} />
                      </TableCell>
                      <TableCell className="min-w-72">
                        <RentaAcciones
                          renta={r}
                          procesando={procesando.has(r.id)}
                          onVerFoto={(url, titulo) => setFotoAbierta({ url, titulo })}
                          onConfirmar={() => cambiarEstado(r, "confirmada")}
                          onRechazar={() => cambiarEstado(r, "rechazada")}
                          onCompletar={() => completarRenta(r)}
                          onToggleDeposito={(v) => toggleDeposito(r, v)}
                          onSubirFotoAntes={(f) => subirFoto(r, f, "foto_antes_url")}
                          onSubirFotoDespues={(f) => subirFoto(r, f, "foto_despues_url")}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile */}
          <div className="flex flex-col gap-4 md:hidden">
            {rentas.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{r.cliente?.nombre}</p>
                      <p className="text-sm text-muted-foreground">{r.jetski?.nombre}</p>
                    </div>
                    <EstadoRentaBadge estado={r.estado} />
                  </div>
                  <p className="text-sm">
                    {formatFecha(r.fecha)} — {formatHora12h(r.hora_inicio)} ({r.horas_renta}h)
                  </p>
                  <p className="font-semibold text-brand">
                    {formatMoneda((r.jetski?.precio_hora ?? 0) * r.horas_renta)}
                  </p>
                  <RentaAcciones
                    renta={r}
                    procesando={procesando.has(r.id)}
                    onVerFoto={(url, titulo) => setFotoAbierta({ url, titulo })}
                    onConfirmar={() => cambiarEstado(r, "confirmada")}
                    onRechazar={() => cambiarEstado(r, "rechazada")}
                    onCompletar={() => completarRenta(r)}
                    onToggleDeposito={(v) => toggleDeposito(r, v)}
                    onSubirFotoAntes={(f) => subirFoto(r, f, "foto_antes_url")}
                    onSubirFotoDespues={(f) => subirFoto(r, f, "foto_despues_url")}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <PhotoDialog
        url={fotoAbierta?.url ?? null}
        titulo={fotoAbierta?.titulo ?? ""}
        onClose={() => setFotoAbierta(null)}
      />
    </div>
  );
}
