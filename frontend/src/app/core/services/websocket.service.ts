import { Injectable, signal } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface NotificacionVisita {
  idVisita: number;
  idPredio: number;
  claveCatastralPredio: string;
  propietarioPredio: string;
  nombreVisitador: string;
  estadoVisita: string;
  fechaVisita: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client | null = null;
  notificaciones = signal<NotificacionVisita[]>([]);
  conectado = signal(false);

  connect() {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.conectado.set(true);
        this.client?.subscribe('/topic/visitas', (message: Message) => {
          const notif: NotificacionVisita = JSON.parse(message.body);
          this.notificaciones.update(prev => [notif, ...prev].slice(0, 50));
        });
      },
      onDisconnect: () => {
        this.conectado.set(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        this.conectado.set(false);
      }
    });

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
    this.conectado.set(false);
  }

  getNotificaciones() {
    return this.notificaciones();
  }

  clearNotificaciones() {
    this.notificaciones.set([]);
  }
}
