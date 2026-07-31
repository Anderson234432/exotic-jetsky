import { formatFecha, formatHora12h, formatMoneda } from "@/lib/format";
import type { EstadoRenta } from "@/lib/types";

// Colores tomados directo de --ej-* (globals.css). Los clientes de correo no
// leen variables CSS ni @import, así que van como hex inline.
const COLOR = {
  crema: "#FFF9F2",
  blanco: "#FFFFFF",
  turquesa: "#00B4A6",
  turquesaSv: "#E8F5F3",
  turquesaTx: "#0F6E56",
  coral: "#FF6B35",
  coralSv: "#FFE0CC",
  coralSvTx: "#993C1D",
  tinta: "#123B42",
  tintaSv: "#4A6A70",
  tintaMut: "#7A9599",
  borde: "#E8E2D8",
};

const ESTADO_LABEL: Record<EstadoRenta, string> = {
  en_espera: "En espera",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
  completada: "Completada",
};

function envolver(contenido: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:${COLOR.crema}; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLOR.crema};">
      <tr>
        <td align="center" style="padding:24px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${COLOR.blanco}; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="background-color:${COLOR.turquesa}; padding:20px 24px;">
                <span style="color:${COLOR.blanco}; font-size:18px; font-weight:bold;">Exotic Jetsky</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${contenido}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px; border-top:1px solid ${COLOR.borde};">
                <span style="color:${COLOR.tintaMut}; font-size:12px;">
                  Notificación automática — Exotic Jetsky
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function boton(texto: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
    <tr>
      <td style="background-color:${COLOR.coral}; border-radius:999px;">
        <a href="${url}" style="display:inline-block; padding:12px 24px; color:${COLOR.coralSvTx}; font-size:14px; font-weight:bold; text-decoration:none;">
          ${texto}
        </a>
      </td>
    </tr>
  </table>`;
}

export interface DatosReservaNueva {
  rentaId: string;
  nombre: string;
  telefono: string;
  cedula: string;
  jetski: string;
  fecha: string;
  horaInicio: string;
  horasRenta: number;
  costoEstimado: number;
  urlAdmin: string;
}

export function emailNuevaReserva(d: DatosReservaNueva): { subject: string; html: string } {
  const filas: [string, string][] = [
    ["Cliente", d.nombre],
    ["Teléfono", d.telefono],
    ["Cédula", d.cedula],
    ["Jetski", d.jetski],
    ["Fecha", formatFecha(d.fecha)],
    ["Hora", formatHora12h(d.horaInicio)],
    ["Horas", `${d.horasRenta}h`],
    ["Costo estimado", formatMoneda(d.costoEstimado)],
  ];

  const filasHtml = filas
    .map(
      ([label, valor]) => `
      <tr>
        <td style="padding:8px 0; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tintaMut}; font-size:13px; width:140px;">${label}</td>
        <td style="padding:8px 0; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:14px; font-weight:bold;">${valor}</td>
      </tr>`
    )
    .join("");

  const contenido = `
    <p style="margin:0 0 16px; color:${COLOR.tinta}; font-size:18px; font-weight:bold;">Nueva reserva</p>
    <p style="margin:0 0 16px; color:${COLOR.tintaSv}; font-size:14px;">
      Un cliente acaba de reservar y está esperando confirmación de pago.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${filasHtml}
    </table>
    ${boton("Ver en el panel", d.urlAdmin)}
  `;

  return {
    subject: `Nueva reserva — ${d.nombre} — ${formatFecha(d.fecha)} ${formatHora12h(d.horaInicio)}`,
    html: envolver(contenido),
  };
}

export interface RentaResumen {
  horaInicio: string;
  cliente: string;
  telefono: string;
  jetski: string;
  horasRenta: number;
  estado: EstadoRenta;
  costo: number;
}

export interface AlertaMantenimiento {
  jetski: string;
  horasRestantes: number;
}

export interface DatosResumenDiario {
  fecha: string;
  rentas: RentaResumen[];
  totalEsperado: number;
  alertasMantenimiento: AlertaMantenimiento[];
}

export function emailResumenDiario(d: DatosResumenDiario): { subject: string; html: string } {
  const subject = `Rentas de hoy — ${d.rentas.length} reserva${d.rentas.length === 1 ? "" : "s"}`;

  if (d.rentas.length === 0) {
    const contenido = `
      <p style="margin:0 0 8px; color:${COLOR.tinta}; font-size:18px; font-weight:bold;">Rentas de hoy</p>
      <p style="margin:0; color:${COLOR.tintaSv}; font-size:14px;">
        No hay rentas programadas para ${formatFecha(d.fecha)}.
      </p>
      ${alertasHtml(d.alertasMantenimiento)}
    `;
    return { subject, html: envolver(contenido) };
  }

  const encabezados = ["Hora", "Cliente", "Teléfono", "Jetski", "Horas", "Estado", "Costo"];
  const filasHtml = d.rentas
    .map(
      (r) => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:13px;">${formatHora12h(r.horaInicio)}</td>
        <td style="padding:8px; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:13px;">${r.cliente}</td>
        <td style="padding:8px; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:13px;">${r.telefono}</td>
        <td style="padding:8px; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:13px;">${r.jetski}</td>
        <td style="padding:8px; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:13px;">${r.horasRenta}h</td>
        <td style="padding:8px; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:13px;">${ESTADO_LABEL[r.estado]}</td>
        <td style="padding:8px; border-bottom:1px solid ${COLOR.borde}; color:${COLOR.tinta}; font-size:13px; font-weight:bold;">${formatMoneda(r.costo)}</td>
      </tr>`
    )
    .join("");

  const encabezadosHtml = encabezados
    .map(
      (h) =>
        `<td style="padding:8px; background-color:${COLOR.turquesaSv}; color:${COLOR.turquesaTx}; font-size:12px; font-weight:bold;">${h}</td>`
    )
    .join("");

  const contenido = `
    <p style="margin:0 0 16px; color:${COLOR.tinta}; font-size:18px; font-weight:bold;">
      Rentas de hoy — ${formatFecha(d.fecha)}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>${encabezadosHtml}</tr>
      ${filasHtml}
    </table>
    <p style="margin:16px 0 0; color:${COLOR.tinta}; font-size:15px;">
      Total esperado del día: <strong>${formatMoneda(d.totalEsperado)}</strong>
    </p>
    ${alertasHtml(d.alertasMantenimiento)}
  `;

  return { subject, html: envolver(contenido) };
}

function alertasHtml(alertas: AlertaMantenimiento[]): string {
  if (alertas.length === 0) return "";

  const items = alertas
    .map(
      (a) =>
        `<li style="color:${COLOR.coralSvTx}; font-size:13px; margin-bottom:4px;">
          ${a.jetski} — mantenimiento en ${a.horasRestantes <= 0 ? "0" : a.horasRestantes.toFixed(1)} horas
        </li>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; background-color:${COLOR.coralSv}; border-radius:16px;">
      <tr>
        <td style="padding:16px;">
          <p style="margin:0 0 8px; color:${COLOR.coralSvTx}; font-size:14px; font-weight:bold;">
            ⚠ Alertas de mantenimiento
          </p>
          <ul style="margin:0; padding-left:18px;">
            ${items}
          </ul>
        </td>
      </tr>
    </table>
  `;
}
