import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AddProductFormComponent } from './add-product-form.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import api from '../services/api';

describe('AddProductFormComponent', () => {
  let component: AddProductFormComponent;
  let fixture: ComponentFixture<AddProductFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProductFormComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('toggleSelect debería abrir/cerrar el select', () => {
    expect(component.isOpen).toBeFalse();
    component.toggleSelect();
    expect(component.isOpen).toBeTrue();
  });

  it('selectCategory debería setear categoría y actualizar el form', () => {
    component.selectCategory('Perfumes');
    expect(component.selectedCategory).toBe('Perfumes');
    expect(component.addProduct_form().value.categoria).toBe('Perfumes');
  });

  it('onDragOver debería activar isDragOver', () => {
    const event = new DragEvent('dragover');
    component.onDragOver(event);
    expect(component.isDragOver).toBeTrue();
  });

  it('onDragLeave debería desactivar isDragOver', () => {
    const event = new DragEvent('dragleave');
    component.isDragOver = true;
    component.onDragLeave(event);
    expect(component.isDragOver).toBeFalse();
  });

  it('onDrop debería guardar imagen válida', () => {
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    const event = {
      preventDefault: () => {},
      dataTransfer: { files: [file] }
    } as any;

    component.onDrop(event);
    expect(component.selectedImage).toBe(file);
  });

  it('onDrop NO debería aceptar archivo no imagen', () => {
    spyOn(window, 'alert');
    const file = new File(['doc'], 'test.pdf', { type: 'application/pdf' });
    const event = {
      preventDefault: () => {},
      dataTransfer: { files: [file] }
    } as any;

    component.onDrop(event);
    expect(component.selectedImage).toBeNull();
    expect(window.alert).toHaveBeenCalled();
  });

  it('addProduct NO debería llamar API si form inválido', async () => {
    spyOn(window, 'alert');
    spyOn(api, 'postForm');

    await component.addProduct();
    expect(api.postForm).not.toHaveBeenCalled();
  });

  it('addProduct debería llamar API si todo es válido', async () => {
    spyOn(api, 'postForm').and.resolveTo({ data: {} } as any);

    const file = new File(['img'], 'test.png', { type: 'image/png' });
    component.selectedImage = file;

    component.addProduct_form().patchValue({
      nombre: 'Perfume X',
      descripcion: 'Muy bueno',
      precio: 100,
      stock: 5,
      categoria: 'Perfumes'
    });

    await component.addProduct();

    expect(api.postForm).toHaveBeenCalled();
  });

  it('cerrar debería emitir evento close después de 200ms', fakeAsync(() => {
    spyOn(component.close, 'emit');
    component.cerrar();
    tick(200);
    expect(component.close.emit).toHaveBeenCalled();
  }));

  it('el botón cerrar del HTML debería llamar cerrar()', () => {
    spyOn(component, 'cerrar');
    const btn = fixture.debugElement.query(By.css('.cerrar_btn'));
    btn.triggerEventHandler('click');
    expect(component.cerrar).toHaveBeenCalled();
  });
});
