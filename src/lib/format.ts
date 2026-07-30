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
