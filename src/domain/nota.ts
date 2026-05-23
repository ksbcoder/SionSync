export interface Nota {
  id: string;
  seccion_id: string;
  orden: number;
  contenido: string;
  created_at: string;
}

export interface NotaInsert {
  seccion_id: string;
  orden: number;
  contenido: string;
}
