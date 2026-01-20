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

@Component({
  selector: 'app-home',
  imports: [
    ProductCardComponent, CommonModule, MenuLateralComponent,
    AdminFormComponent, AddProductFormComponent, ProductInfoComponent,
    ProductPromoComponent,HeaderSearchComponent, PedidosPlanillaComponent,
    ConfigAdminComponent
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
      this.productos.push(producto); // se agrega automáticamente
    });

    this.socketService.listen("nuevo_stock").subscribe((objeto) => {
      console.log("Objeto recibido por socket: ", objeto);
      const {producto_id, stock} = objeto;
      const producto = this.productos.find(p => p.id === producto_id);
      if (producto) {
        producto.stock = stock;
      }
    })
  }

  initClientId() {
    let clientId = localStorage.getItem('client_id');

    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem('client_id', clientId);
    }
  }

  async cargarProductos() {
    try {
      const data = await api.get("/productos");
      this.productos = data;
      this.productosOriginales = data;
      console.log("Productos:", this.productos);
    } catch (error: any) {
      console.error("Error:", error.message)
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
      const data = await api.get('/user/admin');
      this.fecha_cierre = data.cierre_campania?.split('T')[0];
    } catch (err){
      console.log("error al traer fecha: ", err)
    }
  }
}
