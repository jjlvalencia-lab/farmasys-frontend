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

  categorias = ['Todos', 'Analgésicos', 'Antibióticos', 'Vitaminas', 'Antiinflamatorios', 'Antihistamínicos', 'Otros'];

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}

  nuevoProducto() {
    return { nombre: '', precio: 0, lote: '', fechaCaducidad: '', stock: 0, imagen: '', categoria: 'Otros' };
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

  abrirFormulario() {
    this.productoActual = this.nuevoProducto();
    this.editando = false;
    this.mostrarFormulario = true;
  }

  editar(producto: any) {
    this.productoActual = { ...producto };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  guardar() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    if (this.editando) {
      this.http.put(`http://localhost:3000/productos/${this.productoActual.id}`, this.productoActual, { headers }).subscribe(() => {
        this.cargarProductos();
        this.mostrarFormulario = false;
      });
    } else {
      this.http.post('http://localhost:3000/productos', this.productoActual, { headers }).subscribe(() => {
        this.cargarProductos();
        this.mostrarFormulario = false;
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      this.http.delete(`http://localhost:3000/productos/${id}`, { headers }).subscribe(() => this.cargarProductos());
    }
  }

  volver() { this.router.navigate(['/dashboard']); }

  exportarExcel() {
  import('xlsx').then(XLSX => {
    const datos = this.productosFiltrados.map(p => ({
      'Nombre': p.nombre,
      'Categoría': p.categoria,
      'Stock': p.stock,
      'Precio': p.precio,
      'Lote': p.lote,
      'Fecha Caducidad': p.fechaCaducidad
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
        head: [['Nombre', 'Categoría', 'Stock', 'Precio', 'Lote', 'Caducidad']],
        body: this.productosFiltrados.map(p => [
          p.nombre, p.categoria, p.stock, `$${p.precio}`, p.lote, p.fechaCaducidad
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [38, 70, 83] }
      });
      doc.save('inventario-farmasys.pdf');
    });
  });
}
}

