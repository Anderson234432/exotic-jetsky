"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { subirArchivo } from "@/lib/storage";
import { formatMoneda } from "@/lib/format";
import type { Jetski } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const WHATSAPP_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMERO}`;
const TOTAL_PASOS = 3;

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
  const [jetskis, setJetskis] = useState<Jetski[]>([]);
  const [form, setForm] = useState<FormState>(initialState);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    supabase
      .from("jetskis")
      .select("*")
      .eq("estado", "disponible")
      .order("nombre")
      .then(({ data }) => setJetskis(data ?? []));
  }, [supabase]);

  const jetskiSeleccionado = jetskis.find((j) => j.id === form.jetskiId);
  const horas = Number(form.horasRenta) || 0;
  const costoEstimado = (jetskiSeleccionado?.precio_hora ?? 0) * horas;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validarPaso1() {
    return form.nombre.trim() && form.cedula.trim() && form.telefono.trim();
  }

  function validarPaso2() {
    return form.jetskiId && form.fecha && form.horaInicio && horas > 0;
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

      const { data: cliente, error: errorCliente } = await supabase
        .from("clientes")
        .insert({
          nombre: form.nombre.trim(),
          cedula: form.cedula.trim(),
          telefono: form.telefono.trim(),
        })
        .select()
        .single();
      if (errorCliente || !cliente) throw errorCliente;

      const { data: renta, error: errorRenta } = await supabase
        .from("rentas")
        .insert({
          jetski_id: form.jetskiId,
          cliente_id: cliente.id,
          fecha: form.fecha,
          hora_inicio: form.horaInicio,
          horas_renta: horas,
          estado: "en_espera",
          adelanto_foto_url: fotoUrl,
          reglas_aceptadas: form.reglasAceptadas,
        })
        .select()
        .single();
      if (errorRenta || !renta) throw errorRenta;

      router.push(`/reserva/${renta.id}`);
    } catch {
      toast.error("Ocurrió un error al enviar tu reserva. Intenta de nuevo.");
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          Exotic <span className="text-brand-accent">Jetsky</span>
        </Link>
        <span className="text-sm text-muted-foreground">
          Paso {paso} de {TOTAL_PASOS}
        </span>
      </header>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: TOTAL_PASOS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i < paso ? "bg-brand" : "bg-slate-200"
            }`}
          />
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          {paso === 1 && (
            <>
              <h1 className="text-xl font-bold">Datos personales</h1>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  className="h-11"
                  value={form.nombre}
                  onChange={(e) => update("nombre", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cedula">Cédula</Label>
                <Input
                  id="cedula"
                  className="h-11"
                  value={form.cedula}
                  onChange={(e) => update("cedula", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  className="h-11"
                  value={form.telefono}
                  onChange={(e) => update("telefono", e.target.value)}
                />
              </div>
              <Button
                className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground"
                disabled={!validarPaso1()}
                onClick={() => setPaso(2)}
              >
                Siguiente
              </Button>
            </>
          )}

          {paso === 2 && (
            <>
              <h1 className="text-xl font-bold">Tu reserva</h1>
              <div className="flex flex-col gap-2">
                <Label>Jetski</Label>
                <Select
                  value={form.jetskiId}
                  onValueChange={(v) => update("jetskiId", v ?? "")}
                >
                  <SelectTrigger className="h-11 w-full">
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
                  className="h-11"
                  value={form.fecha}
                  onChange={(e) => update("fecha", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="hora">Hora de inicio</Label>
                <Input
                  id="hora"
                  type="time"
                  className="h-11"
                  value={form.horaInicio}
                  onChange={(e) => update("horaInicio", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="horas">Horas a rentar</Label>
                <Input
                  id="horas"
                  type="number"
                  min={1}
                  step={1}
                  className="h-11"
                  value={form.horasRenta}
                  onChange={(e) => update("horasRenta", e.target.value)}
                />
              </div>
              {jetskiSeleccionado && (
                <div className="rounded-lg bg-brand/5 p-4 text-center">
                  <p className="text-sm text-muted-foreground">Costo estimado</p>
                  <p className="text-2xl font-bold text-brand">
                    {formatMoneda(costoEstimado)}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="h-11 flex-1" onClick={() => setPaso(1)}>
                  Atrás
                </Button>
                <Button
                  className="h-11 flex-1 bg-brand hover:bg-brand/90 text-brand-foreground"
                  disabled={!validarPaso2()}
                  onClick={() => setPaso(3)}
                >
                  Siguiente
                </Button>
              </div>
            </>
          )}

          {paso === 3 && (
            <>
              <h1 className="text-xl font-bold">Pago del adelanto</h1>
              <div className="rounded-lg bg-brand-accent/10 p-4 text-sm text-slate-700">
                Para confirmar tu reserva, realiza el pago del adelanto y contáctanos
                por{" "}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand underline"
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
                  className="h-11 pt-2"
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
                <Button variant="outline" className="h-11 flex-1" onClick={() => setPaso(2)}>
                  Atrás
                </Button>
                <Button
                  className="h-11 flex-1 bg-brand hover:bg-brand/90 text-brand-foreground"
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
