import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { ProductInfoComponent } from "../product-info/product-info.component";
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, ProductInfoComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  @Input() producto: any;
  @Input() delay = 0;
  @Output() selectProduct = new EventEmitter<any>();
  mostrarImagen = false;
  imgLoaded = false;

  onImgLoad() {
    this.imgLoaded = true;
  }

  seleccionarProducto(){
    this.selectProduct.emit(this.producto);
  }
  
  abrirImg() {
    this.mostrarImagen = true;
  }

  cerrarImg() {
    this.mostrarImagen = false;
  }
}
