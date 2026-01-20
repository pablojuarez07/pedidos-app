import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;

  connect() {
    // Conectamos al backend (cambiá el puerto si tu backend usa otro)
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'], // asegura conexión estable
    });

    this.socket.on('connect', () => {
      console.log('Conectado al servidor WebSocket con id:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor WebSocket');
    });
  }

  // Escuchar un evento (por ejemplo: "nuevo_mensaje")
  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        subscriber.next(data);
      });
    });
  }

  // Emitir un evento al backend
  emit(eventName: string, data: any) {
    this.socket.emit(eventName, data);
  }

  // Cerrar la conexión
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
