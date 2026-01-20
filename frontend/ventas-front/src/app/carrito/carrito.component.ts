import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import api from '../services/api';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-carrito',
  imports: [CommonModule],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css',
  animations: [
    trigger('panelAnim', [
      transition(':enter', [
        style({
          transform: 'scale(0)',
          opacity: 0
        }),
        animate('320ms cubic-bezier(.25,.8,.25,1)', style({
          transform: 'scale(1)',
          opacity: 1
        }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(.4,0,.6,1)', style({
          transform: 'scale(0)',
          opacity: 0
        }))
      ])
    ])
  ]
})
export class CarritoComponent {
  visible = false;
  pedidos: any[] = [];
  confirmandoId: number | null = null;

  async abrir() {
    this.visible = true;
    await this.cargarPedidos();
  }

  cerrar() {
    this.visible = false;
  }

  confirmar(pedidoId: number) {
    this.confirmandoId = pedidoId;
  }

  cancelarConfirmacion() {
    this.confirmandoId = null;
  }

  async cambiarEstado(pedido: any) {
    const nuevoEstado = pedido.estado === 'cancelado' ? 'pendiente' : 'cancelado';

    try {
      await api.post(`/pedidos/${pedido.id}/estado`, {
        estado: nuevoEstado
      });

      pedido.estado = nuevoEstado; // actualizar UI
      this.confirmandoId = null;
    } catch (e) {
      console.error("Error cambiando estado", e);
    }
  }


  async cargarPedidos() {
    const clientId = localStorage.getItem('client_id');
    if (!clientId) return;

    try {
      this.pedidos = await api.get(`/pedidos/${clientId}`);
    } catch (err) {
      console.error("Error cargando pedidos", err);
    }
  }
}
