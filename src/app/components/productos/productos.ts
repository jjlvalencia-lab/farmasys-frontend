import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  productos: any[] = [];
  productosFiltrados: any[] = [];
  textoBusqueda: string = '';
  categoriaSeleccionada: string = '';
  mostrarFormulario = false;
  editando = false;
  productoActual: any = this.nuevoProducto();
  esAdmin: boolean = localStorage.getItem('rol') === 'admin';
  imagenPreview: string = '';
  seccionActiva: string = 'basico';

  categorias = ['Todos', 'Analgésicos', 'Antibióticos', 'Vitaminas', 'Antiinflamatorios', 'Antihistamínicos', 'Otros'];

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  nuevoProducto() {
    return {
      nombre: '', precio: 0, precioCosto: 0,
      unidadesPorCaja: 1, precioCaja: 0,
      lote: '', fechaElaboracion: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      fechaCaducidad: '', stock: 0,
      stockMinimo: 10, stockMaximo: 1000,
      imagen: '', categoria: 'Otros',
      enPromocion: false, descuento: 0,
      promocionInicio: '', promocionFin: ''
    };
  }

  get productosAgotados(): number {
    return this.productos.filter(p => p.stock === 0).length;
  }

  ngOnInit() { this.cargarProductos(); }

  cargarProductos() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any[]>(`http://localhost:3000/productos?t=${Date.now()}`, { headers }).subscribe({
      next: (data) => {
        this.productos = [...data];
        this.filtrar();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err)
    });
  }

  filtrar() {
    let resultado = [...this.productos];
    const texto = this.textoBusqueda.toLowerCase().trim();
    if (texto) {
      resultado = resultado.filter(p =>
        p.nombre.toLowerCase().includes(texto) ||
        p.lote.toLowerCase().includes(texto) ||
        p.fechaCaducidad.toLowerCase().includes(texto)
      );
    }
    if (this.categoriaSeleccionada && this.categoriaSeleccionada !== 'Todos') {
      resultado = resultado.filter(p => p.categoria === this.categoriaSeleccionada);
    }
    this.productosFiltrados = resultado.sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return 1;
      if (a.stock > 0 && b.stock === 0) return -1;
      return 0;
    });
    this.cdr.detectChanges();
  }

  buscar() { this.filtrar(); }

  getStockClass(p: any): string {
    if (p.stock === 0) return 'stock-agotado';
    if (p.stock <= p.stockMinimo) return 'stock-critico';
    if (p.stock >= p.stockMaximo) return 'stock-sobre';
    return '';
  }

  abrirFormulario() {
    this.productoActual = this.nuevoProducto();
    this.imagenPreview = '';
    this.editando = false;
    this.seccionActiva = 'basico';
    this.mostrarFormulario = true;
  }

  editar(producto: any) {
    this.productoActual = { ...producto };
    this.imagenPreview = producto.imagen || '';
    this.editando = true;
    this.seccionActiva = 'basico';
    this.mostrarFormulario = true;
  }

  onImagenSeleccionada(event: any) {
  const archivo = event.target.files[0];
  if (!archivo) return;

  // Preview local inmediato
  const reader = new FileReader();
  reader.onload = (e: any) => {
    this.imagenPreview = e.target.result;
    this.cdr.detectChanges();
  };
  reader.readAsDataURL(archivo);

  // Subir a Cloudinary si el producto ya existe
  if (this.editando && this.productoActual.id) {
    this.subirImagenCloudinary(archivo, this.productoActual.id);
  } else {
    // Guardar archivo temporalmente para subir después de crear
    this.archivoImagenPendiente = archivo;
  }
}

archivoImagenPendiente: File | null = null;

subirImagenCloudinary(archivo: File, productoId: number) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('imagen', archivo);

  this.http.post<{ imagenUrl: string }>(
    `http://localhost:3000/productos/${productoId}/imagen`,
    formData,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).subscribe({
    next: (res) => {
      this.productoActual.imagenUrl = res.imagenUrl;
      this.cdr.detectChanges();
    },
    error: (err) => console.error('Error subiendo imagen:', err)
  });
}

  calcularPrecioCaja() {
    if (this.productoActual.unidadesPorCaja > 1 && this.productoActual.precio > 0) {
      this.productoActual.precioCaja = +(this.productoActual.precio * this.productoActual.unidadesPorCaja).toFixed(2);
    }
  }

  guardar() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  if (this.editando) {
    this.http.put(
      `http://localhost:3000/productos/${this.productoActual.id}`,
      this.productoActual, { headers }
    ).subscribe(() => {
      this.cargarProductos();
      this.mostrarFormulario = false;
      this.imagenPreview = '';
      this.archivoImagenPendiente = null;
    });
  } else {
    this.http.post('http://localhost:3000/productos', this.productoActual, { headers })
      .subscribe((nuevoProducto: any) => {
        // Si hay imagen pendiente la subimos ahora que tenemos el ID
        if (this.archivoImagenPendiente) {
          this.subirImagenCloudinary(this.archivoImagenPendiente, nuevoProducto.id);
          this.archivoImagenPendiente = null;
        }
        this.cargarProductos();
        this.mostrarFormulario = false;
        this.imagenPreview = '';
      });
  }
}

  eliminar(id: number) {
    if (confirm('Estas seguro de eliminar este producto?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      this.http.delete(`http://localhost:3000/productos/${id}`, { headers }).subscribe(() => this.cargarProductos());
    }
  }

  exportarExcel() {
    import('xlsx').then(XLSX => {
      const datos = this.productosFiltrados.map(p => ({
        'Nombre': p.nombre, 'Categoria': p.categoria,
        'Stock': p.stock, 'Precio Venta': p.precio,
        'Precio Costo': p.precioCosto, 'Lote': p.lote,
        'F. Elaboracion': p.fechaElaboracion, 'F. Ingreso': p.fechaIngreso,
        'F. Caducidad': p.fechaCaducidad
      }));
      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Inventario');
      XLSX.writeFile(libro, 'inventario-farmasys.xlsx');
    });
  }

  exportarPDF() {
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(autoTableModule => {
        const autoTable = autoTableModule.default;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('FarmaSys - Inventario de Productos', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 32);
        autoTable(doc, {
          startY: 40,
          head: [['Nombre', 'Categoria', 'Stock', 'P.Venta', 'P.Costo', 'Lote', 'Caducidad']],
          body: this.productosFiltrados.map(p => [
            p.nombre, p.categoria, p.stock, `$${p.precio}`, `$${p.precioCosto}`, p.lote, p.fechaCaducidad
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [38, 70, 83] }
        });
        doc.save('inventario-farmasys.pdf');
      });
    });
  }

  importarExcel(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    import('xlsx').then(XLSX => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const libro = XLSX.read(data, { type: 'array' });
        const hoja = libro.Sheets[libro.SheetNames[0]];
        const filas: any[] = XLSX.utils.sheet_to_json(hoja);
        const token = localStorage.getItem('token');
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        let guardados = 0;
        filas.forEach(fila => {
          const producto = {
            nombre: fila['Nombre'] || '', categoria: fila['Categoria'] || 'Otros',
            stock: fila['Stock'] || 0, precio: fila['Precio Venta'] || 0,
            precioCosto: fila['Precio Costo'] || 0, lote: fila['Lote'] || '',
            fechaElaboracion: fila['F. Elaboracion'] || '',
            fechaIngreso: fila['F. Ingreso'] || '',
            fechaCaducidad: fila['F. Caducidad'] || '',
            stockMinimo: fila['Stock Minimo'] || 10,
            stockMaximo: fila['Stock Maximo'] || 1000,
            imagen: ''
          };
          this.http.post('http://localhost:3000/productos', producto, { headers }).subscribe(() => {
            guardados++;
            if (guardados === filas.length) {
              alert(`${guardados} productos importados correctamente!`);
              this.cargarProductos();
            }
          });
        });
      };
      reader.readAsArrayBuffer(archivo);
    });
  }

  volver() { this.router.navigate(['/dashboard']); }

  activarPromocion(producto: any) {
    this.productoActual = { ...producto };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  exportarMasVendidos() {
    import('xlsx').then(XLSX => {
      const datos = [...this.productos]
        .sort((a, b) => b.stock - a.stock)
        .slice(0, 20)
        .map(p => ({
          'Nombre': p.nombre, 'Categoria': p.categoria,
          'Stock': p.stock, 'Precio Venta': p.precio,
          'Precio Costo': p.precioCosto, 'Lote': p.lote
        }));
      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Mas Vendidos');
      XLSX.writeFile(libro, 'productos-mayor-stock.xlsx');
    });
  }

  exportarPorVencer() {
    import('xlsx').then(XLSX => {
      const hoy = new Date();
      const datos = this.productos
        .filter(p => {
          const dias = Math.ceil((new Date(p.fechaCaducidad).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
          return dias <= 30 && dias >= 0;
        })
        .map(p => ({
          'Nombre': p.nombre, 'Lote': p.lote,
          'Stock': p.stock, 'F. Caducidad': p.fechaCaducidad,
          'Categoria': p.categoria
        }));
      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Por Vencer');
      XLSX.writeFile(libro, 'productos-por-vencer.xlsx');
    });
  }

  exportarEnPromocion() {
    import('xlsx').then(XLSX => {
      const datos = this.productos
        .filter(p => p.enPromocion)
        .map(p => ({
          'Nombre': p.nombre, 'Descuento %': p.descuento,
          'Precio Original': p.precio,
          'Precio con Descuento': (p.precio * (1 - p.descuento / 100)).toFixed(2),
          'Desde': p.promocionInicio, 'Hasta': p.promocionFin
        }));
      const hoja = XLSX.utils.json_to_sheet(datos);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Promociones');
      XLSX.writeFile(libro, 'productos-en-promocion.xlsx');
    });
  }

  exportarVentasHoy() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  const hoy = new Date().toISOString().split('T')[0];
  this.http.get<any[]>(`http://localhost:3000/ventas/fecha?fecha=${hoy}`, { headers }).subscribe({
    next: (ventas) => {
      import('xlsx').then(XLSX => {
        const datos = ventas.map(v => ({
          '#': v.id,
          'Hora': new Date(v.fecha).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
          'Total': v.total,
          'Método Pago': v.metodoPago,
          'Entidad': v.entidadFinanciera || '-',
          'Cliente': v.tipoCliente === 'con_datos' ? v.clienteNombre : 'Consumidor Final',
          'Cajero': v.cajero || '-'
        }));
        const hoja = XLSX.utils.json_to_sheet(datos);
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, `Ventas ${hoy}`);
        XLSX.writeFile(libro, `ventas-del-dia-${hoy}.xlsx`);
      });
    }
  });
}

exportarAgotados() {
  import('xlsx').then(XLSX => {
    const datos = this.productos
      .filter(p => p.stock === 0)
      .map(p => ({
        'Nombre': p.nombre, 'Categoria': p.categoria,
        'Lote': p.lote, 'F. Caducidad': p.fechaCaducidad,
        'Precio Venta': p.precio, 'Precio Costo': p.precioCosto
      }));
    if (!datos.length) { alert('No hay productos agotados.'); return; }
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Agotados');
    XLSX.writeFile(libro, 'productos-agotados.xlsx');
  });
}

exportarStockBajo() {
  import('xlsx').then(XLSX => {
    const datos = this.productos
      .filter(p => p.stock > 0 && p.stock <= (p.stockMinimo || 10))
      .map(p => ({
        'Nombre': p.nombre, 'Categoria': p.categoria,
        'Stock Actual': p.stock, 'Stock Mínimo': p.stockMinimo,
        'Lote': p.lote, 'F. Caducidad': p.fechaCaducidad
      }));
    if (!datos.length) { alert('No hay productos con stock bajo.'); return; }
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Stock Bajo');
    XLSX.writeFile(libro, 'productos-stock-bajo.xlsx');
  });
}

exportarIngresadosRecientes() {
  import('xlsx').then(XLSX => {
    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);
    const datos = this.productos
      .filter(p => p.fechaIngreso && new Date(p.fechaIngreso) >= hace30dias)
      .sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime())
      .map(p => ({
        'Nombre': p.nombre, 'Categoria': p.categoria,
        'Stock': p.stock, 'Precio Venta': p.precio,
        'F. Ingreso': p.fechaIngreso, 'Lote': p.lote
      }));
    if (!datos.length) { alert('No hay productos ingresados en los últimos 30 días.'); return; }
    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Ingresados Recientes');
    XLSX.writeFile(libro, 'productos-ingresados-recientes.xlsx');
  });
}

exportarResumenGeneral() {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(autoTableModule => {
      const autoTable = autoTableModule.default;
      const doc = new jsPDF();
      const hoy = new Date().toLocaleDateString('es');
      const agotados = this.productos.filter(p => p.stock === 0).length;
      const stockBajo = this.productos.filter(p => p.stock > 0 && p.stock <= (p.stockMinimo || 10)).length;
      const enPromocion = this.productos.filter(p => p.enPromocion).length;
      const totalInvertido = this.productos.reduce((sum, p) => sum + (p.precioCosto * p.stock), 0);
      const valorVenta = this.productos.reduce((sum, p) => sum + (p.precio * p.stock), 0);

      doc.setFontSize(20);
      doc.setTextColor(38, 70, 83);
      doc.text('FarmaSys — Resumen General', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado: ${hoy}`, 14, 30);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Resumen del Inventario', 14, 42);
      autoTable(doc, {
        startY: 46,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de productos', this.productos.length],
          ['Productos agotados', agotados],
          ['Stock bajo', stockBajo],
          ['En promoción', enPromocion],
          ['Total invertido (costo)', `$${totalInvertido.toFixed(2)}`],
          ['Valor venta potencial', `$${valorVenta.toFixed(2)}`],
          ['Ganancia estimada', `$${(valorVenta - totalInvertido).toFixed(2)}`]
        ],
        headStyles: { fillColor: [38, 70, 83] },
        styles: { fontSize: 10 }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Detalle de Inventario', 14, finalY);
      autoTable(doc, {
        startY: finalY + 4,
        head: [['Nombre', 'Cat.', 'Stock', 'P.Venta', 'P.Costo', 'Caducidad']],
        body: this.productos.map(p => [
          p.nombre, p.categoria, p.stock,
          `$${p.precio}`, `$${p.precioCosto}`, p.fechaCaducidad
        ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [42, 157, 143] }
      });
      doc.save(`resumen-general-${new Date().toISOString().split('T')[0]}.pdf`);
    });
  });
}

  getPrecioConDescuento(p: any): number {
    if (p.enPromocion && p.descuento > 0) {
      return p.precio * (1 - p.descuento / 100);
    }
    return p.precio;
  }
}
