import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CarritoComponent } from "../carrito/carrito.component";
import api from '../services/api';

@Component({
  selector: 'app-header-search',
  imports: [CarritoComponent],
  templateUrl: './header-search.component.html',
  styleUrl: './header-search.component.css'
})
export class HeaderSearchComponent {
  @Input() scrollTarget!: HTMLElement;
  @Output() visibilityChange = new EventEmitter<boolean>();
  @Output() search = new EventEmitter<string>();

  visible = true;
  private lastScroll = 0;
  private scrollHandler!: () => void;

  ngAfterViewInit() {
    if (!this.scrollTarget) return;

    this.scrollHandler = () => {
      const currentScroll = this.scrollTarget.scrollTop;

      if (currentScroll > this.lastScroll && currentScroll > 80) {
        this.visible = false; // bajando
      } else {
        this.visible = true;  // subiendo
      }

      this.visibilityChange.emit(this.visible);

      this.lastScroll = currentScroll <= 0 ? 0 : currentScroll;
    };

    this.scrollTarget.addEventListener('scroll', this.scrollHandler);
  }

  ngOnDestroy() {
    if (this.scrollTarget && this.scrollHandler) {
      this.scrollTarget.removeEventListener('scroll', this.scrollHandler);
    }
  }

  private timer: any;

  buscar(event: any) {
    const texto = event.target.value;
    this.search.emit(texto);
  }
}
