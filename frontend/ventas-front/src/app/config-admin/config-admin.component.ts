import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import api from '../services/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-config-admin',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './config-admin.component.html',
  styleUrl: './config-admin.component.css'
})
export class ConfigAdminComponent {
  // MENSAJES
  passwordMsg = '';
  emailMsg = '';
  cierreMsg = '';

  // Cambiar contraseña
  passwordForm = new FormGroup({
    oldPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8)
    ]),
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8)
    ])
  });

  // Cambiar email
  emailForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ])
  });

  // Fecha de cierre
  cierreForm = new FormGroup({
    fechaCierre: new FormControl('', Validators.required)
  });

  async cambiarPassword() {
    this.passwordMsg = '';

    if (this.passwordForm.invalid) {
      this.passwordMsg = 'Completá todos los campos correctamente';
      return;
    }

    try {
      await api.post('/user/change-password', this.passwordForm.value);
      this.passwordMsg = 'Contraseña actualizada correctamente';
      this.passwordForm.reset();
    } catch (err: any) {
      this.passwordMsg = err?.message || 'Error al cambiar contraseña';
    }
  }

  async cambiarEmail() {
    this.emailMsg = '';

    if (this.emailForm.invalid) {
      this.emailMsg = 'Ingresá un email válido';
      return;
    }

    try {
      await api.post('/user/change-email', this.emailForm.value);
      this.emailMsg = 'Email actualizado correctamente';
      this.emailForm.reset();
    } catch (err: any) {
      this.emailMsg = err?.menssage || 'Error al actualizar email';
    }
  }

  async cambiarFechaCierre() {
    this.cierreMsg = '';

    if (this.cierreForm.invalid) {
      this.cierreMsg = 'Seleccioná una fecha';
      return;
    }

    try {
      await api.post('/user/change-cierre', {
        cierreCampania: this.cierreForm.value.fechaCierre
      });

      this.cierreMsg = 'Fecha de cierre actualizada';
    } catch (err: any) {
      this.cierreMsg = err?.menssage || 'Error al actualizar fecha';
    }
  }
}
