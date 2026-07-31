"use client";

import { useEffect, useState } from "react";
import { DollarSign, Fuel, Wrench, Package, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AgregarGastoForm } from "@/components/admin/agregar-gasto-form";
import { EliminarGastoDialog } from "@/components/admin/eliminar-gasto-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFecha, formatMoneda, hoyRD, inicioMesRD, inicioSemanaRD } from "@/lib/format";
import { mensajeError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Gasto, Jetski, Renta, TipoGasto } from "@/lib/types";

type Periodo = "hoy" | "semana" | "mes" | "personalizado";
type RentaConJetski = Renta & { jetski: Jetski | null };

const TIPO_LABEL: Record<TipoGasto, string> = {
  combustible: "Combustible",
  mantenimiento: "Mantenimiento",
  general: "General",
};

export default function AdminFinanzasPage() {
  const supabase = createClient();

  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [desdeCustom, setDesdeCustom] = useState(hoyRD());
  const [hastaCustom, setHastaCustom] = useState(hoyRD());

  const [rentas, setRentas] = useState<RentaConJetski[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);

  const hoy = hoyRD();
  const desde =
    periodo === "hoy"
      ? hoy
      : periodo === "semana"
        ? inicioSemanaRD()
        : periodo === "mes"
          ? inicioMesRD()
          : desdeCustom;
  const hasta = periodo === "personalizado" ? hastaCustom : hoy;

  useEffect(() => {
    Promise.all([
      supabase
        .from("rentas")
        .select("*, jetski:jetskis(*)")
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .in("estado", ["confirmada", "completada"])
        .returns<RentaConJetski[]>(),
      supabase.from("gastos").select("*").gte("fecha", desde).lte("fecha", hasta),
    ]).then(([{ data: r }, { data: g }]) => {
      setRentas(r ?? []);
      setGastos(g ?? []);
      setCargando(false);
    });
  }, [supabase, desde, hasta]);

  const ingresos = rentas.reduce(
    (total, r) => total + (r.jetski?.precio_hora ?? 0) * r.horas_renta,
    0
  );
  const gastoPorTipo = (tipo: TipoGasto) =>
    gastos.filter((g) => g.tipo === tipo).reduce((total, g) => total + g.monto, 0);
  const combustible = gastoPorTipo("combustible");
  const mantenimiento = gastoPorTipo("mantenimiento");
  const general = gastoPorTipo("general");
  const gananciaNeta = ingresos - combustible - mantenimiento - general;

  async function eliminarGasto(gasto: Gasto): Promise<boolean> {
    const { error } = await supabase.from("gastos").delete().eq("id", gasto.id);
    if (error) {
      toast.error(mensajeError(error));
      return false;
    }
    setGastos((prev) => prev.filter((g) => g.id !== gasto.id));
    toast.success("Gasto eliminado.");
    return true;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Finanzas</h1>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "hoy", label: "Hoy" },
                { value: "semana", label: "Esta semana" },
                { value: "mes", label: "Este mes" },
                { value: "personalizado", label: "Rango personalizado" },
              ] as { value: Periodo; label: string }[]
            ).map((p) => (
              <Button
                key={p.value}
                variant={periodo === p.value ? undefined : "outline"}
                className={cn(
                  "h-11",
                  periodo === p.value && "bg-brand hover:bg-brand/90 text-brand-foreground"
                )}
                onClick={() => setPeriodo(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          {periodo === "personalizado" && (
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="desde">Desde</Label>
                <Input
                  id="desde"
                  type="date"
                  className="h-11"
                  value={desdeCustom}
                  onChange={(e) => setDesdeCustom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hasta">Hasta</Label>
                <Input
                  id="hasta"
                  type="date"
                  className="h-11"
                  value={hastaCustom}
                  onChange={(e) => setHastaCustom(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <DollarSign className="size-4" /> Ingresos
              </p>
              <p className="text-2xl font-medium">{formatMoneda(ingresos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Fuel className="size-4" /> Combustible
              </p>
              <p className="text-2xl font-medium">{formatMoneda(combustible)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Wrench className="size-4" /> Mantenimiento
              </p>
              <p className="text-2xl font-medium">{formatMoneda(mantenimiento)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Package className="size-4" /> Gastos generales
              </p>
              <p className="text-2xl font-medium">{formatMoneda(general)}</p>
            </CardContent>
          </Card>
          <Card
            className={cn(
              "border-transparent",
              gananciaNeta < 0 ? "bg-[#FCEBEB]" : "bg-ej-turquesa-sv"
            )}
          >
            <CardContent className="pt-6">
              <p
                className={cn(
                  "flex items-center gap-1.5 text-sm",
                  gananciaNeta < 0 ? "text-[#A32D2D]" : "text-ej-turquesa-tx"
                )}
              >
                {gananciaNeta < 0 ? (
                  <TrendingDown className="size-4" />
                ) : (
                  <TrendingUp className="size-4" />
                )}{" "}
                Ganancia neta
              </p>
              <p
                className={cn(
                  "text-2xl font-medium",
                  gananciaNeta < 0 ? "text-[#A32D2D]" : "text-ej-turquesa-tx"
                )}
              >
                {formatMoneda(gananciaNeta)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <AgregarGastoForm onCreado={(g) => setGastos((prev) => [g, ...prev])} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-medium">Desglose de gastos</h2>
          {gastos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay gastos en este período.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>{formatFecha(g.fecha)}</TableCell>
                      <TableCell>{TIPO_LABEL[g.tipo]}</TableCell>
                      <TableCell>{g.descripcion || "—"}</TableCell>
                      <TableCell>{formatMoneda(g.monto)}</TableCell>
                      <TableCell>
                        <EliminarGastoDialog gasto={g} onEliminar={() => eliminarGasto(g)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
