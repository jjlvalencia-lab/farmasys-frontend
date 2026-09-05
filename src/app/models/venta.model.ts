export interface DetalleVenta {
  id?: number;
  productoId: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id?: number;
  fecha?: string;
  total: number;
  metodoPago: string;
  entidadFinanciera?: string;
  tipoTarjeta?: string;
  recargoPago?: number;
  referencia?: string;
  observacion?: string;
  tipoCliente: string;
  clienteNombre?: string;
  clienteCedula?: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  cajero?: string;
  detalles: DetalleVenta[];
}

export interface CierreData {
  fecha: string;
  totalVentas: string;
  cantidadVentas: number;
  totalEfectivo: string;
  totalTarjeta: string;
  totalTransferencia: string;
  totalQr: string;
  gananciaEstimada: string;
}
