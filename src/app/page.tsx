import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoneda } from "@/lib/format";
import { NOMBRE_NEGOCIO_DEFECTO, REGLAS_DEFECTO } from "@/lib/configuracion";
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
  const whatsappUrl = `https://wa.me/${config?.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMERO}`;
  const reglas = (config?.reglas || REGLAS_DEFECTO).split("\n").filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-8">
        <div className="text-xl font-bold">
          {config?.nombre_negocio ? (
            nombreNegocio
          ) : (
            <>
              Exotic <span className="text-brand-accent">Jetsky</span>
            </>
          )}
        </div>
        <Button
          render={<Link href="/reservar" />}
          className="hidden h-11 bg-brand hover:bg-brand/90 text-brand-foreground md:inline-flex"
        >
          Reservar ahora
        </Button>
      </header>

      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-brand">
        {config?.foto_portada_url && (
          <Image
            src={config.foto_portada_url}
            alt={nombreNegocio}
            fill
            priority
            className="object-cover opacity-50"
          />
        )}
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            {config?.nombre_negocio ? (
              nombreNegocio
            ) : (
              <>
                Exotic <span className="text-brand-accent">Jetsky</span>
              </>
            )}
          </h1>
          <p className="mt-4 text-lg text-white/90 md:text-xl">
            Renta jetskis de lujo en las mejores playas de República Dominicana.
          </p>
          <Button
            render={<Link href="/reservar" />}
            size="lg"
            className="mt-8 h-12 bg-brand-accent px-8 text-base hover:bg-brand-accent/90 text-brand-accent-foreground"
          >
            Reservar ahora
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-12 md:px-8">
        <Card className="border-brand-accent/30 bg-brand-accent/5">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-xl font-bold">Reglas del negocio</h2>
            <ul className="flex flex-col gap-3">
              {reglas.map((regla) => (
                <li key={regla} className="flex gap-3 text-sm text-slate-700">
                  <span className="text-brand-accent">●</span>
                  {regla}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 md:px-8">
        <h2 className="mb-6 text-xl font-bold">Jetskis disponibles</h2>
        {!jetskis || jetskis.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay jetskis disponibles en este momento. Contáctanos por WhatsApp.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {jetskis.map((jetski: Pick<Jetski, "id" | "nombre" | "foto_url" | "precio_hora">) => (
              <Card key={jetski.id} className="overflow-hidden py-0">
                <div className="relative h-44 w-full bg-slate-100">
                  {jetski.foto_url ? (
                    <Image
                      src={jetski.foto_url}
                      alt={jetski.nombre}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      Sin foto
                    </div>
                  )}
                </div>
                <CardContent className="flex flex-col gap-1 pb-6">
                  <h3 className="font-semibold">{jetski.nombre}</h3>
                  <p className="text-brand font-bold">
                    {formatMoneda(jetski.precio_hora)} / hora
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Link
        href="/reservar"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent text-brand-accent-foreground shadow-lg md:hidden"
        aria-label="Reservar ahora"
      >
        🏄
      </Link>

      <footer className="border-t bg-white px-4 py-8 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">{nombreNegocio} — República Dominicana</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}
