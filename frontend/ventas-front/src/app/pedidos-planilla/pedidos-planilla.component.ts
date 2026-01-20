import { Component, HostListener } from '@angular/core';
import api from '../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pedidos-planilla',
  imports: [CommonModule],
  templateUrl: './pedidos-planilla.component.html',
  styleUrl: './pedidos-planilla.component.css'
})
export class PedidosPlanillaComponent {
  pedidos: any[] = [];
  pedidosPorMes: {
    mes: string;
    pedidos: any[];
  }[] = [];
  menuAbierto: any = null;

  ngOnInit() {
    this.getPedidos();
  }

  async getPedidos(){
    try{
      const data = await api.get("/pedidos/planilla");
      this.pedidos = data;
      this.agruparPedidosPorMes();
    } catch (err) {
      console.error("error al traer pedidos: ", err)
    }
  }

  agruparPedidosPorMes() {
    const grupos: { [key: string]: any[] } = {};

    this.pedidos.forEach(pedido => {
      const fecha = new Date(pedido.fecha);

      const mesClave = fecha.toLocaleString('es-AR', {
        month: 'long',
        year: 'numeric'
      });

      if (!grupos[mesClave]) {
        grupos[mesClave] = [];
      }

      grupos[mesClave].push(pedido);
    });

    // Convertimos a array para el *ngFor
    this.pedidosPorMes = Object.keys(grupos).map(mes => ({
      mes,
      pedidos: grupos[mes]
    }));
  }

  toggleMenu(pedido: any, event: MouseEvent) {
    event.stopPropagation();

    const btn = event.target as HTMLElement;
    const rect = btn.getBoundingClientRect();

    const menuWidth = 170;
    const menuHeight = 120;
    const margin = 10;

    let top = rect.bottom + margin;
    let left = rect.right - menuWidth;

    // Si se sale abajo → subirlo
    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - margin;
    }

    // Si se sale a la derecha → moverlo a la izquierda
    if (left + menuWidth > window.innerWidth) {
      left = rect.left - menuWidth - margin;
    }

    // Si se sale a la izquierda
    if (left < margin) {
      left = margin;
    }

    pedido._menuTop = top + window.scrollY;
    pedido._menuLeft = left + window.scrollX;

    this.menuAbierto = pedido;
  }


  async cambiarEstado(pedido: any, nuevoEstado: string) {
    try {
      await api.post(`/pedidos/${pedido.pedido_id}/estado`, {
        estado: nuevoEstado
      });

      pedido.estado = nuevoEstado; // reflejar en UI
      this.menuAbierto = null;

    } catch (e) {
      console.error("Error cambiando estado", e);
    }
  }
  @HostListener('document:click')
  onClickOutside() {
    this.menuAbierto = null;
  }
}
