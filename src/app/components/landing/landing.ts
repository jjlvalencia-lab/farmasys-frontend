import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingComponent {
  menuAbierto = false;

  caracteristicas = [
    { icono: '📦', titulo: 'Control de inventario', descripcion: 'Gestiona productos, stock, lotes y fechas de vencimiento en tiempo real.' },
    { icono: '🛒', titulo: 'Punto de venta', descripcion: 'Registra ventas rápidamente con múltiples métodos de pago y recibo imprimible.' },
    { icono: '⚠️', titulo: 'Alertas inteligentes', descripcion: 'Recibe avisos automáticos de stock bajo y productos próximos a vencer.' },
    { icono: '📊', titulo: 'Reportes y análisis', descripcion: 'Visualiza ganancias, rotación de productos y exporta reportes en Excel y PDF.' },
    { icono: '🔐', titulo: 'Control de acceso', descripcion: 'Gestiona roles de administrador y empleado con permisos diferenciados.' },
    { icono: '☁️', titulo: 'En la nube', descripcion: 'Accede desde cualquier dispositivo sin instalaciones. Tus datos siempre seguros.' },
  ];

  pasos = [
    { numero: '01', titulo: 'Regístrate', descripcion: 'Crea tu cuenta en minutos y configura tu farmacia con nombre, logo y datos.' },
    { numero: '02', titulo: 'Carga tu inventario', descripcion: 'Importa tus productos desde Excel o agrégalos manualmente con todos sus datos.' },
    { numero: '03', titulo: 'Empieza a vender', descripcion: 'Registra ventas, controla tu stock y genera reportes desde el primer día.' },
  ];

  planes = [
    {
      nombre: 'Básico',
      precio: '$25',
      descripcion: 'Ideal para farmacias pequeñas que inician su digitalización.',
      caracteristicas: ['1 usuario', 'Inventario ilimitado', 'Punto de venta', 'Reportes básicos', 'Soporte por email'],
      destacado: false
    },
    {
      nombre: 'Estándar',
      precio: '$45',
      descripcion: 'El más popular. Todo lo que necesitas para crecer.',
      caracteristicas: ['3 usuarios', 'Inventario ilimitado', 'Punto de venta', 'Reportes avanzados', 'Exportación Excel/PDF', 'Soporte prioritario'],
      destacado: true
    },
    {
      nombre: 'Premium',
      precio: '$80',
      descripcion: 'Para cadenas de farmacias con múltiples sucursales.',
      caracteristicas: ['Usuarios ilimitados', 'Inventario ilimitado', 'Punto de venta', 'Reportes avanzados', 'Exportación Excel/PDF', 'Soporte dedicado 24/7'],
      destacado: false
    },
  ];

  constructor(private router: Router) {}

  irAlLogin() {
    this.router.navigate(['/login']);
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  solicitarPlan(nombrePlan: string) {
    const mensaje = encodeURIComponent(
      `Hola, me interesa el plan *${nombrePlan}* de FarmaSys. ¿Me pueden dar más información?`
    );
    window.open(`https://wa.me/${environment.whatsappNumber}?text=${mensaje}`, '_blank');
  }
}
