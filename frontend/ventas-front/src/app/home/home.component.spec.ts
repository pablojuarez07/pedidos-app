import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { SocketService } from '../services/socket';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let socketServiceMock: jasmine.SpyObj<SocketService>;

  beforeEach(async () => {
    socketServiceMock = jasmine.createSpyObj('SocketService', ['listen']);
    socketServiceMock.listen.and.returnValue(of()); // 👈 evita errores de subscribe

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: SocketService, useValue: socketServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  // ------------------------------------------------
  // 🔹 CREACIÓN
  // ------------------------------------------------
  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  // ------------------------------------------------
  // 🔹 INIT
  // ------------------------------------------------
  it('ngOnInit debería llamar cargarProductos', () => {
    spyOn(component, 'cargarProductos');
    spyOn(component, 'getCierreCampaña');
    spyOn(component, 'initClientId');

    component.ngOnInit();

    expect(component.cargarProductos).toHaveBeenCalled();
    expect(component.getCierreCampaña).toHaveBeenCalled();
    expect(component.initClientId).toHaveBeenCalled();
  });

  // ------------------------------------------------
  // 🔹 NORMALIZAR TEXTO
  // ------------------------------------------------
  it('normalizar debería quitar acentos y minúsculas', () => {
    const result = component.normalizar('ÁrBól');
    expect(result).toBe('arbol');
  });

  // ------------------------------------------------
  // 🔹 BUSCAR PRODUCTOS
  // ------------------------------------------------
  it('buscarProductos debería filtrar correctamente', () => {
    component.productosOriginales = [
      { nombre: 'Café' },
      { nombre: 'Té' }
    ];

    component.buscarProductos('cafe');

    expect(component.productos.length).toBe(1);
    expect(component.productos[0].nombre).toBe('Café');
  });

  // ------------------------------------------------
  // 🔹 GET productosVisibles
  // ------------------------------------------------
  it('productosVisibles debería ocultar sin stock si no logeado', () => {
    component.logeado = false;
    component.productos = [
      { stock: 5 },
      { stock: 0 }
    ];

    expect(component.productosVisibles.length).toBe(1);
  });

  it('productosVisibles debería mostrar todos si está logeado', () => {
    component.logeado = true;
    component.productos = [
      { stock: 5 },
      { stock: 0 }
    ];

    expect(component.productosVisibles.length).toBe(2);
  });

  // ------------------------------------------------
  // 🔹 CAMBIO DE VISTA
  // ------------------------------------------------
  it('cambiarVista debería actualizar la vista actual', () => {
    component.cambiarVista('pedidos');
    expect(component.vistaActual).toBe('pedidos');
  });

  // ------------------------------------------------
  // 🔹 TOGGLES
  // ------------------------------------------------
  it('mostrarAdminForm debería alternar valor', () => {
    component.adminForm = false;
    component.mostrarAdminForm();
    expect(component.adminForm).toBeTrue();
  });

  // ------------------------------------------------
  // 🔹 SCROLL PROMO
  // ------------------------------------------------
  it('onScroll debería ocultar promo al bajar', () => {
    component.lastScrollTop = 0;
    component.onScroll({ target: { scrollTop: 100 } });
    expect(component.promoVisible).toBeFalse();
  });

  it('onScroll debería mostrar promo al subir', () => {
    component.lastScrollTop = 100;
    component.onScroll({ target: { scrollTop: 10 } });
    expect(component.promoVisible).toBeTrue();
  });
});
