import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderSearchComponent } from './header-search.component';

describe('HeaderSearchComponent', () => {
  let component: HeaderSearchComponent;
  let fixture: ComponentFixture<HeaderSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderSearchComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderSearchComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  // ================= SEARCH =================

  it('debería emitir evento search al escribir', () => {
    spyOn(component.search, 'emit');

    const mockEvent = {
      target: { value: 'vino' }
    };

    component.buscar(mockEvent);

    expect(component.search.emit).toHaveBeenCalledWith('vino');
  });

  // ================= SCROLL BEHAVIOR =================

  it('debería ocultarse al hacer scroll hacia abajo', () => {
    const mockElement = document.createElement('div');
    component.scrollTarget = mockElement;

    spyOn(component.visibilityChange, 'emit');

    fixture.detectChanges(); // registra listener

    // Mockear scrollTop controlado
    let scrollValue = 0;
    spyOnProperty(mockElement, 'scrollTop', 'get').and.callFake(() => scrollValue);

    // Scroll inicial
    scrollValue = 10;
    mockElement.dispatchEvent(new Event('scroll'));

    // Scroll hacia abajo real
    scrollValue = 120;
    mockElement.dispatchEvent(new Event('scroll'));

    expect(component.visible).toBeFalse();
    expect(component.visibilityChange.emit).toHaveBeenCalledWith(false);
  });

  it('debería mostrarse al hacer scroll hacia arriba', () => {
    const mockElement = document.createElement('div');

    component.scrollTarget = mockElement;

    spyOn(component.visibilityChange, 'emit');

    fixture.detectChanges();

    // Simular primer scroll abajo
    mockElement.scrollTop = 120;
    mockElement.dispatchEvent(new Event('scroll'));

    // Ahora subir
    mockElement.scrollTop = 20;
    mockElement.dispatchEvent(new Event('scroll'));

    expect(component.visible).toBeTrue();
    expect(component.visibilityChange.emit).toHaveBeenCalledWith(true);
  });

  // ================= DESTROY =================

  it('debería remover el listener en ngOnDestroy', () => {
    const mockElement = document.createElement('div');
    component.scrollTarget = mockElement;

    fixture.detectChanges();

    const removeSpy = spyOn(mockElement, 'removeEventListener');

    component.ngOnDestroy();

    expect(removeSpy).toHaveBeenCalledWith('scroll', jasmine.any(Function));
  });
});
