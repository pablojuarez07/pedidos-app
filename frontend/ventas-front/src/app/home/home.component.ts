import { Component, ViewChild } from '@angular/core';
import api from "../services/api";
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { CommonModule } from '@angular/common';
import { MenuLateralComponent } from '../menu-lateral/menu-lateral.component';
import { AdminFormComponent } from '../admin-form/admin-form.component';
import { AddProductFormComponent } from "../add-product-form/add-product-form.component";
import { ProductInfoComponent } from "../components/product-info/product-info.component";
import { SocketService } from '../services/socket';
import { ProductPromoComponent } from "../components/product-promo/product-promo.component";
import { HeaderSearchComponent } from '../header-search/header-search.component';
import { PedidosPlanillaComponent } from '../pedidos-planilla/pedidos-planilla.component';
import { ConfigAdminComponent } from '../config-admin/config-admin.component';
import { ChatbotComponent } from "../chatbot/chatbot.component";

@Component({
  selector: 'app-home',
  imports: [
    ProductCardComponent, CommonModule, MenuLateralComponent,
    AdminFormComponent, AddProductFormComponent, ProductInfoComponent,
    ProductPromoComponent, HeaderSearchComponent, PedidosPlanillaComponent,
    ConfigAdminComponent,
    ChatbotComponent
],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  adminForm = false;
  productForm = false;
  productos: any[] = [];
  productosOriginales: any[] = [];
  logeado = false;
  selectProduct: any;
  category = "Productos";

  promoVisible = true;
  lastScrollTop = 0;

  headerVisible = true;

  cargandoProductos = true;

  onScroll(event: any) {
    const scrollTop = event.target.scrollTop;

    // Si bajó → ocultar
    if (scrollTop > this.lastScrollTop && scrollTop > 40) {
      this.promoVisible = false;
    } 
    // Si sube → mostrar
    else if (scrollTop < this.lastScrollTop) {
      this.promoVisible = true;
    }

    this.lastScrollTop = scrollTop;
  }

  constructor(private socketService: SocketService) {}

  @ViewChild(ProductInfoComponent)
  infoPanel!: ProductInfoComponent;

  abrirPedirProducto() {
    this.infoPanel.open();
  }

  ngOnInit() {
    this.initClientId();
    this.getCierreCampaña();
    this.cargarProductos(); 

    // escuchamos el websocket
    this.socketService.listen("nuevo_producto").subscribe((producto) => {
      console.log("Producto recibido por WebSocket:", producto);
      this.productos = [...this.productos, producto];
      this.productosOriginales = [...this.productosOriginales, producto];
    });

    this.socketService.listen("nuevo_stock").subscribe((objeto) => {
      console.log("Objeto recibido por socket: ", objeto);
      const {producto_id, stock} = objeto;
      const index = this.productos.findIndex(p => p.id === producto_id);
      if (index !== -1) {
        // reemplazamos el objeto completo para que Angular lo detecte
        this.productos[index] = { ...this.productos[index], stock };
      }
    });

    this.socketService.listen("nueva_fecha").subscribe((fecha) => {
      console.log("new date close: ", fecha);
      this.fecha_cierre = fecha;
    });

    this.socketService.listen("producto_actualizado").subscribe((producto: any) => {
      console.log("Producto actualizado recibido por socket:", producto);

      // Verificar si ya existe en el array de productos
      const index = this.productos.findIndex(p => p.id === producto.id);

      if (index !== -1) {
        // Reemplazar el producto completo
        this.productos[index] = producto;
      } else {
        // Si no existe (por ejemplo stock > 0 y antes no estaba visible), agregarlo
        this.productos.push(producto);
      }

      // Hacer lo mismo en el array original para la búsqueda
      const originalIndex = this.productosOriginales.findIndex(p => p.id === producto.id);
      if (originalIndex !== -1) {
        this.productosOriginales[originalIndex] = producto;
      } else {
        this.productosOriginales.push(producto);
      }
  });
  }

  initClientId() {
    let clientId = localStorage.getItem('client_id');

    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('client_id', clientId);
    }
  }

  async cargarProductos() {
    this.cargandoProductos = true;
    try {
      const data = await api.get("/productos");
      this.productos = data;
      this.productosOriginales = data;
      console.log("Productos:", this.productos);
    } catch (error: any) {
      console.error("Error:", error.message)
    } finally {
      this.cargandoProductos = false; // fin de carga
    }
  }

  mostrarAdminForm() { this.adminForm = !this.adminForm; }
  mostrarProductForm() { this.productForm = !this.productForm }

  login(){
    this.logeado = true;
  }

  async filtrarProductosCat(categoria: any) {
    try {
      if(categoria){
        const data = await api.get(`/productos/categoria/${categoria}`);
        this.productos = data;
        this.category = categoria;
      } else {
        const data = await api.get("/productos");
        this.productos = data;
        this.category = "Productos";
      }
      
    } catch (err){
      console.error("error al filtrar productos: ", err);
    }
  }

  vistaActual: 'productos' | 'pedidos' | 'configuracion' = 'productos';

  cambiarVista(vista: 'productos' | 'pedidos' | 'configuracion') {
    this.vistaActual = vista;
  }

  normalizar(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  buscarProductos(texto: string) {
    const buscado = this.normalizar(texto);

    this.productos = this.productosOriginales.filter(p =>
      this.normalizar(p.nombre).includes(buscado)
    );
  }

  fecha_cierre: any;
  async getCierreCampaña () {
    try {
      const data = await api.get('/user/cierre-campania');
      this.fecha_cierre = data.cierre_campania?.split('T')[0];
    } catch (err){
      console.log("error al traer fecha: ", err)
    }
  }

  get productosVisibles() {
    if (this.logeado) {
      return this.productos;
    }

    return this.productos.filter(p => p.stock > 0);
  }
}
