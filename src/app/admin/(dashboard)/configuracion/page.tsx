"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { subirArchivo } from "@/lib/storage";
import { mensajeError } from "@/lib/errors";
import {
  NOMBRE_NEGOCIO_DEFECTO,
  SUBTITULO_DEFECTO,
  REGLAS_DEFECTO,
  HORA_APERTURA_DEFECTO,
  HORA_CIERRE_DEFECTO,
} from "@/lib/configuracion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CuentasBancarias } from "@/components/admin/cuentas-bancarias";
import { toast } from "sonner";

export default function AdminConfiguracionPage() {
  const supabase = createClient();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [reglas, setReglas] = useState("");
  const [horaApertura, setHoraApertura] = useState(HORA_APERTURA_DEFECTO);
  const [horaCierre, setHoraCierre] = useState(HORA_CIERRE_DEFECTO);

  useEffect(() => {
    supabase
      .from("configuracion")
      .select("*")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setFotoUrl(data.foto_portada_url);
          setNombreNegocio(data.nombre_negocio ?? "");
          setSubtitulo(data.subtitulo ?? "");
          setWhatsapp(data.whatsapp ?? "");
          setReglas(data.reglas ?? "");
          setHoraApertura((data.hora_apertura ?? HORA_APERTURA_DEFECTO).slice(0, 5));
          setHoraCierre((data.hora_cierre ?? HORA_CIERRE_DEFECTO).slice(0, 5));
        }
        setCargando(false);
      });
  }, [supabase]);

  async function handleGuardar() {
    setGuardando(true);
    try {
      let nuevaFotoUrl = fotoUrl;
      if (foto) {
        nuevaFotoUrl = await subirArchivo(supabase, "configuracion", foto);
      }

      const { error } = await supabase
        .from("configuracion")
        .update({
          foto_portada_url: nuevaFotoUrl,
          nombre_negocio: nombreNegocio.trim() || null,
          subtitulo: subtitulo.trim() || null,
          whatsapp: whatsapp.trim() || null,
          reglas: reglas.trim() || null,
          hora_apertura: horaApertura || null,
          hora_cierre: horaCierre || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true);

      if (error) throw error;

      setFotoUrl(nuevaFotoUrl);
      setFoto(null);
      toast.success("Configuración guardada.");
    } catch (error) {
      toast.error(mensajeError(error));
    }
    setGuardando(false);
  }

  if (cargando) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Configuración</h1>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-col gap-2">
            <Label>Foto de portada</Label>
            <div className="relative h-48 w-full overflow-hidden rounded-[20px] bg-ej-agua">
              {(foto ? URL.createObjectURL(foto) : fotoUrl) ? (
                <Image
                  src={foto ? URL.createObjectURL(foto) : fotoUrl!}
                  alt="Foto de portada"
                  fill
                  className="object-cover"
                  unoptimized={!!foto}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ej-tinta-mut">
                  Sin foto — se muestra un fondo neutro en el sitio
                </div>
              )}
            </div>
            <Input
              id="fotoPortada"
              type="file"
              accept="image/*"
              className="h-11 pt-2"
              onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nombreNegocio">Nombre del negocio</Label>
            <Input
              id="nombreNegocio"
              className="h-11"
              placeholder={NOMBRE_NEGOCIO_DEFECTO}
              maxLength={100}
              value={nombreNegocio}
              onChange={(e) => setNombreNegocio(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="subtituloConfig">Subtítulo de la portada</Label>
            <Textarea
              id="subtituloConfig"
              placeholder={SUBTITULO_DEFECTO}
              rows={2}
              maxLength={200}
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsappConfig">Número de WhatsApp</Label>
            <Input
              id="whatsappConfig"
              inputMode="numeric"
              className="h-11"
              placeholder="18298579401"
              maxLength={20}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="reglasConfig">Reglas del negocio</Label>
            <Textarea
              id="reglasConfig"
              placeholder={REGLAS_DEFECTO}
              rows={6}
              value={reglas}
              onChange={(e) => setReglas(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Cada línea aparece como una regla separada en la página principal.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="horaApertura">Hora de apertura</Label>
              <Input
                id="horaApertura"
                type="time"
                className="h-11"
                value={horaApertura}
                onChange={(e) => setHoraApertura(e.target.value)}
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="horaCierre">Hora de cierre</Label>
              <Input
                id="horaCierre"
                type="time"
                className="h-11"
                value={horaCierre}
                onChange={(e) => setHoraCierre(e.target.value)}
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-muted-foreground">
            Los horarios de renta en /reservar se generan en bloques de 30 minutos dentro de
            este rango.
          </p>

          <Button
            onClick={handleGuardar}
            disabled={guardando}
            className="h-11 w-fit bg-brand hover:bg-brand/90 text-brand-foreground"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>

      <CuentasBancarias />
    </div>
  );
}
