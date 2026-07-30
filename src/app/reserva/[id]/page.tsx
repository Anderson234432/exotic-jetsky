import { ReservaEstado } from "@/components/public/reserva-estado";

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReservaEstado id={id} />;
}
