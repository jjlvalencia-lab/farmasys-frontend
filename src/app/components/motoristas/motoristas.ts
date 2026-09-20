import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-motoristas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './motoristas.html',
  styleUrls: ['./motoristas.css']
})
export class MotoristasComponent implements OnInit {
  motoristas: any[] = [];
  pedidosEnCamino: any[] = [];
  mostrarFormulario = false;
  editando = false;
  motoristaActual: any = this.nuevoMotorista();
  mostrarModalAsignar = false;
  pedidoSeleccionado: any = null;
  motoristaSeleccionadoId: number | null = null;
  esAdmin = localStorage.getItem('rol') === 'admin';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get headers() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  nuevoMotorista() {
    return { nombre: '', placa: '', modeloVehiculo: '' };
  }

  ngOnInit() {
    this.cargarMotoristas();
    this.cargarPedidosParaDespacho();
  }

  cargarMotoristas() {
    this.http.get<any[]>(`${environment.apiUrl}/motoristas`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.motoristas = data;
        this.cdr.detectChanges();
      }
    });
  }

  cargarPedidosParaDespacho() {
    this.http.get<any[]>(`${environment.apiUrl}/pedidos`, { headers: this.headers }).subscribe({
      next: (data) => {
        this.pedidosEnCamino = data.filter(p =>
          p.estado === 'pago_recibido' || p.estado === 'en_preparacion'
        );
        this.cdr.detectChanges();
      }
    });
  }

  abrirFormulario() {
    this.motoristaActual = this.nuevoMotorista();
    this.editando = false;
    this.mostrarFormulario = true;
  }

  editar(motorista: any) {
    this.motoristaActual = { ...motorista };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  guardar() {
    if (!this.motoristaActual.nombre.trim() ||
        !this.motoristaActual.placa.trim() ||
        !this.motoristaActual.modeloVehiculo.trim()) {
      alert('Todos los campos son requeridos');
      return;
    }

    if (this.editando) {
      this.http.put(
        `${environment.apiUrl}/motoristas/${this.motoristaActual.id}`,
        this.motoristaActual, { headers: this.headers }
      ).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.cargarMotoristas();
        }
      });
    } else {
      this.http.post(
        `${environment.apiUrl}/motoristas`,
        this.motoristaActual, { headers: this.headers }
      ).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.cargarMotoristas();
        }
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar este motorista?')) {
      this.http.delete(`${environment.apiUrl}/motoristas/${id}`, { headers: this.headers }).subscribe({
        next: () => this.cargarMotoristas()
      });
    }
  }

  abrirModalAsignar(pedido: any) {
    this.pedidoSeleccionado = pedido;
    this.motoristaSeleccionadoId = null;
    this.mostrarModalAsignar = true;
  }

  asignarMotorista() {
    if (!this.motoristaSeleccionadoId) {
      alert('Selecciona un motorista');
      return;
    }
    this.http.post(
      `${environment.apiUrl}/motoristas/${this.motoristaSeleccionadoId}/asignar/${this.pedidoSeleccionado.id}`,
      {}, { headers: this.headers }
    ).subscribe({
      next: (pedido: any) => {
        const motorista = this.motoristas.find(m => m.id === this.motoristaSeleccionadoId);
        this.notificarClienteWhatsApp(pedido, motorista);
        this.mostrarModalAsignar = false;
        this.cargarPedidosParaDespacho();
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error: ' + (err.error?.message || 'No se pudo asignar'))
    });
  }

  notificarClienteWhatsApp(pedido: any, motorista: any) {
    const mensaje = encodeURIComponent(
      `Hola ${pedido.clienteNombre} 👋\n\n` +
      `Tu pedido #${pedido.id} de FarmaSys está *en camino* 🚴\n\n` +
      `📋 *Datos del motorista:*\n` +
      `👤 Nombre: ${motorista.nombre}\n` +
      `🏍️ Vehículo: ${motorista.modeloVehiculo}\n` +
      `🔖 Placa: ${motorista.placa}\n\n` +
      `¡Gracias por tu compra! 🏥`
    );
    const telefono = pedido.clienteTelefono.startsWith('0')
      ? `593${pedido.clienteTelefono.slice(1)}`
      : pedido.clienteTelefono;
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  }

  volver() { this.router.navigate(['/pedidos']); }
}
