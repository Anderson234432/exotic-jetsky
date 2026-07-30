"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AgregarGastoForm } from "@/components/admin/agregar-gasto-form";
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
import { cn } from "@/lib/utils";
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
    setCargando(true);
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Finanzas</h1>

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
                  "h-10",
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
              <p className="text-sm text-muted-foreground">💰 Ingresos</p>
              <p className="text-2xl font-bold">{formatMoneda(ingresos)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">⛽ Combustible</p>
              <p className="text-2xl font-bold">{formatMoneda(combustible)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">🔧 Mantenimiento</p>
              <p className="text-2xl font-bold">{formatMoneda(mantenimiento)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">📦 Gastos generales</p>
              <p className="text-2xl font-bold">{formatMoneda(general)}</p>
            </CardContent>
          </Card>
          <Card className="border-brand/30 bg-brand/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">✅ Ganancia neta</p>
              <p className="text-2xl font-bold text-brand">{formatMoneda(gananciaNeta)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <AgregarGastoForm onCreado={(g) => setGastos((prev) => [g, ...prev])} />

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-bold">Desglose de gastos</h2>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>{formatFecha(g.fecha)}</TableCell>
                      <TableCell>{TIPO_LABEL[g.tipo]}</TableCell>
                      <TableCell>{g.descripcion || "—"}</TableCell>
                      <TableCell>{formatMoneda(g.monto)}</TableCell>
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
