import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarritoComponent } from './carrito.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import api from '../services/api';

describe('CarritoComponent', () => {
  let component: CarritoComponent;
  let fixture: ComponentFixture<CarritoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CarritoComponent,
        NoopAnimationsModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CarritoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('abrir() debería setear visible en true y llamar cargarPedidos', async () => {
    spyOn(component, 'cargarPedidos').and.returnValue(Promise.resolve());

    await component.abrir();

    expect(component.visible).toBeTrue();
    expect(component.cargarPedidos).toHaveBeenCalled();
  });

  it('cerrar() debería setear visible en false', () => {
    component.visible = true;
    component.cerrar();
    expect(component.visible).toBeFalse();
  });

  it('confirmar() debería setear confirmandoId', () => {
    component.confirmar(10);
    expect(component.confirmandoId).toBe(10);
  });

  it('cancelarConfirmacion() debería limpiar confirmandoId', () => {
    component.confirmandoId = 5;
    component.cancelarConfirmacion();
    expect(component.confirmandoId).toBeNull();
  });

  it('cargarPedidos() no debería hacer nada si no hay client_id', async () => {
    const spy = spyOn(api, 'get');

    await component.cargarPedidos();

    expect(spy).not.toHaveBeenCalled();
  });

  it('cargarPedidos() debería llamar api y setear pedidos', async () => {
    localStorage.setItem('client_id', '123');

    const mockPedidos = [
      { id: 1, estado: 'pendiente', total: 100 }
    ];

    spyOn(api, 'get').and.returnValue(Promise.resolve(mockPedidos));

    await component.cargarPedidos();

    expect(api.get).toHaveBeenCalledWith('/pedidos/123');
    expect(component.pedidos).toEqual(mockPedidos);
  });

  it('cambiarEstado() debería cancelar pedido pendiente', async () => {
    const pedido = { id: 1, estado: 'pendiente' };

    spyOn(api, 'post').and.returnValue(Promise.resolve());

    await component.cambiarEstado(pedido);

    expect(api.post).toHaveBeenCalledWith('/pedidos/1/estado', {
      estado: 'cancelado'
    });

    expect(pedido.estado).toBe('cancelado');
    expect(component.confirmandoId).toBeNull();
  });

  it('cambiarEstado() debería reactivar pedido cancelado', async () => {
    const pedido = { id: 2, estado: 'cancelado' };

    spyOn(api, 'post').and.returnValue(Promise.resolve());

    await component.cambiarEstado(pedido);

    expect(api.post).toHaveBeenCalledWith('/pedidos/2/estado', {
      estado: 'pendiente'
    });

    expect(pedido.estado).toBe('pendiente');
  });

  it('cambiarEstado() no debería romper si api falla', async () => {
    const pedido = { id: 3, estado: 'pendiente' };

    spyOn(api, 'post').and.returnValue(Promise.reject('error'));

    await component.cambiarEstado(pedido);

    // El estado no cambia si falla
    expect(pedido.estado).toBe('pendiente');
  });
});
