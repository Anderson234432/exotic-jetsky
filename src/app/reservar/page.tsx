"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { subirArchivo } from "@/lib/storage";
import { formatCedula, formatHora12h, formatMoneda, formatTelefono, hoyRD } from "@/lib/format";
import { NOMBRE_NEGOCIO_DEFECTO, HORA_APERTURA_DEFECTO, HORA_CIERRE_DEFECTO } from "@/lib/configuracion";
import { generarBloques, bloqueDisponible, type RentaOcupada } from "@/lib/horarios";
import { cn } from "@/lib/utils";
import type { CuentaBancaria, Jetski } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CuentaBancariaCard } from "@/components/public/cuenta-bancaria-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { mensajeError } from "@/lib/errors";

const TOTAL_PASOS = 3;

type JetskiPublico = Pick<Jetski, "id" | "nombre" | "precio_hora">;

interface FormState {
  nombre: string;
  cedula: string;
  telefono: string;
  jetskiId: string;
  fecha: string;
  horaInicio: string;
  horasRenta: string;
  reglasAceptadas: boolean;
}

const initialState: FormState = {
  nombre: "",
  cedula: "",
  telefono: "",
  jetskiId: "",
  fecha: "",
  horaInicio: "",
  horasRenta: "1",
  reglasAceptadas: false,
};

export default function ReservarPage() {
  const router = useRouter();
  const supabase = createClient();

  const [paso, setPaso] = useState(1);
  const [jetskis, setJetskis] = useState<JetskiPublico[]>([]);
  const [form, setForm] = useState<FormState>(initialState);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState(NOMBRE_NEGOCIO_DEFECTO);
  const [whatsapp, setWhatsapp] = useState(process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? "");
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [horaApertura, setHoraApertura] = useState(HORA_APERTURA_DEFECTO);
  const [horaCierre, setHoraCierre] = useState(HORA_CIERRE_DEFECTO);
  const [ocupadas, setOcupadas] = useState<RentaOcupada[]>([]);
  const [claveOcupadasCargada, setClaveOcupadasCargada] = useState("");
  const [refrescarDisponibilidad, setRefrescarDisponibilidad] = useState(0);

  // DEBUG TEMPORAL — se loguea en CADA render del componente, sin excepción.
  // Solo en el navegador (esta página se pre-renderiza en el build también).
  if (typeof window !== "undefined") {
    console.log("[DEBUG] render ReservarPage");
  }

  useEffect(() => {
    console.log("[DEBUG] efecto fetch jetskis EJECUTADO (debería ser 1 sola vez)");
    supabase
      .from("jetskis")
      .select("id, nombre, precio_hora")
      .eq("estado", "disponible")
      .order("nombre")
      .then(({ data }) => setJetskis(data ?? []));

    supabase
      .from("configuracion")
      .select("nombre_negocio, whatsapp, hora_apertura, hora_cierre")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (data?.nombre_negocio) setNombreNegocio(data.nombre_negocio);
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
        if (data?.hora_apertura) setHoraApertura(data.hora_apertura.slice(0, 5));
        if (data?.hora_cierre) setHoraCierre(data.hora_cierre.slice(0, 5));
      });

    supabase
      .from("cuentas_bancarias")
      .select("*")
      .eq("activa", true)
      .order("orden")
      .then(({ data }) => setCuentas(data ?? []));
  }, [supabase]);

  // DEBUG TEMPORAL — quitar después de diagnosticar el bug del select.
  useEffect(() => {
    console.log("[DEBUG] estado form:", JSON.stringify(form), "jetskis:", jetskis.map((j) => j.id));
  }, [form, jetskis]);

  const jetskiSeleccionado = jetskis.find((j) => j.id === form.jetskiId);
  const horas = Number(form.horasRenta) || 0;
  const costoEstimado = (jetskiSeleccionado?.precio_hora ?? 0) * horas;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const claveDisponibilidad = form.jetskiId && form.fecha ? `${form.jetskiId}|${form.fecha}` : "";
  // Derivado en vez de un booleano aparte: "cargando" es simplemente que la
  // clave actual todavía no coincide con la última que terminó de resolver.
  const cargandoDisponibilidad =
    claveDisponibilidad !== "" && claveDisponibilidad !== claveOcupadasCargada;

  useEffect(() => {
    if (!form.jetskiId || !form.fecha) return;
    const clave = `${form.jetskiId}|${form.fecha}`;
    supabase
      .from("rentas")
      .select("hora_inicio, horas_renta")
      .eq("jetski_id", form.jetskiId)
      .eq("fecha", form.fecha)
      .in("estado", ["en_espera", "confirmada", "completada"])
      .then(({ data }) => {
        setOcupadas(data ?? []);
        setClaveOcupadasCargada(clave);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.jetskiId, form.fecha, refrescarDisponibilidad]);

  // Derivado, no estado: si cambian jetski/fecha/horas y el bloque elegido
  // ya no aparece disponible en la nueva grilla, se trata como "sin elegir"
  // sin necesidad de un efecto que lo limpie a mano.
  const ocupadasEfectivas = form.jetskiId && form.fecha ? ocupadas : [];
  const bloques = generarBloques(horaApertura, horaCierre, horas);
  const bloquesConEstado = bloques.map((hora) => ({
    hora,
    disponible: bloqueDisponible(hora, horas, ocupadasEfectivas),
  }));
  const hayDisponibles = bloquesConEstado.some((b) => b.disponible);
  const horaInicioValida = bloquesConEstado.some(
    (b) => b.hora === form.horaInicio && b.disponible
  )
    ? form.horaInicio
    : "";

  const PREFIJOS_TELEFONO = ["809", "829", "849"];

  function cedulaValida() {
    return form.cedula.length === 11;
  }

  function telefonoValido() {
    return form.telefono.length === 10 && PREFIJOS_TELEFONO.includes(form.telefono.slice(0, 3));
  }

  function validarPaso1() {
    return form.nombre.trim() && cedulaValida() && telefonoValido();
  }

  function validarPaso2() {
    return (
      form.jetskiId &&
      form.fecha &&
      form.fecha >= hoyRD() &&
      horaInicioValida &&
      horas > 0 &&
      horas <= 24
    );
  }

  function motivoPaso2Incompleto() {
    if (!form.jetskiId) return "Selecciona un jetski.";
    if (!form.fecha) return "Elige una fecha.";
    if (form.fecha < hoyRD()) return "La fecha no puede ser anterior a hoy.";
    if (!horaInicioValida) return "Elige una hora de inicio.";
    if (!(horas > 0 && horas <= 24)) return "Las horas a rentar deben estar entre 1 y 24.";
    return null;
  }

  async function handleSubmit() {
    if (!comprobante) {
      toast.error("Sube la foto de tu comprobante de adelanto.");
      return;
    }
    if (!form.reglasAceptadas) {
      toast.error("Debes aceptar las reglas del negocio.");
      return;
    }

    setEnviando(true);
    try {
      const fotoUrl = await subirArchivo(supabase, "adelantos", comprobante);

      // Los clientes solo pueden leerse por el admin (RLS), así que generamos
      // el id en el cliente para no depender de un select() tras el insert.
      const clienteId = crypto.randomUUID();
      const { error: errorCliente } = await supabase.from("clientes").insert({
        id: clienteId,
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        telefono: form.telefono.trim(),
      });
      if (errorCliente) throw errorCliente;

      const { data: renta, error: errorRenta } = await supabase
        .from("rentas")
        .insert({
          jetski_id: form.jetskiId,
          cliente_id: clienteId,
          fecha: form.fecha,
          hora_inicio: horaInicioValida,
          horas_renta: horas,
          estado: "en_espera",
          adelanto_foto_url: fotoUrl,
          reglas_aceptadas: form.reglasAceptadas,
        })
        .select("id")
        .single();
      if (errorRenta || !renta) throw errorRenta;

      // Fire-and-forget: si el correo al dueño falla, la reserva ya está
      // creada y el cliente debe ver su confirmación igual.
      fetch("/api/notificar-reserva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: renta.id }),
      }).catch(() => {});

      router.push(`/reserva/${renta.id}`);
    } catch (error) {
      // 23P01 = exclusion_violation: el constraint rentas_sin_solapamiento
      // rechazó el insert porque alguien más reservó ese mismo bloque justo
      // antes. El error crudo de Postgres no le dice nada útil al cliente.
      if ((error as { code?: string })?.code === "23P01") {
        toast.error("Ese horario acaba de ser reservado por otra persona. Elige otro.");
        update("horaInicio", "");
        setClaveOcupadasCargada("");
        setRefrescarDisponibilidad((n) => n + 1);
      } else {
        toast.error(mensajeError(error));
      }
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-medium text-ej-tinta">
          {nombreNegocio}
        </Link>
        <span className="text-sm text-ej-tinta-mut">
          Paso {paso} de {TOTAL_PASOS}
        </span>
      </header>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < paso ? "bg-ej-turquesa" : "bg-ej-agua"
            }`}
          />
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {paso === 1 && (
            <>
              <h1 className="text-xl font-medium text-ej-tinta">Datos personales</h1>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  className="h-12"
                  maxLength={100}
                  value={form.nombre}
                  onChange={(e) => update("nombre", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  inputMode="numeric"
                  className="h-12"
                  maxLength={13}
                  placeholder="001-1234567-8"
                  value={formatCedula(form.cedula)}
                  onChange={(e) =>
                    update("cedula", e.target.value.replace(/\D/g, "").slice(0, 11))
                  }
                />
                {form.cedula.length > 0 && !cedulaValida() && (
                  <p className="text-sm text-destructive">La cédula debe tener 11 dígitos</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  inputMode="tel"
                  className="h-12"
                  maxLength={14}
                  placeholder="(809) 123-4567"
                  value={formatTelefono(form.telefono)}
                  onChange={(e) =>
                    update("telefono", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                />
                {form.telefono.length > 0 && form.telefono.length < 10 && (
                  <p className="text-sm text-destructive">El teléfono debe tener 10 dígitos</p>
                )}
                {form.telefono.length === 10 &&
                  !PREFIJOS_TELEFONO.includes(form.telefono.slice(0, 3)) && (
                    <p className="text-sm text-destructive">
                      El teléfono debe empezar con 809, 829 o 849
                    </p>
                  )}
              </div>
              <Button
                className="h-12 rounded-full bg-ej-coral text-ej-coral-tx hover:bg-ej-coral/90"
                disabled={!validarPaso1()}
                onClick={() => setPaso(2)}
              >
                Siguiente
              </Button>
            </>
          )}

          {paso === 2 && (
            <>
              <h1 className="text-xl font-medium text-ej-tinta">Tu reserva</h1>
              <div className="flex flex-col gap-2">
                <Label>Jetski</Label>
                <Select
                  value={form.jetskiId}
                  onValueChange={(v) => {
                    console.log("[DEBUG] select onValueChange:", JSON.stringify(v), typeof v);
                    update("jetskiId", v ?? "");
                  }}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Selecciona un jetski" />
                  </SelectTrigger>
                  <SelectContent>
                    {jetskis.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.nombre} — {formatMoneda(j.precio_hora)}/hora
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  className="h-12"
                  min={hoyRD()}
                  value={form.fecha}
                  onChange={(e) => update("fecha", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="horas">Horas a rentar</Label>
                <Input
                  id="horas"
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  className="h-12"
                  value={form.horasRenta}
                  onChange={(e) => update("horasRenta", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Hora de inicio</Label>
                {!form.jetskiId || !form.fecha ? (
                  <p className="text-sm text-ej-tinta-mut">
                    Elige un jetski y una fecha para ver los horarios disponibles
                  </p>
                ) : cargandoDisponibilidad ? (
                  <p className="text-sm text-ej-tinta-mut">Consultando disponibilidad...</p>
                ) : !hayDisponibles ? (
                  <p className="text-sm text-ej-tinta-mut">
                    No hay horarios disponibles para este jetski en esta fecha. Prueba otro día
                    u otro jetski.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                    {bloquesConEstado.map(({ hora, disponible }) => (
                      <button
                        key={hora}
                        type="button"
                        disabled={!disponible}
                        onClick={() => update("horaInicio", hora)}
                        className={cn(
                          "flex h-11 items-center justify-center rounded-full px-2 text-sm font-medium transition-colors",
                          !disponible
                            ? "cursor-not-allowed bg-ej-agua text-ej-tinta-mut"
                            : horaInicioValida === hora
                              ? "bg-ej-turquesa text-ej-tinta"
                              : "border border-ej-borde bg-ej-blanco text-ej-tinta hover:border-ej-turquesa"
                        )}
                      >
                        {formatHora12h(hora)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {jetskiSeleccionado && (
                <div className="rounded-[16px] bg-ej-turquesa-sv p-4 text-center">
                  <p className="text-sm text-ej-turquesa-tx">Costo estimado</p>
                  <p className="text-2xl font-medium text-ej-turquesa-tx">
                    {formatMoneda(costoEstimado)}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="h-12 flex-1 rounded-full bg-ej-turquesa-sv text-ej-turquesa-tx hover:bg-ej-turquesa-sv/70"
                  onClick={() => setPaso(1)}
                >
                  Atrás
                </Button>
                <Button
                  className="h-12 flex-1 rounded-full bg-ej-coral text-ej-coral-tx hover:bg-ej-coral/90"
                  disabled={!validarPaso2()}
                  onClick={() => setPaso(3)}
                >
                  Siguiente
                </Button>
              </div>
              {!validarPaso2() && (
                <p className="text-center text-sm text-muted-foreground">
                  {motivoPaso2Incompleto()}
                </p>
              )}
            </>
          )}

          {paso === 3 && (
            <>
              <h1 className="text-xl font-medium text-ej-tinta">Pago del adelanto</h1>

              {cuentas.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-ej-tinta">
                    Realiza el pago a una de estas cuentas
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {cuentas.map((cuenta) => (
                      <CuentaBancariaCard key={cuenta.id} cuenta={cuenta} />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[16px] bg-ej-turquesa-sv p-4 text-sm text-ej-tinta">
                Para confirmar tu reserva, realiza el pago del adelanto y contáctanos
                por{" "}
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ej-turquesa-tx underline"
                >
                  WhatsApp
                </a>{" "}
                para coordinar el método de pago. Luego sube aquí la foto de tu
                comprobante.
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="comprobante">Foto del comprobante</Label>
                <Input
                  id="comprobante"
                  type="file"
                  accept="image/*"
                  className="h-12 pt-2"
                  onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="reglas"
                  checked={form.reglasAceptadas}
                  onCheckedChange={(checked) => update("reglasAceptadas", checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="reglas" className="text-sm font-normal">
                  Acepto las reglas del negocio: soy responsable de cualquier daño,
                  entiendo que las cancelaciones con menos de 24h no tienen reembolso
                  y presentaré mi cédula al momento de la renta.
                </Label>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="h-12 flex-1 rounded-full bg-ej-turquesa-sv text-ej-turquesa-tx hover:bg-ej-turquesa-sv/70"
                  onClick={() => setPaso(2)}
                >
                  Atrás
                </Button>
                <Button
                  className="h-12 flex-1 rounded-full bg-ej-coral text-ej-coral-tx hover:bg-ej-coral/90"
                  disabled={enviando}
                  onClick={handleSubmit}
                >
                  {enviando ? "Enviando..." : "Confirmar reserva"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
