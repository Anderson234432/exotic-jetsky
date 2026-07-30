export type EstadoJetski = "disponible" | "en_renta" | "mantenimiento";
export type EstadoRenta = "en_espera" | "confirmada" | "rechazada" | "completada";
export type TipoGasto = "combustible" | "mantenimiento" | "general";

export interface Jetski {
  id: string;
  nombre: string;
  foto_url: string | null;
  precio_compra: number;
  anio: number;
  horas_maquina: number;
  horas_mantenimiento_intervalo: number;
  horas_ultimo_mantenimiento: number;
  estado: EstadoJetski;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  created_at: string;
}

export interface Renta {
  id: string;
  jetski_id: string | null;
  cliente_id: string | null;
  fecha: string;
  hora_inicio: string;
  horas_renta: number;
  estado: EstadoRenta;
  adelanto_foto_url: string | null;
  deposito_monto: number;
  deposito_devuelto: boolean;
  foto_antes_url: string | null;
  foto_despues_url: string | null;
  operador: string | null;
  notas: string | null;
  reglas_aceptadas: boolean;
  created_at: string;
}

export interface Gasto {
  id: string;
  tipo: TipoGasto;
  monto: number;
  descripcion: string | null;
  fecha: string;
  created_at: string;
}

export interface Mantenimiento {
  id: string;
  jetski_id: string | null;
  fecha: string;
  descripcion: string | null;
  costo: number;
  horas_en_mantenimiento: number;
  created_at: string;
}

export interface RentaConRelaciones extends Renta {
  jetski: Jetski | null;
  cliente: Cliente | null;
}

export interface Database {
  public: {
    Tables: {
      jetskis: {
        Row: Jetski;
        Insert: Partial<Jetski> & { nombre: string; precio_compra: number; anio: number };
        Update: Partial<Jetski>;
      };
      clientes: {
        Row: Cliente;
        Insert: Partial<Cliente> & { nombre: string; cedula: string; telefono: string };
        Update: Partial<Cliente>;
      };
      rentas: {
        Row: Renta;
        Insert: Partial<Renta> & {
          fecha: string;
          hora_inicio: string;
          horas_renta: number;
        };
        Update: Partial<Renta>;
      };
      gastos: {
        Row: Gasto;
        Insert: Partial<Gasto> & { tipo: TipoGasto; monto: number };
        Update: Partial<Gasto>;
      };
      mantenimientos: {
        Row: Mantenimiento;
        Insert: Partial<Mantenimiento> & { horas_en_mantenimiento: number };
        Update: Partial<Mantenimiento>;
      };
    };
  };
}
