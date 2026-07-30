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
