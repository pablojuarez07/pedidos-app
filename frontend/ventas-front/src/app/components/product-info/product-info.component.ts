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
      cantidad: new FormControl('', [Validators.required, Validators.min(1)]),
      tipo_pago: new FormControl('', [Validators.required])
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
    this.form_pedido().reset();
  }

  async realizarPedido() {
    if (this.form_pedido().invalid) return;
    this.enviando = true;
    this.errorPedido = '';

    try {
      const { nombre_comprador, telefono, cantidad, tipo_pago } = this.form_pedido().value;
      const clientId = localStorage.getItem('client_id');

      const request_obj = {
        product_name: this.producto.nombre,
        nombre_comprador,
        telefono,
        cantidad: Number(cantidad),
        producto_id: Number(this.producto.id),
        precio_unitario: Number(this.producto.precio),
        client_id: clientId,
        tipo_pago
      };

      // EFECTIVO
      if (tipo_pago === 'efectivo') {
        await api.post("/pedidos/add", request_obj);

        this.pedidoExitoso = true;
        this.form_pedido().reset();

        setTimeout(() => {
          this.pedidoExitoso = false;
          this.close();
        }, 1500);
      }

      // MERCADO PAGO
      if (tipo_pago === 'mercadopago') {
        const res = await api.post("/pagos/crear-preferencia", request_obj);

        // REDIRECCIÓN
        window.location.href = res.init_point;
      }

    } catch (err) {
      console.error(err);
      this.errorPedido = 'No se pudo realizar el pedido. Intentá nuevamente.';
    } finally {
      this.enviando = false;
    }
  }

  isOpen = false;
  selectedType: String | null = null;

  selectPago(type: string) {
    this.selectedType = (type == "efectivo") ? "Efectivo" : "Mercado Pago";
    this.form_pedido().get('tipo_pago')?.setValue(type);
  }

  toggleSelect() {
    this.isOpen = !this.isOpen;
  }
}
