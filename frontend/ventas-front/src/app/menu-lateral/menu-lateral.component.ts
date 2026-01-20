import { Component, EventEmitter, Input, Output } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-lateral',
  imports: [CommonModule],
  templateUrl: './menu-lateral.component.html',
  styleUrl: './menu-lateral.component.css',
  animations: [
    trigger('outLeft', [
      state('collapsed', style({
        transform: 'translateX(0)'   // no usamos width aquí
      })),
      state('expanded', style({
        transform: 'translateX(0)'
      })),
      transition('collapsed <=> expanded', [
        animate('0.3s ease-in-out'),
      ])
    ])
  ]
})
export class MenuLateralComponent {
  @Output() mostrarAdminForm = new EventEmitter<void>();
  @Output() mostrarAddProductForm = new EventEmitter<void>();
  @Input() logeado: boolean = false;
  @Output() filtrarCategoria = new EventEmitter<string>();
  @Output() verPedidos = new EventEmitter<void>();
  @Output() verProductos = new EventEmitter<void>();
  @Output() verConfg = new EventEmitter<void>();
  isVisible = false;
  isMobile = false;
  @Input() headerVisible = true;

  ngOnInit() {
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());
  }

  checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  closeMenuIfMobile() {
    if (this.isMobile) {
      this.isVisible = false;
    }
  }

  showMenu(){
    this.isVisible = !this.isVisible;
  }

  logIn(){
    this.mostrarAdminForm.emit();
  }

  addProductForm(){
    this.mostrarAddProductForm.emit();
  }

  buscarProductoCategoria(categoria: any) {
    this.filtrarCategoria.emit(categoria);
  }

  mostrarPedidos() {
    this.verPedidos.emit();
  }

  mostrarProductos() {
    this.verProductos.emit();
  }

  mostrarConfiguracion () {
    this.verConfg.emit();
  }
}
