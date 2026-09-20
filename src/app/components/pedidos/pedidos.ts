import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css']
})
export class PedidosComponent implements OnInit {
  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  productos: any[] = [];
  vistaActual: string = 'lista';
  filtroEstado: string = 'todos';
  cargando = false;

  // Nuevo pedido
  clienteNombre = '';
  clienteTelefono = '';
  clienteDireccion = '';
  clienteReferencia = '';
  observacion = '';
  cajero = localStorage.getItem('username') || '';
  carrito: any[] = [];
  busquedaProducto = '';
  productosFiltrados: any[] = [];

  // Confirmar pago
  mostrarModalPago = false;
  pedidoSeleccionado: any = null;
  metodoPago = 'transferencia';
  referenciaPago = '';
  bancoPago = '';
  capturaPago = '';

  bancos = ['Banco Pichincha', 'Banco Guayaquil', 'Banco Pacífico', 'Produbanco', 'Banco del Austro', 'Otro'];

  estados = [
    { valor: 'todos', etiqueta: 'Todos', color: '' },
    { valor: 'pendiente_pago', etiqueta: '🟡 Pendiente de pago', color: 'amarillo' },
    { valor: 'pago_recibido', etiqueta: '🔵 Pago recibido', color: 'azul' },
    { valor: 'en_preparacion', etiqueta: '🟠 En preparación', color: 'naranja' },
    { valor: 'en_camino', etiqueta: '🚴 En camino', color: 'verde' },
    { valor: 'entregado', etiqueta: '✅ Entregado', color: 'verde-oscuro' },
    { valor: 'cancelado', etiqueta: '❌ Cancelado', color: 'rojo' },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarPedidos();
    this.cargarProductos();
  }

  get headers() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  cargarPedidos() {
    this.http.get<any[]>(`${environment.apiUrl}/pedidos`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.pedidos = data;
        this.filtrar();
        this.cdr.detectChanges();
      }
    });
  }

  cargarProductos() {
    this.http.get<any[]>(`${environment.apiUrl}/productos`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.productos = data.filter(p => p.stock > 0);
        this.productosFiltrados = [...this.productos];
        this.cdr.detectChanges();
      }
    });
  }

  filtrar() {
    if (this.filtroEstado === 'todos') {
      this.pedidosFiltrados = [...this.pedidos];
    } else {
      this.pedidosFiltrados = this.pedidos.filter(p => p.estado === this.filtroEstado);
    }
    this.cdr.detectChanges();
  }

  buscarProducto() {
    const texto = this.busquedaProducto.toLowerCase().trim();
    this.productosFiltrados = texto
      ? this.productos.filter(p => p.nombre.toLowerCase().includes(texto))
      : [...this.productos];
    this.cdr.detectChanges();
  }

  agregarAlCarrito(producto: any) {
    const existente = this.carrito.find(c => c.productoId === producto.id);
    if (existente) {
      if (existente.cantidad < producto.stock) existente.cantidad++;
      existente.subtotal = +(existente.cantidad * existente.precioUnitario).toFixed(2);
    } else {
      this.carrito.push({
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad: 1,
        precioUnitario: parseFloat(producto.precio),
        subtotal: parseFloat(producto.precio),
        stockMax: producto.stock
      });
    }
    this.cdr.detectChanges();
  }

  cambiarCantidad(item: any, cantidad: number) {
    if (cantidad <= 0) {
      this.carrito = this.carrito.filter(c => c.productoId !== item.productoId);
    } else if (cantidad <= item.stockMax) {
      item.cantidad = cantidad;
      item.subtotal = +(cantidad * item.precioUnitario).toFixed(2);
    }
    this.cdr.detectChanges();
  }

  get totalPedido(): number {
    return +this.carrito.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2);
  }

  guardarPedido() {
    if (!this.clienteNombre.trim() || !this.clienteTelefono.trim()) {
      alert('El nombre y teléfono del cliente son requeridos');
      return;
    }
    if (this.carrito.length === 0) {
      alert('Agrega al menos un producto al pedido');
      return;
    }

    const dto = {
      clienteNombre: this.clienteNombre,
      clienteTelefono: this.clienteTelefono,
      clienteDireccion: this.clienteDireccion,
      clienteReferencia: this.clienteReferencia,
      observacion: this.observacion,
      cajero: this.cajero,
      total: this.totalPedido,
      detalles: this.carrito.map(i => ({
        productoId: i.productoId,
        nombreProducto: i.nombreProducto,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        subtotal: i.subtotal
      }))
    };

    this.cargando = true;
    this.http.post<any>(`${environment.apiUrl}/pedidos`, dto, { headers: this.headers }).subscribe({
      next: (pedido) => {
        this.cargando = false;
        this.enviarWhatsApp(pedido);
        this.limpiarFormulario();
        this.cargarPedidos();
        this.vistaActual = 'lista';
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        alert('Error al guardar el pedido');
      }
    });
  }

  enviarWhatsApp(pedido: any) {
    const detalles = pedido.detalles.map((d: any) =>
      `- ${d.nombreProducto} x${d.cantidad} = $${d.subtotal}`
    ).join('\n');

    const mensaje = encodeURIComponent(
      `Hola ${pedido.clienteNombre}, gracias por tu pedido en FarmaSys 🏥\n\n` +
      `📋 *Pedido #${pedido.id}*\n${detalles}\n\n` +
      `💰 *Total: $${pedido.total}*\n\n` +
      `Por favor realiza tu pago por transferencia y envíanos el comprobante para procesar tu pedido. 🙏`
    );

    window.open(`https://wa.me/${pedido.clienteTelefono}?text=${mensaje}`, '_blank');
  }

  contactarCliente(pedido: any) {
    const mensaje = encodeURIComponent(
      `Hola ${pedido.clienteNombre}, te contactamos de FarmaSys 🏥 respecto a tu pedido #${pedido.id}.`
    );
    window.open(`https://wa.me/593${pedido.clienteTelefono.replace(/^0/, '')}?text=${mensaje}`, '_blank');
  }

  abrirModalPago(pedido: any) {
    this.pedidoSeleccionado = pedido;
    this.metodoPago = 'transferencia';
    this.referenciaPago = '';
    this.bancoPago = '';
    this.capturaPago = '';
    this.mostrarModalPago = true;
  }

  onCapturaSeleccionada(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.capturaPago = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(archivo);
  }

  confirmarPago() {
    if (!this.bancoPago) {
      alert('Selecciona el banco');
      return;
    }
    const dto = {
      metodoPago: this.metodoPago,
      referenciaPago: this.referenciaPago,
      bancoPago: this.bancoPago,
      capturaPago: this.capturaPago
    };
    this.http.put(`${environment.apiUrl}/pedidos/${this.pedidoSeleccionado.id}/confirmar-pago`,
      dto, { headers: this.headers }).subscribe({
      next: () => {
        this.mostrarModalPago = false;
        this.cargarPedidos();
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error: ' + (err.error?.message || 'No se pudo confirmar'))
    });
  }

  cambiarEstado(pedido: any, estado: string) {
    this.http.put(`${environment.apiUrl}/pedidos/${pedido.id}/estado`,
      { estado }, { headers: this.headers }).subscribe({
      next: () => {
        this.cargarPedidos();
        this.cdr.detectChanges();
      }
    });
  }

  getEtiquetaEstado(estado: string): string {
    const e = this.estados.find(x => x.valor === estado);
    return e ? e.etiqueta : estado;
  }

  limpiarFormulario() {
    this.clienteNombre = '';
    this.clienteTelefono = '';
    this.clienteDireccion = '';
    this.clienteReferencia = '';
    this.observacion = '';
    this.carrito = [];
    this.busquedaProducto = '';
    this.productosFiltrados = [...this.productos];
  }

  volver() { this.router.navigate(['/dashboard']); }

  irMotoristas() { this.router.navigate(['/motoristas']); }
}
