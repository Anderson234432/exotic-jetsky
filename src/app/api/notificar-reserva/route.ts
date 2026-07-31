import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/admin";
import { emailNuevaReserva } from "@/lib/emails";
import type { Jetski, Renta } from "@/lib/types";

type RentaConRelaciones = Renta & {
  jetski: Pick<Jetski, "nombre" | "precio_hora"> | null;
  cliente: { nombre: string; telefono: string; cedula: string } | null;
};

function urlSitio(): string {
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return dominio ? `https://${dominio}` : "http://localhost:3000";
}

// Se llama desde /reservar con fetch() después de crear la renta, sin
// esperar la respuesta — un fallo aquí nunca debe impedir que el cliente
// vea su confirmación. Por eso este endpoint no le devuelve nada crítico
// a nadie: solo registra el resultado.
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Falta el id de la renta." }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_NOTIFICACIONES) {
      console.error("notificar-reserva: faltan RESEND_API_KEY o EMAIL_NOTIFICACIONES");
      return NextResponse.json({ error: "Notificaciones no configuradas." }, { status: 500 });
    }

    const supabase = createServiceClient();
    const { data: renta, error } = await supabase
      .from("rentas")
      .select("*, jetski:jetskis(nombre, precio_hora), cliente:clientes(nombre, telefono, cedula)")
      .eq("id", id)
      .returns<RentaConRelaciones[]>()
      .single();

    if (error || !renta) {
      return NextResponse.json({ error: error?.message ?? "Renta no encontrada." }, { status: 404 });
    }

    const { subject, html } = emailNuevaReserva({
      rentaId: renta.id,
      nombre: renta.cliente?.nombre ?? "—",
      telefono: renta.cliente?.telefono ?? "—",
      cedula: renta.cliente?.cedula ?? "—",
      jetski: renta.jetski?.nombre ?? "—",
      fecha: renta.fecha,
      horaInicio: renta.hora_inicio,
      horasRenta: renta.horas_renta,
      costoEstimado: (renta.jetski?.precio_hora ?? 0) * renta.horas_renta,
      urlAdmin: `${urlSitio()}/admin/rentas`,
    });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: errorEnvio } = await resend.emails.send({
      from: "Exotic Jetsky <onboarding@resend.dev>",
      to: [process.env.EMAIL_NOTIFICACIONES],
      subject,
      html,
    });

    if (errorEnvio) {
      console.error("notificar-reserva:", errorEnvio);
      return NextResponse.json({ error: errorEnvio.message }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("notificar-reserva:", error);
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
