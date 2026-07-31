import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { formatMoneda } from "@/lib/format";
import { NOMBRE_NEGOCIO_DEFECTO, SUBTITULO_DEFECTO, REGLAS_DEFECTO } from "@/lib/configuracion";
import type { Jetski } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: jetskis }, { data: config }] = await Promise.all([
    supabase
      .from("jetskis")
      .select("id, nombre, foto_url, precio_hora")
      .eq("estado", "disponible")
      .order("nombre"),
    supabase.from("configuracion").select("*").eq("id", true).single(),
  ]);

  const nombreNegocio = config?.nombre_negocio || NOMBRE_NEGOCIO_DEFECTO;
  const subtitulo = config?.subtitulo || SUBTITULO_DEFECTO;
  const whatsappUrl = `https://wa.me/${config?.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMERO}`;
  const reglas = (config?.reglas || REGLAS_DEFECTO).split("\n").filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-ej-crema">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-ej-crema px-4 md:px-8">
        <div className="text-xl font-medium text-ej-tinta">{nombreNegocio}</div>
        <Button
          render={<Link href="/reservar" />}
          className="h-11 rounded-full bg-ej-turquesa px-5 text-ej-turquesa-tx hover:bg-ej-turquesa/90"
        >
          Reservar
        </Button>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-10 pb-6 text-center md:pt-16">
        <span className="rounded-full bg-ej-coral-sv px-4 py-1.5 text-xs font-medium text-ej-coral-sv-tx">
          Disponible hoy
        </span>
        <h1
          className="mt-5 text-4xl font-medium text-ej-tinta md:text-6xl"
          style={{ letterSpacing: "-1.5px", lineHeight: 1.05 }}
        >
          {nombreNegocio}
        </h1>
        <p className="mt-4 text-lg text-ej-tinta-sv md:text-xl" style={{ lineHeight: 1.55 }}>
          {subtitulo}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            render={<Link href="/reservar" />}
            size="lg"
            className="h-12 rounded-full bg-ej-coral px-8 text-base text-ej-coral-tx hover:bg-ej-coral/90"
          >
            Reservar ahora
          </Button>
          <Button
            render={<Link href="#flota" />}
            size="lg"
            variant="ghost"
            className="h-12 rounded-full bg-ej-turquesa-sv px-8 text-base text-ej-turquesa-tx hover:bg-ej-turquesa-sv/70"
          >
            Ver flota
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 md:px-8">
        <div className="relative h-[220px] w-full overflow-hidden rounded-[20px] bg-ej-agua md:h-[340px]">
          {config?.foto_portada_url && (
            <Image
              src={config.foto_portada_url}
              alt={nombreNegocio}
              fill
              priority
              className="object-cover"
            />
          )}
        </div>
      </section>

      <section id="flota" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 md:px-8">
        <h2
          className="mb-6 text-xl text-ej-tinta"
          style={{ letterSpacing: "-1.5px", fontWeight: 500 }}
        >
          Jetskis disponibles
        </h2>
        {!jetskis || jetskis.length === 0 ? (
          <p className="text-sm text-ej-tinta-mut">
            No hay jetskis disponibles en este momento. Contáctanos por WhatsApp.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {jetskis.map((jetski: Pick<Jetski, "id" | "nombre" | "foto_url" | "precio_hora">) => (
              <div
                key={jetski.id}
                className="flex items-center gap-3 rounded-[16px] bg-ej-blanco p-3"
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-[12px] bg-ej-agua">
                  {jetski.foto_url && (
                    <Image
                      src={jetski.foto_url}
                      alt={jetski.nombre}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ej-tinta">{jetski.nombre}</p>
                  <p className="text-xs text-ej-tinta-mut">Disponible</p>
                </div>
                <p className="text-[15px] text-ej-tinta">
                  {formatMoneda(jetski.precio_hora)}{" "}
                  <span className="text-xs text-ej-tinta-mut">/h</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-8">
        <div className="rounded-[20px] bg-ej-turquesa-sv p-6">
          <h2 className="mb-4 text-sm font-medium text-ej-turquesa-tx">Reglas del negocio</h2>
          <ul className="flex flex-col gap-3">
            {reglas.map((regla) => (
              <li key={regla} className="flex gap-3 text-sm text-ej-tinta">
                <span className="text-ej-turquesa">●</span>
                {regla}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <p className="text-sm text-ej-tinta-mut">{nombreNegocio} — República Dominicana</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-ej-turquesa px-5 text-sm font-medium text-ej-turquesa-tx"
          >
            WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
