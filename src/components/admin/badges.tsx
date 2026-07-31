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
  en_espera: "bg-ej-coral-sv text-ej-coral-sv-tx",
  confirmada: "bg-ej-turquesa-sv text-ej-turquesa-tx",
  rechazada: "bg-[#FCEBEB] text-[#A32D2D]",
  completada: "bg-ej-agua text-ej-tinta-sv",
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
  disponible: "bg-ej-turquesa-sv text-ej-turquesa-tx",
  en_renta: "bg-ej-coral-sv text-ej-coral-sv-tx",
  mantenimiento: "bg-[#FCEBEB] text-[#A32D2D]",
};

export function EstadoJetskiBadge({ estado }: { estado: EstadoJetski }) {
  return (
    <Badge className={cn("border-transparent", ESTADO_JETSKI_CLASE[estado])}>
      {ESTADO_JETSKI_LABEL[estado]}
    </Badge>
  );
}
