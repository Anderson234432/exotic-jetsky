export type EstadoJetski = "disponible" | "en_renta" | "mantenimiento";
export type EstadoRenta = "en_espera" | "confirmada" | "rechazada" | "completada";
export type TipoGasto = "combustible" | "mantenimiento" | "general";

export interface Jetski {
  id: string;
  nombre: string;
  foto_url: string | null;
  precio_compra: number;
  precio_hora: number;
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

export type TipoCuenta = "ahorro" | "corriente";

export interface CuentaBancaria {
  id: string;
  banco: string;
  tipo: TipoCuenta;
  numero: string;
  titular: string;
  orden: number;
  activa: boolean;
  created_at: string;
}

export interface Configuracion {
  id: boolean;
  foto_portada_url: string | null;
  nombre_negocio: string | null;
  subtitulo: string | null;
  whatsapp: string | null;
  reglas: string | null;
  updated_at: string;
}

type Materializar<T> = { [K in keyof T]: T[K] };

type TablaGenerica<Row, Insert> = {
  Row: Materializar<Row>;
  Insert: Materializar<Insert>;
  Update: Materializar<Partial<Row>>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      jetskis: TablaGenerica<
        Jetski,
        Partial<Jetski> & { nombre: string; precio_compra: number; precio_hora: number; anio: number }
      >;
      clientes: TablaGenerica<
        Cliente,
        Partial<Cliente> & { nombre: string; cedula: string; telefono: string }
      >;
      rentas: TablaGenerica<
        Renta,
        Partial<Renta> & { fecha: string; hora_inicio: string; horas_renta: number }
      >;
      gastos: TablaGenerica<Gasto, Partial<Gasto> & { tipo: TipoGasto; monto: number }>;
      mantenimientos: TablaGenerica<
        Mantenimiento,
        Partial<Mantenimiento> & { horas_en_mantenimiento: number }
      >;
      configuracion: TablaGenerica<Configuracion, Partial<Configuracion>>;
      cuentas_bancarias: TablaGenerica<
        CuentaBancaria,
        Partial<CuentaBancaria> & { banco: string; tipo: TipoCuenta; numero: string; titular: string }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      sumar_horas_maquina: {
        Args: { p_jetski_id: string; p_horas: number };
        Returns: undefined;
      };
      restar_horas_maquina: {
        Args: { p_jetski_id: string; p_horas: number };
        Returns: undefined;
      };
    };
  };
}
