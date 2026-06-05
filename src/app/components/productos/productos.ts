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
    this.productosFiltrados = resultado;
    this.cdr.detectChanges();
  }

  buscar() { this.filtrar(); }

  getStockClass(p: any): string {
    if (p.stock <= p.stockMinimo) return 'stock-critico';
    if (p.stock >= p.stockMaximo) return 'stock-sobre';
    return '';
  }

  abrirFormulario() {
    this.productoActual = this.nuevoProducto();
    this.imagenPreview = '';
    this.editando = false;
    this.mostrarFormulario = true;
  }

  editar(producto: any) {
    this.productoActual = { ...producto };
    this.imagenPreview = producto.imagen || '';
    this.editando = true;
    this.mostrarFormulario = true;
  }

  onImagenSeleccionada(event: any) {
    const archivo = event.target.files[0];
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagenPreview = e.target.result;
      this.productoActual.imagen = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(archivo);
  }

  guardar() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    if (this.editando) {
      this.http.put(`http://localhost:3000/productos/${this.productoActual.id}`, this.productoActual, { headers }).subscribe(() => {
        this.cargarProductos();
        this.mostrarFormulario = false;
        this.imagenPreview = '';
      });
    } else {
      this.http.post('http://localhost:3000/productos', this.productoActual, { headers }).subscribe(() => {
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

getPrecioConDescuento(p: any): number {
  if (p.enPromocion && p.descuento > 0) {
    return p.precio * (1 - p.descuento / 100);
  }
  return p.precio;
}
}
