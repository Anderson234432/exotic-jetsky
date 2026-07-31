"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EstadoRentaBadge } from "@/components/admin/badges";
import { formatFecha, formatHora12h, formatMoneda } from "@/lib/format";
import type { Cliente, Jetski, Renta } from "@/lib/types";

type RentaConJetski = Renta & { jetski: Jetski | null };

export default function AdminClientesPage() {
  const supabase = createClient();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rentas, setRentas] = useState<RentaConJetski[]>([]);
  const [cargando, setCargando] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("clientes").select("*").order("nombre"),
      supabase
        .from("rentas")
        .select("*, jetski:jetskis(*)")
        .order("fecha", { ascending: false })
        .returns<RentaConJetski[]>(),
    ]).then(([{ data: c }, { data: r }]) => {
      setClientes(c ?? []);
      setRentas(r ?? []);
      setCargando(false);
    });
  }, [supabase]);

  function rentasDe(clienteId: string) {
    return rentas.filter((r) => r.cliente_id === clienteId);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Clientes</h1>

      {cargando ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : clientes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay clientes registrados.</p>
      ) : (
        <>
          {/* Desktop */}
          <Card className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Total de rentas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c) => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setClienteSeleccionado(c)}
                    >
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell>{c.cedula}</TableCell>
                      <TableCell>{c.telefono}</TableCell>
                      <TableCell>{rentasDe(c.id).length}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile */}
          <div className="flex flex-col gap-4 md:hidden">
            {clientes.map((c) => (
              <Card key={c.id} onClick={() => setClienteSeleccionado(c)}>
                <CardContent className="flex flex-col gap-1 pt-6">
                  <p className="font-semibold">{c.nombre}</p>
                  <p className="text-sm text-muted-foreground">{c.cedula}</p>
                  <p className="text-sm text-muted-foreground">{c.telefono}</p>
                  <p className="text-sm font-medium text-ej-turquesa-tx">
                    {rentasDe(c.id).length} renta(s)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={!!clienteSeleccionado}
        onOpenChange={(open) => !open && setClienteSeleccionado(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{clienteSeleccionado?.nombre}</DialogTitle>
          </DialogHeader>
          {clienteSeleccionado && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Cédula: {clienteSeleccionado.cedula} · Tel: {clienteSeleccionado.telefono}
              </p>
              <div className="max-h-96 overflow-y-auto">
                {rentasDe(clienteSeleccionado.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin rentas registradas.</p>
                ) : (
                  <ul className="flex flex-col divide-y">
                    {rentasDe(clienteSeleccionado.id).map((r) => (
                      <li key={r.id} className="flex flex-col gap-1 py-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{r.jetski?.nombre}</span>
                          <EstadoRentaBadge estado={r.estado} />
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>
                            {formatFecha(r.fecha)} — {formatHora12h(r.hora_inicio)} (
                            {r.horas_renta}h)
                          </span>
                          <span>{formatMoneda((r.jetski?.precio_hora ?? 0) * r.horas_renta)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
