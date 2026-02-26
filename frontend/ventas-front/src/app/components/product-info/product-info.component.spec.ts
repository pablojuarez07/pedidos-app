import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductInfoComponent } from './product-info.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import api from '../../services/api';

describe('ProductInfoComponent', () => {
  let component: ProductInfoComponent;
  let fixture: ComponentFixture<ProductInfoComponent>;

  const mockProducto = {
    id: 1,
    nombre: 'Perfume Test',
    descripcion: 'Fragancia rica',
    precio: 1500,
    stock: 5,
    imagen_url: 'test.jpg'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProductInfoComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductInfoComponent);
    component = fixture.componentInstance;

    component.producto = mockProducto;
    fixture.detectChanges(); // dispara ngOnChanges
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnChanges debería setear validador max según stock', () => {
    const cantidadCtrl = component.form_pedido().get('cantidad');
    cantidadCtrl?.setValue(10);

    expect(cantidadCtrl?.hasError('max')).toBeTrue();
  });

  it('open() debería mostrar panel', () => {
    component.open();
    expect(component.visible).toBeTrue();
  });

  it('close() debería ocultar panel', () => {
    component.visible = true;
    component.close();
    expect(component.visible).toBeFalse();
  });

  it('realizarPedido NO debería llamar API si form inválido', async () => {
    const spy = spyOn(api, 'post');

    await component.realizarPedido();

    expect(spy).not.toHaveBeenCalled();
  });

  it('realizarPedido debería enviar pedido correctamente', fakeAsync(async () => {
    localStorage.setItem('client_id', '123');

    spyOn(api, 'post').and.returnValue(Promise.resolve());

    component.form_pedido().setValue({
      nombre_comprador: 'Juan',
      telefono: '123',
      cantidad: 2
    });

    await component.realizarPedido();

    expect(api.post).toHaveBeenCalledWith('/pedidos/add', {
      nombre_comprador: 'Juan',
      telefono: '123',
      cantidad: 2,
      producto_id: 1,
      precio_unitario: 1500,
      client_id: '123'
    });

    expect(component.pedidoExitoso).toBeTrue();
    expect(component.enviando).toBeFalse();

    // Simular timeout de cierre
    tick(1500);

    expect(component.pedidoExitoso).toBeFalse();
    expect(component.visible).toBeFalse();
  }));

  it('realizarPedido debería manejar error del API', async () => {
    localStorage.setItem('client_id', '123');

    spyOn(api, 'post').and.returnValue(Promise.reject('error'));

    component.form_pedido().setValue({
      nombre_comprador: 'Juan',
      telefono: '',
      cantidad: 1
    });

    await component.realizarPedido();

    expect(component.errorPedido).toContain('No se pudo realizar el pedido');
    expect(component.enviando).toBeFalse();
  });
});
