import { Badge } from "@/components/ui/badge";
import type { EstadoRenta, EstadoJetski } from "@/lib/types";
import { cn } from "@/lib/utils";

const ESTADO_RENTA_LABEL: Record<EstadoRenta, string> = {
  en_espera: "En espera",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
  completada: "Completada",
};

const ESTADO_RENTA_CLASE: Record<EstadoRenta, string> = {
  en_espera: "bg-amber-100 text-amber-800",
  confirmada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  completada: "bg-slate-200 text-slate-700",
};

export function EstadoRentaBadge({ estado }: { estado: EstadoRenta }) {
  return (
    <Badge className={cn("border-transparent", ESTADO_RENTA_CLASE[estado])}>
      {ESTADO_RENTA_LABEL[estado]}
    </Badge>
  );
}

const ESTADO_JETSKI_LABEL: Record<EstadoJetski, string> = {
  disponible: "Disponible",
  en_renta: "En renta",
  mantenimiento: "Mantenimiento",
};

const ESTADO_JETSKI_CLASE: Record<EstadoJetski, string> = {
  disponible: "bg-green-100 text-green-800",
  en_renta: "bg-blue-100 text-blue-800",
  mantenimiento: "bg-red-100 text-red-800",
};

export function EstadoJetskiBadge({ estado }: { estado: EstadoJetski }) {
  return (
    <Badge className={cn("border-transparent", ESTADO_JETSKI_CLASE[estado])}>
      {ESTADO_JETSKI_LABEL[estado]}
    </Badge>
  );
}
