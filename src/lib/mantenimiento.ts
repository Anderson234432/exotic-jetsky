import type { Jetski } from "@/lib/types";

export function horasHastaMantenimiento(jetski: Jetski): number {
  const usadas = jetski.horas_maquina - jetski.horas_ultimo_mantenimiento;
  return jetski.horas_mantenimiento_intervalo - usadas;
}

export function requiereAlertaMantenimiento(jetski: Jetski): boolean {
  return horasHastaMantenimiento(jetski) <= 2;
}
