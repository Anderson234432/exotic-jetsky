"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { AgregarJetskiDialog } from "@/components/admin/agregar-jetski-dialog";
import { EstadoJetskiBadge } from "@/components/admin/badges";
import { Card, CardContent } from "@/components/ui/card";
import { horasHastaMantenimiento } from "@/lib/mantenimiento";
import type { Jetski } from "@/lib/types";

export default function AdminJetskisPage() {
  const supabase = createClient();
  const [jetskis, setJetskis] = useState<Jetski[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from("jetskis")
      .select("*")
      .order("nombre")
      .then(({ data }) => {
        setJetskis(data ?? []);
        setCargando(false);
      });
  }, [supabase]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Jetskis</h1>
        <AgregarJetskiDialog onCreado={(j) => setJetskis((prev) => [...prev, j])} />
      </div>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : jetskis.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay jetskis registrados.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jetskis.map((j) => {
            const horas = horasHastaMantenimiento(j);
            return (
              <Link key={j.id} href={`/admin/jetskis/${j.id}`}>
                <Card className="overflow-hidden py-0">
                  <div className="relative h-40 w-full bg-ej-agua">
                    {j.foto_url ? (
                      <Image src={j.foto_url} alt={j.nombre} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-ej-tinta-mut">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <CardContent className="flex flex-col gap-2 pb-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold">{j.nombre}</h2>
                      <EstadoJetskiBadge estado={j.estado} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {j.horas_maquina.toFixed(1)} horas de uso
                    </p>
                    <p className={`text-sm ${horas <= 2 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      Mantenimiento en {horas <= 0 ? "0" : horas.toFixed(1)} horas
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
