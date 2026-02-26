import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import api from '../services/api';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-add-product-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-product-form.component.html',
  styleUrl: './add-product-form.component.css',
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.9)'
      })),
      transition(':enter', [
        animate('200ms ease-out')
      ]),
      transition(':leave', [
        animate('200ms ease-in')
      ])
    ])
  ]
})
export class AddProductFormComponent {
  @Output() close = new EventEmitter<void>();
  selectedImage: File | null = null;
  isDragOver = false;
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  addProduct_form = signal<FormGroup>(
      new FormGroup(
        {
          nombre: new FormControl('', [Validators.required]), 
          descripcion: new FormControl('', [Validators.required, Validators.maxLength(1000)]),
          precio: new FormControl('', [Validators.required, Validators.min(1)]),
          stock: new FormControl('', [Validators.required, Validators.min(1)]),
          categoria: new FormControl('', [Validators.required])
        }
      )
  );

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten imágenes.");
      return;
    }

    this.selectedImage = file;
  }

  onImageSelected(event: any) {
    this.selectedImage = event.target.files[0] ?? null;
  }

  async addProduct(){
    if (this.addProduct_form().invalid || !this.selectedImage) {
      this.errorMessage.set("Complete todos los campos y seleccione una imagen.");
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);

    const data = this.addProduct_form().value;

    const formData = new FormData();
    formData.append("nombre", data.nombre);
    formData.append("descripcion", data.descripcion);
    formData.append("precio", data.precio);
    formData.append("stock", data.stock);
    formData.append("categoria", data.categoria);
    formData.append("imagen", this.selectedImage);

    try {
      const res = await api.postForm("/productos/add", formData);
      console.log("Producto creado:", res.data);
      this.cerrar();
    } catch (err: any) {
      console.error("Error al crear producto:", err);
      console.log("test: ", err);

      // Si backend manda mensaje específico
      const backendMessage = err?.message || "Error al crear el producto";
      this.errorMessage.set(backendMessage);

      this.loading.set(false);
    } finally {
      this.loading.set(false);
    }
  }
  
  cerrar() {
    setTimeout(() => {
      this.close.emit();
    }, 200);
  }

  categorias = ["Perfumes", "Maquillaje", "Cremas", "Promoción", "Otro"];

  selectedCategory: string | null = null;
  isOpen = false;

  toggleSelect() {
    this.isOpen = !this.isOpen;
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.isOpen = false;
    this.addProduct_form().patchValue({ categoria: cat }); // ← vincula al form
  }
}
