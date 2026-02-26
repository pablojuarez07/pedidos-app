import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidosPlanillaComponent } from './pedidos-planilla.component';
import { CommonModule } from '@angular/common';

import api from '../services/api';

describe('PedidosPlanillaComponent', () => {
  let component: PedidosPlanillaComponent;
  let fixture: ComponentFixture<PedidosPlanillaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosPlanillaComponent, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PedidosPlanillaComponent);
    component = fixture.componentInstance;
  });

  // ===============================
  // AGRUPAR PEDIDOS
  // ===============================
  it('debería agrupar pedidos por mes correctamente', () => {
    component.pedidos = [
      {
        fecha: new Date(2026, 0, 10).toISOString(), // Enero
        nombre_comprador: 'Juan'
      },
      {
        fecha: new Date(2026, 0, 15).toISOString(), // Enero
        nombre_comprador: 'Pedro'
      },
      {
        fecha: new Date(2026, 1, 1).toISOString(), // Febrero
        nombre_comprador: 'Ana'
      }
    ];

    component.agruparPedidosPorMes();

    expect(component.pedidosPorMes.length).toBe(2);
  });

  // ===============================
  // GET PEDIDOS
  // ===============================
  it('debería traer pedidos desde la API', async () => {
    const mockPedidos = [
      { fecha: '2026-01-01', nombre_comprador: 'Test' }
    ];

    spyOn(api, 'get').and.resolveTo(mockPedidos);

    await component.getPedidos();

    expect(api.get).toHaveBeenCalledWith('/pedidos/planilla');
    expect(component.pedidos.length).toBe(1);
  });

  // ===============================
  // TOGGLE MENU
  // ===============================
  it('debería abrir el menú y calcular posición', () => {
    const pedidoMock: any = {};
    const button = document.createElement('button');

    spyOn(button, 'getBoundingClientRect').and.returnValue({
      top: 100,
      bottom: 120,
      left: 200,
      right: 220,
      width: 20,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => {}
    } as DOMRect);

    const event = {
      stopPropagation: () => {},
      target: button
    } as unknown as MouseEvent;

    component.toggleMenu(pedidoMock, event);

    expect(component.menuAbierto).toBe(pedidoMock);
    expect(pedidoMock._menuTop).toBeDefined();
    expect(pedidoMock._menuLeft).toBeDefined();
  });

  // ===============================
  // CAMBIAR ESTADO
  // ===============================
  it('debería cambiar estado y cerrar menú', async () => {
    const pedidoMock: any = {
      pedido_id: 1,
      estado: 'pendiente'
    };

    spyOn(api, 'post').and.resolveTo({});

    component.menuAbierto = pedidoMock;

    await component.cambiarEstado(pedidoMock, 'entregado');

    expect(api.post).toHaveBeenCalledWith(
      '/pedidos/1/estado',
      { estado: 'entregado' }
    );

    expect(pedidoMock.estado).toBe('entregado');
    expect(component.menuAbierto).toBeNull();
  });

  // ===============================
  // CLICK OUTSIDE
  // ===============================
  it('debería cerrar el menú al hacer click fuera', () => {
    component.menuAbierto = { test: true };

    component.onClickOutside();

    expect(component.menuAbierto).toBeNull();
  });
});
