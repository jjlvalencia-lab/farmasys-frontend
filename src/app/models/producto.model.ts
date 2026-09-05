export interface Producto {
  id: number;
  nombre: string;
  precio: number;
  precioCosto: number;
  precioCaja: number;
  unidadesPorCaja: number;
  lote: string;
  fechaElaboracion: string;
  fechaIngreso: string;
  fechaCaducidad: string;
  stock: number;
  stockMinimo: number;
  stockMaximo: number;
  imagen: string;
  categoria: string;
  enPromocion: boolean;
  descuento: number;
  promocionInicio: string;
  promocionFin: string;
}
