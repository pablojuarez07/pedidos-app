import { Component, Input, signal, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import api from '../../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-info',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './product-info.component.html',
  styleUrl: './product-info.component.css'
})
export class ProductInfoComponent {
  @Input() producto: any;
  visible = false;
  pedidoExitoso = false;
  errorPedido = '';
  enviando = false;

  form_pedido = signal<FormGroup>(
    new FormGroup ({
      nombre_comprador: new FormControl('', [Validators.required]),
      telefono: new FormControl(''),
      cantidad: new FormControl('', [Validators.required, Validators.min(1)])
    })
  )

  // Se ejecuta cuando llega o cambia el producto
  ngOnChanges(changes: SimpleChanges) {
    if (changes['producto'] && this.producto) {
      const cantidadCtrl = this.form_pedido().get('cantidad');

      cantidadCtrl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(this.producto.stock)
      ]);

      cantidadCtrl?.updateValueAndValidity();
    }
  }

  open() {
    this.visible = true;
  }

  close() {
    this.visible = false;
  }

  async realizarPedido() {
    if (this.form_pedido().invalid) return;

    this.enviando = true;
    this.errorPedido = '';

    try {
      const { nombre_comprador, telefono, cantidad } = this.form_pedido().value;
      const clientId = localStorage.getItem('client_id');

      const request_obj = {
        nombre_comprador,
        telefono,
        cantidad: Number(cantidad),
        producto_id: Number(this.producto.id),
        precio_unitario: Number(this.producto.precio),
        client_id: clientId
      };

      await api.post("/pedidos/add", request_obj);

      // ✅ ÉXITO
      this.pedidoExitoso = true;
      this.form_pedido().reset();

      // cerrar después de 1.5s
      setTimeout(() => {
        this.pedidoExitoso = false;
        this.close();
      }, 1500);

    } catch (err) {
      console.error(err);
      this.errorPedido = 'No se pudo realizar el pedido. Intentá nuevamente.';
    } finally {
      this.enviando = false;
    }
  }

}
