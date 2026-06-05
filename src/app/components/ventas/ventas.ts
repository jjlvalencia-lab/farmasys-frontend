import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ventas.html',
  styleUrls: ['./ventas.css']
})
export class VentasComponent implements OnInit {
  productos: any[] = [];
  carrito: any[] = [];
  busquedaProducto: string = '';
  productosFiltrados: any[] = [];
  metodoPago: string = 'efectivo';
  entidadFinanciera: string = '';
  tipoTarjeta: string = 'debito';
  recargoPago: number = 0;
  referencia: string = '';
  observacion: string = '';
  efectivoRecibido: number = 0;
  mostrarRecibo: string = 'none';
  ventaActual: any = null;
  historialVentas: any[] = [];
  vistaActual: string = 'nueva';
  tipoCliente: string = 'consumidor_final';
  clienteNombre: string = '';
  clienteCedula: string = '';
  clienteTelefono: string = '';
  clienteDireccion: string = '';
  cajero: string = localStorage.getItem('username') || '';
  mostrarSelectorCajero: boolean = false;

  // Historial por fecha
  fechaHistorial: string = new Date().toISOString().split('T')[0];
  ventasPorFecha: any[] = [];
  fechaBuscada: boolean = false;

  // Cierre de caja
  mostrarCierre: boolean = false;
  fechaCierre: string = new Date().toISOString().split('T')[0];
  cierreData: any = null;
  efectivoCajero: number = 0;

  metodosPago = [
    { valor: 'efectivo', etiqueta: '💵 Efectivo' },
    { valor: 'tarjeta', etiqueta: '💳 Tarjeta' },
    { valor: 'transferencia', etiqueta: '🏦 Transferencia' },
    { valor: 'qr', etiqueta: '📱 QR' },
  ];

  entidadesFinancieras = ['Visa', 'Mastercard', 'American Express', 'Banco Pichincha', 'Banco Guayaquil', 'Banco Pacifico', 'Produbanco', 'Deuna', 'PayPhone', 'Otro'];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCarritoGuardado();
    this.cargarProductos();
  }

  cargarCarritoGuardado() {
    const carritoGuardado = localStorage.getItem('carrito_farmasys');
    if (carritoGuardado) {
      this.carrito = JSON.parse(carritoGuardado);
    }
  }

  guardarCarrito() {
    localStorage.setItem('carrito_farmasys', JSON.stringify(this.carrito));
  }

  cargarProductos() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any[]>(`http://localhost:3000/productos?t=${Date.now()}`, { headers }).subscribe({
      next: (data) => {
        this.productos = data.filter(p => p.stock > 0);
        this.productosFiltrados = [...this.productos];
        this.cdr.detectChanges();
      }
    });
  }

  buscarProducto() {
    const texto = this.busquedaProducto.toLowerCase().trim();
    if (!texto) {
      this.productosFiltrados = [...this.productos];
    } else {
      this.productosFiltrados = this.productos.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto)
      );
    }
    this.cdr.detectChanges();
  }

  agregarAlCarrito(producto: any, tipo: string = 'unidad') {
    const key = `${producto.id}_${tipo}`;
    const existente = this.carrito.find(c => c.key === key);
    const precio = tipo === 'caja' ? parseFloat(producto.precioCaja) : parseFloat(producto.precio);
    const unidades = tipo === 'caja' ? producto.unidadesPorCaja : 1;

    if (existente) {
      const totalUnidades = (existente.cantidad + 1) * unidades;
      if (totalUnidades > producto.stock) {
        alert(`Stock insuficiente`);
        return;
      }
      existente.cantidad++;
      existente.subtotal = existente.cantidad * precio;
    } else {
      this.carrito.push({
        key,
        productoId: producto.id,
        nombreProducto: `${producto.nombre}${tipo === 'caja' ? ' (Caja)' : ''}`,
        tipo,
        unidadesPorCaja: unidades,
        cantidad: 1,
        precioUnitario: precio,
        subtotal: precio,
        stockDisponible: Math.floor(producto.stock / unidades)
      });
    }
    this.guardarCarrito();
    this.cdr.detectChanges();
  }

  cambiarCantidad(item: any, cantidad: number) {
    if (cantidad <= 0) {
      this.eliminarDelCarrito(item);
      return;
    }
    if (cantidad > item.stockDisponible) {
      alert(`Stock maximo: ${item.stockDisponible}`);
      return;
    }
    item.cantidad = cantidad;
    item.subtotal = cantidad * item.precioUnitario;
    this.guardarCarrito();
    this.cdr.detectChanges();
  }

  eliminarDelCarrito(item: any) {
    this.carrito = this.carrito.filter(c => c.key !== item.key);
    this.guardarCarrito();
    this.cdr.detectChanges();
  }

  get total(): number {
    const subtotal = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
    return subtotal + (this.recargoPago || 0);
  }

  get cambio(): number {
    return this.efectivoRecibido - this.total;
  }

  procesarVenta() {
    if (!this.cajero.trim()) {
      this.mostrarSelectorCajero = true;
      return;
    }
    if (this.carrito.length === 0) {
      alert('Agrega productos al carrito primero');
      return;
    }
    if (this.metodoPago === 'efectivo' && this.efectivoRecibido < this.total) {
      alert('El efectivo recibido es menor al total');
      return;
    }
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    const detalles = this.carrito.map(item => ({
      productoId: item.productoId,
      nombreProducto: item.nombreProducto,
      cantidad: item.tipo === 'caja' ? item.cantidad * item.unidadesPorCaja : item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.subtotal
    }));
    const venta = {
      total: this.total, metodoPago: this.metodoPago,
      entidadFinanciera: this.entidadFinanciera, tipoTarjeta: this.tipoTarjeta,
      recargoPago: this.recargoPago, referencia: this.referencia,
      observacion: this.observacion, tipoCliente: this.tipoCliente,
      clienteNombre: this.clienteNombre, clienteCedula: this.clienteCedula,
      clienteTelefono: this.clienteTelefono, clienteDireccion: this.clienteDireccion,
      cajero: this.cajero, detalles
    };
    this.http.post('http://localhost:3000/ventas', venta, { headers }).subscribe({
      next: (res: any) => {
        this.ventaActual = {
          ...res,
          efectivoRecibido: this.efectivoRecibido,
          cambio: this.cambio,
          metodoPagoEtiqueta: this.metodosPago.find(m => m.valor === this.metodoPago)?.etiqueta
        };
        this.mostrarRecibo = 'block';
        this.carrito = [];
        localStorage.removeItem('carrito_farmasys');
        this.referencia = ''; this.observacion = '';
        this.efectivoRecibido = 0; this.entidadFinanciera = '';
        this.recargoPago = 0; this.clienteNombre = '';
        this.clienteCedula = ''; this.clienteTelefono = '';
        this.clienteDireccion = ''; this.tipoCliente = 'consumidor_final';
        this.cargarProductos();
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error al procesar la venta: ' + err.error?.message)
    });
  }

  buscarVentasPorFecha() {
    if (!this.fechaHistorial) return;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any[]>(`http://localhost:3000/ventas/fecha?fecha=${this.fechaHistorial}`, { headers }).subscribe({
      next: (data) => {
        this.ventasPorFecha = data;
        this.fechaBuscada = true;
        this.cdr.detectChanges();
      }
    });
  }

  cargarCierre() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`http://localhost:3000/ventas/cierre?fecha=${this.fechaCierre}`, { headers }).subscribe({
      next: (data) => {
        this.cierreData = data;
        this.cdr.detectChanges();
      }
    });
  }

  get diferenciaCaja(): number {
    if (!this.cierreData) return 0;
    return this.efectivoCajero - parseFloat(this.cierreData.totalEfectivo);
  }

  cerrarRecibo() { this.mostrarRecibo = 'none'; this.ventaActual = null; }
  imprimirRecibo() { window.print(); }
  volver() { this.router.navigate(['/dashboard']); }

  getTotalVentas(sum: number, v: any): number {
  return sum + parseFloat(v.total);
 }
}
