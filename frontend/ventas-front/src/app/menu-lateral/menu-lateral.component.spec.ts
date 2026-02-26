import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuLateralComponent } from './menu-lateral.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('MenuLateralComponent', () => {
  let component: MenuLateralComponent;
  let fixture: ComponentFixture<MenuLateralComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuLateralComponent],
      providers: [provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuLateralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------
  // UI STATE
  // ---------------------------

  it('showMenu() debería alternar isVisible', () => {
    expect(component.isVisible).toBeFalse();

    component.showMenu();
    expect(component.isVisible).toBeTrue();

    component.showMenu();
    expect(component.isVisible).toBeFalse();
  });

  it('checkMobile() debería detectar modo mobile', () => {
    const innerWidthSpy = spyOnProperty(window, 'innerWidth', 'get');

    innerWidthSpy.and.returnValue(500);
    component.checkMobile();
    expect(component.isMobile).toBeTrue();

    innerWidthSpy.and.returnValue(1200);
    component.checkMobile();
    expect(component.isMobile).toBeFalse();
  });

  it('closeMenuIfMobile() debería cerrar menú solo si es mobile', () => {
    component.isVisible = true;
    component.isMobile = true;

    component.closeMenuIfMobile();
    expect(component.isVisible).toBeFalse();

    component.isVisible = true;
    component.isMobile = false;

    component.closeMenuIfMobile();
    expect(component.isVisible).toBeTrue();
  });

  // ---------------------------
  // EVENTS
  // ---------------------------

  it('logIn() debería emitir mostrarAdminForm', () => {
    spyOn(component.mostrarAdminForm, 'emit');

    component.logIn();

    expect(component.mostrarAdminForm.emit).toHaveBeenCalled();
  });

  it('addProductForm() debería emitir mostrarAddProductForm', () => {
    spyOn(component.mostrarAddProductForm, 'emit');

    component.addProductForm();

    expect(component.mostrarAddProductForm.emit).toHaveBeenCalled();
  });

  it('buscarProductoCategoria() debería emitir categoría', () => {
    spyOn(component.filtrarCategoria, 'emit');

    component.buscarProductoCategoria('Perfumes');

    expect(component.filtrarCategoria.emit).toHaveBeenCalledWith('Perfumes');
  });

  it('mostrarPedidos() debería emitir verPedidos', () => {
    spyOn(component.verPedidos, 'emit');

    component.mostrarPedidos();

    expect(component.verPedidos.emit).toHaveBeenCalled();
  });

  it('mostrarProductos() debería emitir verProductos', () => {
    spyOn(component.verProductos, 'emit');

    component.mostrarProductos();

    expect(component.verProductos.emit).toHaveBeenCalled();
  });

  it('mostrarConfiguracion() debería emitir verConfg', () => {
    spyOn(component.verConfg, 'emit');

    component.mostrarConfiguracion();

    expect(component.verConfg.emit).toHaveBeenCalled();
  });
});
