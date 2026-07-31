-- Jetskis
create table jetskis (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  foto_url text,
  precio_compra numeric not null,
  precio_hora numeric not null default 0,
  anio integer not null,
  horas_maquina numeric not null default 0,
  horas_mantenimiento_intervalo integer not null default 15,
  horas_ultimo_mantenimiento numeric not null default 0,
  estado text not null default 'disponible' check (estado in ('disponible','en_renta','mantenimiento')),
  created_at timestamptz default now()
);

-- Clientes
create table clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cedula text not null,
  telefono text not null,
  created_at timestamptz default now()
);

-- Rentas
create table rentas (
  id uuid primary key default gen_random_uuid(),
  jetski_id uuid references jetskis(id),
  cliente_id uuid references clientes(id),
  fecha date not null,
  hora_inicio time not null,
  horas_renta numeric not null,
  estado text not null default 'en_espera' check (estado in ('en_espera','confirmada','rechazada','completada')),
  adelanto_foto_url text,
  deposito_monto numeric default 0,
  deposito_devuelto boolean default false,
  foto_antes_url text,
  foto_despues_url text,
  operador text,
  notas text,
  reglas_aceptadas boolean not null default false,
  created_at timestamptz default now()
);

-- Gastos
create table gastos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('combustible','mantenimiento','general')),
  monto numeric not null,
  descripcion text,
  fecha date not null default current_date,
  created_at timestamptz default now()
);

-- Mantenimientos
create table mantenimientos (
  id uuid primary key default gen_random_uuid(),
  jetski_id uuid references jetskis(id),
  fecha date not null default current_date,
  descripcion text,
  costo numeric default 0,
  horas_en_mantenimiento numeric not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table jetskis enable row level security;
alter table clientes enable row level security;
alter table rentas enable row level security;
alter table gastos enable row level security;
alter table mantenimientos enable row level security;

-- Jetskis: lectura pública, escritura solo admin
create policy "jetskis_select" on jetskis for select using (true);
create policy "jetskis_insert" on jetskis for insert with check (auth.role() = 'authenticated');
create policy "jetskis_update" on jetskis for update using (auth.role() = 'authenticated');
create policy "jetskis_delete" on jetskis for delete using (auth.role() = 'authenticated');

-- Rentas: lectura pública, insert público, update solo admin
create policy "rentas_select" on rentas for select using (true);
create policy "rentas_insert" on rentas for insert with check (true);
create policy "rentas_update" on rentas for update using (auth.role() = 'authenticated');
create policy "rentas_delete" on rentas for delete using (auth.role() = 'authenticated');

-- Clientes: insert público (necesario para el formulario de reserva), resto solo admin
create policy "clientes_insert" on clientes for insert with check (true);
create policy "clientes_select" on clientes for select using (auth.role() = 'authenticated');
create policy "clientes_update" on clientes for update using (auth.role() = 'authenticated');
create policy "clientes_delete" on clientes for delete using (auth.role() = 'authenticated');

-- Gastos: solo admin
create policy "gastos_all" on gastos for all using (auth.role() = 'authenticated');

-- Mantenimientos: solo admin
create policy "mantenimientos_all" on mantenimientos for all using (auth.role() = 'authenticated');

-- Realtime: permite suscribirse a cambios en rentas (usado en /reserva/[id])
alter publication supabase_realtime add table rentas;

-- Storage: bucket "exotic-jetsky" — el toggle "Public" del bucket solo habilita
-- lectura pública; el insert (subida de fotos) sigue bloqueado por RLS sin estas
-- políticas. Insert acotado por carpeta: "adelantos/" es público (el cliente
-- sube el comprobante sin sesión), "jetskis/" y "rentas/" solo admin.
drop policy if exists "exotic_jetsky_insert" on storage.objects;
drop policy if exists "exotic_jetsky_select" on storage.objects;
drop policy if exists "exotic_jetsky_insert_publico" on storage.objects;
drop policy if exists "exotic_jetsky_insert_admin" on storage.objects;

create policy "exotic_jetsky_select" on storage.objects
  for select using (bucket_id = 'exotic-jetsky');

create policy "exotic_jetsky_insert_publico" on storage.objects
  for insert
  with check (bucket_id = 'exotic-jetsky' and (storage.foldername(name))[1] = 'adelantos');

create policy "exotic_jetsky_insert_admin" on storage.objects
  for insert
  with check (
    bucket_id = 'exotic-jetsky'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in ('jetskis', 'rentas')
  );

-- ═══════════════════════════════════════════════════════════════
-- AUDITORÍA DE SEGURIDAD — ejecutar después de lo anterior
-- ═══════════════════════════════════════════════════════════════

-- 1) Límites en el bucket: evita abuso (archivos gigantes o no-imagen)
update storage.buckets
set file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'exotic-jetsky';

-- 2) rentas_select es "using (true)" porque /reserva/[id] es una página pública
-- sin login que rastrea UNA reserva por su UUID (impredecible). El problema:
-- eso también permite a cualquiera con la anon key hacer
-- GET /rest/v1/rentas?select=* y descargar TODAS las reservas (fotos de
-- comprobantes, depósitos, notas). La fila sigue siendo legible por diseño,
-- pero restringimos qué COLUMNAS puede leer el rol "anon" (los admins,
-- rol "authenticated", no se ven afectados — siguen viendo todo).
revoke select on rentas from anon;
grant select (id, jetski_id, estado, fecha, hora_inicio) on rentas to anon;

-- 3) Mismo problema en jetskis: precio_compra (costo real del jetski) y las
-- horas de máquina son datos internos del negocio, no deberían ser públicos.
revoke select on jetskis from anon;
grant select (id, nombre, foto_url, precio_hora, estado) on jetskis to anon;

-- 4) Cotas server-side (el HTML min/max se puede saltar con una llamada
-- directa a la API). Sin esto, cualquiera puede mandar horas_renta = -50000
-- o 999999999 vía POST directo a /rest/v1/rentas.
alter table rentas add constraint horas_renta_rango check (horas_renta > 0 and horas_renta <= 24);
alter table clientes add constraint nombre_longitud check (char_length(nombre) <= 100);
alter table clientes add constraint cedula_longitud check (char_length(cedula) <= 20);
alter table clientes add constraint telefono_longitud check (char_length(telefono) <= 20);

-- 5) Suma atómica de horas_maquina al completar una renta (antes era
-- leer-en-JS-y-escribir, con condición de carrera si dos admins completan
-- rentas del mismo jetski al mismo tiempo). SECURITY INVOKER (default): se
-- ejecuta con los permisos del que llama, así que la policy jetskis_update
-- (solo authenticated) se sigue respetando igual que antes.
create or replace function sumar_horas_maquina(p_jetski_id uuid, p_horas numeric)
returns void
language sql
as $$
  update jetskis set horas_maquina = horas_maquina + p_horas where id = p_jetski_id;
$$;

grant execute on function sumar_horas_maquina(uuid, numeric) to authenticated;

-- ═══════════════════════════════════════════════════════════════
-- CONFIGURACIÓN DEL SITIO — foto de portada, nombre, whatsapp, reglas
-- editables desde /admin/configuracion. Re-ejecutable.
-- ═══════════════════════════════════════════════════════════════

-- id boolean + check(id) garantiza que solo pueda existir UNA fila.
create table if not exists configuracion (
  id boolean primary key default true,
  foto_portada_url text,
  nombre_negocio text,
  whatsapp text,
  reglas text,
  updated_at timestamptz default now(),
  constraint configuracion_una_fila check (id)
);

alter table configuracion add column if not exists subtitulo text;

alter table configuracion enable row level security;

drop policy if exists "configuracion_select" on configuracion;
drop policy if exists "configuracion_update" on configuracion;

create policy "configuracion_select" on configuracion for select using (true);
create policy "configuracion_update" on configuracion for update using (auth.role() = 'authenticated');

grant select on configuracion to anon, authenticated;
grant update on configuracion to authenticated;

-- Fila única con los valores actuales como default (no cambia nada visible
-- hasta que el admin suba una foto o edite algo desde el panel).
insert into configuracion (id, nombre_negocio, subtitulo, reglas)
values (
  true,
  'Exotic Jetsky',
  'Renta jetskis de lujo en las mejores playas de República Dominicana.',
  'El cliente es responsable de cualquier daño ocasionado al jetski durante la renta.
Se requiere un adelanto para confirmar la reserva.
Cancelaciones con menos de 24 horas de anticipación no tienen reembolso.
Se debe presentar cédula de identidad al momento de la renta.'
)
on conflict (id) do nothing;

-- Rellena el subtítulo con el texto actual para filas ya existentes
-- (creadas antes de que existiera la columna) que aún no tengan uno.
update configuracion
set subtitulo = 'Renta jetskis de lujo en las mejores playas de República Dominicana.'
where subtitulo is null;

-- Storage: agrega la carpeta "configuracion/" a las permitidas para admin
-- (foto de portada). Reemplaza la política anterior que solo tenía
-- 'jetskis' y 'rentas'.
drop policy if exists "exotic_jetsky_insert_admin" on storage.objects;
create policy "exotic_jetsky_insert_admin" on storage.objects
  for insert
  with check (
    bucket_id = 'exotic-jetsky'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in ('jetskis', 'rentas', 'configuracion')
  );

-- ═══════════════════════════════════════════════════════════════
-- ELIMINAR RENTAS — /admin/rentas. Re-ejecutable.
-- ═══════════════════════════════════════════════════════════════

-- No existía política de DELETE en storage.objects: el insert/select/update
-- estaban cubiertos pero borrar fotos (adelanto, antes, después) fallaba
-- silenciosamente. Sin restricción de carpeta porque el admin necesita
-- borrar de cualquiera ('adelantos', 'rentas', 'jetskis', 'configuracion').
drop policy if exists "exotic_jetsky_delete_admin" on storage.objects;
create policy "exotic_jetsky_delete_admin" on storage.objects
  for delete
  using (bucket_id = 'exotic-jetsky' and auth.role() = 'authenticated');

-- Inverso de sumar_horas_maquina, para cuando se elimina una renta
-- "completada" y hay que revertir las horas que ya había sumado a la
-- máquina del jetski. Misma suma atómica en la base de datos (nada de
-- leer horas_maquina en JS y restar ahí — condición de carrera si dos
-- admins operan el mismo jetski a la vez). greatest(0, ...) evita que
-- quede en negativo si algo ya se ajustó manualmente entretanto.
create or replace function restar_horas_maquina(p_jetski_id uuid, p_horas numeric)
returns void
language sql
as $$
  update jetskis
  set horas_maquina = greatest(0, horas_maquina - p_horas)
  where id = p_jetski_id;
$$;

grant execute on function restar_horas_maquina(uuid, numeric) to authenticated;

-- clientes_delete y rentas_delete ya existían (ver arriba) — verificado,
-- no hace falta agregarlas.
