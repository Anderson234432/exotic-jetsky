const ZONA_RD = "America/Santo_Domingo";

export function hoyRD(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: ZONA_RD });
}

export function inicioSemanaRD(): string {
  const [anio, mes, dia] = hoyRD().split("-").map(Number);
  const fechaUTC = new Date(Date.UTC(anio, mes - 1, dia));
  const diaSemanaISO = fechaUTC.getUTCDay() || 7; // lunes=1 ... domingo=7
  fechaUTC.setUTCDate(fechaUTC.getUTCDate() - (diaSemanaISO - 1));
  return fechaUTC.toISOString().slice(0, 10);
}

export function inicioMesRD(): string {
  const hoy = hoyRD();
  const [anio, mes] = hoy.split("-");
  return `${anio}-${mes}-01`;
}

export function formatMoneda(valor: number): string {
  return `RD$${valor.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

export function formatFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function formatHora12h(hora: string): string {
  const [h, m] = hora.split(":").map(Number);
  const periodo = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${periodo}`;
}
