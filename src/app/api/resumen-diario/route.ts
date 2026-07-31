import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/admin";
import { emailResumenDiario, type RentaResumen } from "@/lib/emails";
import { hoyRD } from "@/lib/format";
import { horasHastaMantenimiento, requiereAlertaMantenimiento } from "@/lib/mantenimiento";
import type { EstadoRenta, Jetski, Renta } from "@/lib/types";

// Disparado por vercel.json (crons: "0 12 * * *"). Vercel Cron corre en UTC
// y República Dominicana es UTC-4 todo el año (sin horario de verano), así
// que 12:00 UTC = 8:00 AM hora local — no ajustar esa expresión por estación.

type RentaConRelaciones = Renta & {
  jetski: Jetski | null;
  cliente: { nombre: string; telefono: string } | null;
};

const ESTADOS_DEL_DIA: EstadoRenta[] = ["en_espera", "confirmada", "completada"];

// Vercel Cron manda "Authorization: Bearer <CRON_SECRET>" automáticamente
// cuando CRON_SECRET está definida como variable de entorno — sin esto
// cualquiera podría llamar el endpoint y disparar correos a nombre nuestro.
function autorizado(request: NextRequest): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return request.headers.get("authorization") === `Bearer ${secreto}`;
}

export async function GET(request: NextRequest) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_NOTIFICACIONES) {
    console.error("resumen-diario: faltan RESEND_API_KEY o EMAIL_NOTIFICACIONES");
    return NextResponse.json({ error: "Notificaciones no configuradas." }, { status: 500 });
  }

  const supabase = createServiceClient();
  const hoy = hoyRD();

  const [{ data: rentas, error: errorRentas }, { data: jetskis, error: errorJetskis }] =
    await Promise.all([
      supabase
        .from("rentas")
        .select("*, jetski:jetskis(nombre, precio_hora), cliente:clientes(nombre, telefono)")
        .eq("fecha", hoy)
        .in("estado", ESTADOS_DEL_DIA)
        .order("hora_inicio")
        .returns<RentaConRelaciones[]>(),
      supabase.from("jetskis").select("*").returns<Jetski[]>(),
    ]);

  if (errorRentas || errorJetskis) {
    const mensaje = errorRentas?.message ?? errorJetskis?.message ?? "Error leyendo datos.";
    console.error("resumen-diario:", mensaje);
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }

  const rentasResumen: RentaResumen[] = (rentas ?? []).map((r) => ({
    horaInicio: r.hora_inicio,
    cliente: r.cliente?.nombre ?? "—",
    telefono: r.cliente?.telefono ?? "—",
    jetski: r.jetski?.nombre ?? "—",
    horasRenta: r.horas_renta,
    estado: r.estado,
    costo: (r.jetski?.precio_hora ?? 0) * r.horas_renta,
  }));

  const totalEsperado = rentasResumen.reduce((total, r) => total + r.costo, 0);

  const alertasMantenimiento = (jetskis ?? [])
    .filter(requiereAlertaMantenimiento)
    .map((j) => ({ jetski: j.nombre, horasRestantes: horasHastaMantenimiento(j) }));

  const { subject, html } = emailResumenDiario({
    fecha: hoy,
    rentas: rentasResumen,
    totalEsperado,
    alertasMantenimiento,
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error: errorEnvio } = await resend.emails.send({
    from: "Exotic Jetsky <onboarding@resend.dev>",
    to: [process.env.EMAIL_NOTIFICACIONES],
    subject,
    html,
  });

  if (errorEnvio) {
    console.error("resumen-diario:", errorEnvio);
    return NextResponse.json({ error: errorEnvio.message }, { status: 502 });
  }

  return NextResponse.json({ ok: true, rentas: rentasResumen.length });
}
