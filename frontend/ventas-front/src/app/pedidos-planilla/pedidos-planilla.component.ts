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

  isMobile = window.innerWidth < 768;

  // Ancho de cada columna en píxeles (ajustar según diseño)
  columnWidths: number[] = [125, 208, 135, 80, 122, 119, 106, 135, 80, 150]
  // genera grid dinamico
  get columnas(): string {
    return this.columnWidths.map(w => w + 'px').join(' ');
  }

  startX = 0;
  startWidth = 0;
  colIndex = 0;

  ngOnInit() {
    this.isMobile = window.innerWidth < 768;

    if (this.isMobile) {
      this.columnWidths = [125, 208, 135, 80, 122, 119, 106, 135, 80, 150];
    }

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

  startResize(event: MouseEvent, index: number) {
    event.stopPropagation();
    event.preventDefault();

    this.startX = event.clientX;
    this.startWidth = this.columnWidths[index];
    this.colIndex = index;

    document.addEventListener('mousemove', this.onResize);
    document.addEventListener('mouseup', this.stopResize);
  }

  onResize = (event: MouseEvent) => {
    const diff = event.clientX - this.startX;
    this.columnWidths[this.colIndex] = Math.max(60, this.startWidth + diff);
  };

  stopResize = () => {
    document.removeEventListener('mousemove', this.onResize);
    document.removeEventListener('mouseup', this.stopResize);
  };
}
