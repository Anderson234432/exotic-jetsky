const PASO_MINUTOS = 30;

export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function minutosAHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Bloques de 30 min entre apertura y cierre tales que la renta completa
// (horaInicio + horasRenta) termine a horaCierre o antes. Depende de
// horasRenta porque la última salida válida se acorta mientras más se rente.
export function generarBloques(
  horaApertura: string,
  horaCierre: string,
  horasRenta: number
): string[] {
  if (!(horasRenta > 0)) return [];

  const apertura = horaAMinutos(horaApertura);
  const cierre = horaAMinutos(horaCierre);
  const duracion = Math.round(horasRenta * 60);

  const bloques: string[] = [];
  for (let inicio = apertura; inicio + duracion <= cierre; inicio += PASO_MINUTOS) {
    bloques.push(minutosAHora(inicio));
  }
  return bloques;
}

// Dos rangos [a1, a2) y [b1, b2) se solapan si a1 < b2 && b1 < a2.
export function rangosSolapan(
  inicioA: number,
  finA: number,
  inicioB: number,
  finB: number
): boolean {
  return inicioA < finB && inicioB < finA;
}

export interface RentaOcupada {
  hora_inicio: string;
  horas_renta: number;
}

export function bloqueDisponible(
  horaBloque: string,
  horasRenta: number,
  ocupadas: RentaOcupada[]
): boolean {
  const inicio = horaAMinutos(horaBloque);
  const fin = inicio + Math.round(horasRenta * 60);

  return !ocupadas.some((r) => {
    const inicioR = horaAMinutos(r.hora_inicio);
    const finR = inicioR + Math.round(r.horas_renta * 60);
    return rangosSolapan(inicio, fin, inicioR, finR);
  });
}
