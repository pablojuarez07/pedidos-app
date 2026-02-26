import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductPromoComponent } from './product-promo.component';
import { SocketService } from '../../services/socket';

describe('ProductPromoComponent', () => {
  let component: ProductPromoComponent;
  let fixture: ComponentFixture<ProductPromoComponent>;

  const mockSocketService = {
    listen: jasmine.createSpy().and.returnValue({
      subscribe: jasmine.createSpy()
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductPromoComponent],
      providers: [
        { provide: SocketService, useValue: mockSocketService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPromoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse', () => {
    expect(component).toBeTruthy();
  });

  it('rebuildLoop debería construir correctamente productosLoop', () => {
    component.productos = [
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ];

    component.rebuildLoop();

    expect(component.productosLoop.length).toBe(5);
    expect(component.productosLoop[0].id).toBe(3);
    expect(component.productosLoop[4].id).toBe(1);
    expect(component.index).toBe(1);
  });

  it('transform debería devolver translate correcto', () => {
    component.index = 2;
    expect(component.transform).toBe('translateX(-200%)');
  });

  it('next debería incrementar index si no está animando', () => {
    component.index = 1;
    component.isAnimating = false;

    component.next();

    expect(component.index).toBe(2);
    expect(component.isAnimating).toBeTrue();
  });

  it('next NO debería ejecutar si ya está animando', () => {
    component.index = 1;
    component.isAnimating = true;

    component.next();

    expect(component.index).toBe(1);
  });

  it('swipe izquierda debería llamar next()', () => {
    spyOn(component, 'next');

    component.touchStartX = 200;
    component.touchEndX = 100;

    component.onTouchEnd();

    expect(component.next).toHaveBeenCalled();
  });
});

