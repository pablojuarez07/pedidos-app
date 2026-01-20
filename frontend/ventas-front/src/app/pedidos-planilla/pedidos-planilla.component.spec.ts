import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosPlanillaComponent } from './pedidos-planilla.component';

describe('PedidosPlanillaComponent', () => {
  let component: PedidosPlanillaComponent;
  let fixture: ComponentFixture<PedidosPlanillaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosPlanillaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosPlanillaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
