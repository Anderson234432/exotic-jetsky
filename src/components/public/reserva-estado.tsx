"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatFecha, formatHora12h } from "@/lib/format";
import type { EstadoRenta } from "@/lib/types";

const WHATSAPP_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMERO}`;

// Solo los campos no sensibles: el resto de la tabla (fotos, depósito, notas,
// operador) está restringido a "anon" a nivel de columna en Supabase (ver
// supabase/schema.sql) para que esta consulta pública no pueda dumpear datos
// de otras reservas.
interface RentaPublica {
  id: string;
  estado: EstadoRenta;
  fecha: string;
  hora_inicio: string;
  jetski: { nombre: string } | null;
}

export function ReservaEstado({ id }: { id: string }) {
  const supabase = createClient();
  const [renta, setRenta] = useState<RentaPublica | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    supabase
      .from("rentas")
      .select("id, estado, fecha, hora_inicio, jetski:jetskis(nombre)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (activo) {
          setRenta(data as unknown as RentaPublica);
          setCargando(false);
        }
      });

    const canal = supabase
      .channel(`renta-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rentas", filter: `id=eq.${id}` },
        (payload) => {
          setRenta((prev) =>
            prev
              ? { ...prev, ...(payload.new as Partial<RentaPublica>) }
              : (payload.new as RentaPublica)
          );
        }
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [supabase, id]);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!renta) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">No encontramos esta reserva.</p>
        <WhatsappButton />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <Link href="/" className="text-lg font-bold">
        Exotic <span className="text-brand-accent">Jetsky</span>
      </Link>

      {renta.estado === "en_espera" && (
        <div className="flex flex-col items-center gap-4 rounded-xl bg-amber-50 p-8">
          <div className="size-10 animate-spin rounded-full border-4 border-amber-300 border-t-amber-600" />
          <p className="font-semibold text-amber-800">
            Tu reserva está siendo revisada. Te confirmaremos pronto.
          </p>
        </div>
      )}

      {renta.estado === "confirmada" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-green-50 p-8">
          <span className="text-4xl">✅</span>
          <p className="font-semibold text-green-800">¡Reserva confirmada!</p>
          <p className="text-green-700">
            {renta.jetski?.nombre} — {formatFecha(renta.fecha)} a las{" "}
            {formatHora12h(renta.hora_inicio)}
          </p>
        </div>
      )}

      {renta.estado === "rechazada" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-red-50 p-8">
          <span className="text-4xl">❌</span>
          <p className="font-semibold text-red-800">Tu reserva fue rechazada.</p>
          <p className="text-red-700">Contáctanos por WhatsApp para más información.</p>
        </div>
      )}

      {renta.estado === "completada" && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-brand/5 p-8">
          <span className="text-4xl">🏁</span>
          <p className="font-semibold text-brand">Renta completada. ¡Gracias por elegirnos!</p>
        </div>
      )}

      <WhatsappButton />
    </div>
  );
}

function WhatsappButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-semibold text-white"
    >
      WhatsApp
    </a>
  );
}
