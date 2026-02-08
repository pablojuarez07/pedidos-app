import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import api from '../../services/api';
import { SocketService } from '../../services/socket';

@Component({
  selector: 'app-product-promo',
  imports: [CommonModule],
  templateUrl: './product-promo.component.html',
  styleUrl: './product-promo.component.css'
})
export class ProductPromoComponent {
  productos: any[] = [];
  productosLoop: any[] = [];
  index = 1;
  transition = 'transform 0.4s ease';
  isAnimating = false;
  isJumping = false;

  constructor(private socketService: SocketService) {}

  ngOnInit() {
    this.getProductos();

    this.socketService.listen("producto_actualizado").subscribe((producto: any) => {
    const index = this.productos.findIndex(p => p.id === producto.id);

    // Si el producto es promo → actualizar
    if (producto.category === 'Promoción') {
      if (index !== -1) {
        this.productos[index] = producto;
      } else {
        this.productos.push(producto);
      }
    } 
    // Si dejó de ser promo → eliminar
    else {
      if (index !== -1) {
        this.productos.splice(index, 1);
      }
    }

    this.rebuildLoop();
    });

    // 🟢 NUEVO PRODUCTO
    this.socketService.listen("nuevo_producto").subscribe((producto: any) => {
      if (producto.category === 'Promoción') {
        this.productos.push(producto);
        this.rebuildLoop();
      }
    });
  }

  get transform() {
    return `translateX(-${this.index * 100}%)`;
  }

  next() {
    if (this.isAnimating || this.isJumping) return;

    this.isAnimating = true;
    this.index++;
  }

  prev() {
    if (this.isAnimating || this.isJumping) return;

    this.isAnimating = true;
    this.index--;
  }

  onTransitionEnd() {
    if (this.isJumping) return;

    // Clon final → primero real
    if (this.index === this.productosLoop.length - 1) {
      this.jumpTo(1);
      return;
    }

    // Clon inicial → último real
    if (this.index === 0) {
      this.jumpTo(this.productosLoop.length - 2);
      return;
    }

    this.isAnimating = false;
  }

  jumpTo(targetIndex: number) {
    this.isJumping = true;

    this.transition = 'none';
    this.index = targetIndex;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.transition = 'transform 0.4s ease';
        this.isJumping = false;
        this.isAnimating = false;
      });
    });
  }

  touchStartX = 0;
  touchEndX = 0;
  minSwipeDistance = 50; // px

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent) {
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd() {
    const distance = this.touchStartX - this.touchEndX;

    if (Math.abs(distance) > this.minSwipeDistance) {
      if (distance > 0) {
        this.next(); // swipe izquierda
      } else {
        this.prev(); // swipe derecha
      }
    }

    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  rebuildLoop() {
    if (this.productos.length > 0) {
      this.productosLoop = [
        this.productos[this.productos.length - 1],
        ...this.productos,
        this.productos[0]
      ];
      this.index = 1;
    } else {
      this.productosLoop = [];
    }
  }


  async getProductos() {
    try {
      const data = await api.get('/productos/categoria/Promoción');
      this.productos = data;
      console.log("promos:", this.productos)
      
      if (this.productos.length > 0) {
        this.productosLoop = [
          this.productos[this.productos.length - 1],
          ...this.productos,
          this.productos[0]
        ];
        this.index = 1;
      }
    } catch (err) {
      console.error("error al traer promociones: ", err);
    }
  }
}
