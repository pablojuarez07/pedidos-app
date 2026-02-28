import { CommonModule } from '@angular/common';
import { Component, signal, Output, EventEmitter } from '@angular/core';
import {FormGroup, Validators, FormControl, ReactiveFormsModule} from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import api from '../services/api';

@Component({
  selector: 'app-admin-form',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin-form.component.html',
  styleUrl: './admin-form.component.css',
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0,
        transform: 'scale(0.9)'
      })),
      transition(':enter', [
        animate('200ms ease-out')
      ]),
      transition(':leave', [
        animate('200ms ease-in')
      ])
    ])
  ]
})

export class AdminFormComponent {
  @Output() close = new EventEmitter<void>();
  @Output() logeado = new EventEmitter<void>();
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  admin_form = signal<FormGroup>(
      new FormGroup(
        {
          email: new FormControl('', [Validators.required]), 
          password: new FormControl('', [Validators.required, Validators.minLength(8)]),
        }
      )
  );

  async login() {
    const { email, password } = this.admin_form().value;

    try {
      const res = await api.post("/auth/login", { email: email, password: password });
      localStorage.setItem("token", res.access_token);
      this.close.emit();
      this.logeado.emit();
    } catch (err: any){
      console.error("Error al iniciar sesion: ", err.message)
    }
  }
  
  cerrar() {
    setTimeout(() => {
      this.close.emit();
    }, 200);
  }

}
