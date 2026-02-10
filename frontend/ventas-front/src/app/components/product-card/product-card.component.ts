import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, Output, EventEmitter, signal } from '@angular/core';
import { ProductInfoComponent } from "../product-info/product-info.component";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import api from '../../services/api';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, ProductInfoComponent, ReactiveFormsModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCardComponent {
  @Input() producto: any;
  @Input() delay = 0;
  @Input() logeado: any;
  @Output() selectProduct = new EventEmitter<any>();
  mostrarImagen = false;
  imgLoaded = false;
  mostrarFormulario = false;

  edit_form = signal<FormGroup>(
        new FormGroup(
          {
            nombre: new FormControl(''), 
            descripcion: new FormControl('', [Validators.maxLength(1000)]),
            precio: new FormControl('', [Validators.min(1)]),
            stock: new FormControl('', [Validators.min(1)]),
            category: new FormControl('')
          }
        )
  );

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

  abrirFormulario() {
    this.edit_form().patchValue({
      nombre: this.producto.nombre,
      descripcion: this.producto.descripcion,
      precio: this.producto.precio,
      stock: this.producto.stock,
      category: this.producto.category
    });
    this.mostrarFormulario = true;

    this.editSelectedCategory = this.edit_form().get('category')?.value;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
  }

  async guardarCambios() {
    if (this.edit_form().invalid) return;

    try {
      const data = this.edit_form().value;
      const updateProduct = await api.put(`/productos/edit/${this.producto.id}`, data)
      console.log("asd: ", updateProduct)
      this.producto = updateProduct;
      this.cerrarFormulario();
    } catch (err) {
      console.error("error al editar producto: ", err)
    }
  }

  categorias = ["Perfumes", "Maquillaje", "Cremas", "Promoción", "Otro"];
  isEditOpen = false;
  editSelectedCategory: string | null = null;

  toggleEditSelect() {
    this.isEditOpen = !this.isEditOpen;
  }

  selectEditCategory(cat: string) {
    this.editSelectedCategory = cat;
    this.edit_form().patchValue({ category: cat });
    this.isEditOpen = false;
  }


}
