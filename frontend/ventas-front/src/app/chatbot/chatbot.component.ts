import { Component } from '@angular/core';
import api from '../services/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

interface Mensaje {
  tipo: 'usuario' | 'bot';
  texto?: string;
  pedidos?: {
    lista: any[];
    filtros: any;
  }[];
  resultados?: {
    tipo: string;
    valor: number;
    filtros: any;
  }[];
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('chatAnimation', [
      transition(':enter', [
        style({
          transform: 'scale(0.2)',
          opacity: 0,
          transformOrigin: 'bottom right'
        }),
        animate('250ms cubic-bezier(.4,0,.2,1)',
          style({
            transform: 'scale(1)',
            opacity: 1
          })
        )
      ]),
      transition(':leave', [
        animate('200ms ease-in',
          style({
            transform: 'scale(0.2)',
            opacity: 0,
            transformOrigin: 'bottom right'
          })
        )
      ])
    ])
  ]
})
export class ChatbotComponent {

  abierto = false;
  mensajeInput = '';
  mensajes: Mensaje[] = [];
  client_id = localStorage.getItem('client_id') || null;

  toggleChat() {
    this.abierto = !this.abierto;

    if (this.abierto && this.mensajes.length === 0) {
      this.mensajes.push({
        tipo: 'bot',
        texto: `👋 Hola, soy tu asistente de pedidos.
            Puedo ayudarte a:
            • Listar tus pedidos
            • Contar pedidos por mes, año o estado
            • Calcular cuánto gastaste en un período
            
            Probá escribiendo: "Mis pedidos", "Cuánto gasté este mes" o "Pedidos entregados en 2025".`
      });
    }
  }

  async enviarMensaje() {
    if (!this.mensajeInput.trim()) return;

    const textoUsuario = this.mensajeInput;

    // Mostrar mensaje del usuario
    this.mensajes.push({
      tipo: 'usuario',
      texto: textoUsuario
    });

    this.mensajeInput = '';
    try {
      const res = await api.post('/chat', { mensaje: textoUsuario, client_id: this.client_id });

      console.log('Respuesta del chatbot:', res);

      this.mensajes.push({
        tipo: 'bot',
        texto: Array.isArray(res.respuestas)
          ? res.respuestas.join('\n')
          : res.error || 'Error',
        pedidos: res.pedidos || [],
        resultados: res.resultados || []
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      this.mensajes.push({
        tipo: 'bot',
        texto: 'Ocurrió un error al procesar tu solicitud.'
      });
    }
  }
}