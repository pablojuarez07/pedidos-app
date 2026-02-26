import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card.component';
import { Component, Input } from '@angular/core';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

// Mock del componente hijo
@Component({
  selector: 'app-product-info',
  standalone: true,
  template: ''
})
class MockProductInfoComponent {
  @Input() producto: any;
}

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProducto = {
    id: 1,
    nombre: 'Perfume Test',
    descripcion: 'Fragancia rica',
    precio: 1500,
    stock: 5,
    imagen_url: 'test.jpg',
    category: 'Perfumes'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent, MockProductInfoComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;

    component.producto = mockProducto;
    component.logeado = true;

    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar datos del producto en el template', () => {
    const name = fixture.nativeElement.querySelector('.product_name');
    expect(name.textContent).toContain('Perfume Test');
  });

  it('debería emitir evento al seleccionar producto', () => {
    spyOn(component.selectProduct, 'emit');

    const btn = fixture.debugElement.query(By.css('.pedido-btn'));
    btn.triggerEventHandler('click');

    expect(component.selectProduct.emit).toHaveBeenCalledWith(mockProducto);
  });

  it('debería abrir imagen al hacer click', () => {
    component.abrirImg();
    expect(component.mostrarImagen).toBeTrue();
  });

  it('debería abrir formulario y cargar valores', () => {
    component.abrirFormulario();

    expect(component.mostrarFormulario).toBeTrue();
    expect(component.edit_form().value.nombre).toBe('Perfume Test');
  });

  it('debería cerrar formulario', () => {
    component.mostrarFormulario = true;
    component.cerrarFormulario();

    expect(component.mostrarFormulario).toBeFalse();
  });

  it('no debería guardar si el formulario es inválido', async () => {
    spyOn(component, 'cerrarFormulario');
    component.edit_form().patchValue({ precio: 0 });

    await component.guardarCambios();

    expect(component.cerrarFormulario).not.toHaveBeenCalled();
  });

  it('toggleEditSelect debería alternar estado', () => {
    component.isEditOpen = false;
    component.toggleEditSelect();
    expect(component.isEditOpen).toBeTrue();
  });

  it('selectEditCategory debería actualizar categoría', () => {
    component.selectEditCategory('Cremas');

    expect(component.editSelectedCategory).toBe('Cremas');
    expect(component.edit_form().value.category).toBe('Cremas');
  });
});
