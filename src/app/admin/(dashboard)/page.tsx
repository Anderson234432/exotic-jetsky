import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoRentaBadge } from "@/components/admin/badges";
import { formatMoneda, formatHora12h } from "@/lib/format";
import { hoyRD } from "@/lib/format";
import { horasHastaMantenimiento, requiereAlertaMantenimiento } from "@/lib/mantenimiento";
import type { Jetski, Renta } from "@/lib/types";

type RentaConJetski = Renta & { jetski: Jetski | null };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const hoy = hoyRD();

  const [{ data: rentasHoy }, { count: pendientes }, { data: jetskis }] = await Promise.all([
    supabase
      .from("rentas")
      .select("*, jetski:jetskis(*)")
      .eq("fecha", hoy)
      .order("hora_inicio")
      .returns<RentaConJetski[]>(),
    supabase
      .from("rentas")
      .select("*", { count: "exact", head: true })
      .eq("estado", "en_espera"),
    supabase.from("jetskis").select("*"),
  ]);

  const ingresosHoy = (rentasHoy ?? [])
    .filter((r) => r.estado === "confirmada" || r.estado === "completada")
    .reduce((total, r) => total + (r.jetski?.precio_hora ?? 0) * r.horas_renta, 0);

  const jetskisEnAlerta = (jetskis ?? []).filter(requiereAlertaMantenimiento);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Rentas de hoy</p>
            <p className="text-3xl font-bold">{rentasHoy?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card className={pendientes ? "border-red-300" : undefined}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pendientes de confirmar</p>
            <p className={`text-3xl font-bold ${pendientes ? "text-red-600" : ""}`}>
              {pendientes ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ingresos del día</p>
            <p className="text-3xl font-bold text-brand">{formatMoneda(ingresosHoy)}</p>
          </CardContent>
        </Card>
      </div>

      {jetskisEnAlerta.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <h2 className="mb-3 font-bold text-red-800">⚠️ Alertas de mantenimiento</h2>
            <ul className="flex flex-col gap-2">
              {jetskisEnAlerta.map((j) => {
                const horas = horasHastaMantenimiento(j);
                return (
                  <li key={j.id} className="text-sm text-red-800">
                    <Link href={`/admin/jetskis/${j.id}`} className="underline">
                      {j.nombre}
                    </Link>{" "}
                    — mantenimiento en {horas <= 0 ? "0" : horas.toFixed(1)} horas
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 font-bold">Rentas de hoy</h2>
          {!rentasHoy || rentasHoy.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay rentas programadas para hoy.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {rentasHoy.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">
                      {formatHora12h(r.hora_inicio)} — {r.jetski?.nombre ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">{r.horas_renta}h de renta</p>
                  </div>
                  <EstadoRentaBadge estado={r.estado} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
