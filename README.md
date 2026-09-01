# FarmaSys — Frontend

Aplicación web desarrollada con **Angular** para el sistema de gestión de inventario FarmaSys.

## 🛠️ Tecnologías

- Angular 17+
- TypeScript
- Chart.js / ng2-charts
- XLSX (exportación Excel)
- jsPDF (exportación PDF)

## ⚙️ Requisitos previos

- Node.js v18+
- Angular CLI
- npm

## 🚀 Instalación

1. Clona el repositorio:
```bash
   git clone https://github.com/jjlvalencia-lab/farmasys-frontend.git
   cd farmasys-frontend
```

2. Instala dependencias:
```bash
   npm install
```

3. Inicia la aplicación:
```bash
   ng serve
```

La aplicación corre en `http://localhost:4200`

> ⚠️ Asegúrate de tener el backend corriendo en `http://localhost:3000`

## 📱 Módulos del sistema

### 🔐 Login
- Autenticación con JWT
- Fondo animado con gradiente
- Efecto shake en credenciales incorrectas
- Mostrar/ocultar contraseña

### 📊 Dashboard
- Tarjetas resumen del inventario
- Gráfica compacta de ventas últimos 7 días
- Análisis de inventario (inversión, ganancia estimada, margen)
- Rotación de productos con estado activo/sin movimiento/agotado
- Alertas de vencimiento por colores (crítico, urgente, próximo)

### 📦 Productos
- Gestión completa de inventario (CRUD)
- Búsqueda en tiempo real por nombre, lote y fecha
- Filtro por categorías
- Registro con precio de costo, venta y precio por caja
- Límites de stock mínimo y máximo configurables
- Promociones y descuentos por fechas
- Subida de imagen por producto
- Exportación avanzada: Excel, PDF, agotados, stock bajo, por vencer, promociones, ventas del día
- Importación masiva desde Excel

### 🛒 Ventas
- Punto de venta con carrito persistente
- Venta por unidad o caja
- Métodos de pago: efectivo, tarjeta, transferencia, QR
- Datos del cliente (consumidor final o con datos)
- Recibo imprimible
- Historial de ventas por fecha con exportación a Excel
- Cierre de caja con cuadre de efectivo

## 👥 Roles de usuario

| Funcionalidad | Admin | Empleado |
|---------------|-------|----------|
| Ver inventario | ✅ | ✅ |
| Agregar/editar/eliminar productos | ✅ | ❌ |
| Registrar ventas | ✅ | ✅ |
| Ver historial de ventas | ✅ | ✅ |
| Ver dashboard completo | ✅ | ✅ |
| Análisis y rotación | ✅ | ❌ |
| Exportar reportes | ✅ | ❌ |

## 📁 Estructura del proyecto

```
src/app/
├── components/
│   ├── login/       # Pantalla de inicio de sesión
│   ├── dashboard/   # Panel de control
│   ├── productos/   # Gestión de inventario
│   └── ventas/      # Punto de venta
├── services/        # Servicios HTTP y autenticación
└── guards/          # Protección de rutas por rol
```