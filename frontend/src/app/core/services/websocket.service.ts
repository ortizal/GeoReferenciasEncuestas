import { Injectable, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
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

export interface ImportProgress {
  sessionId: string;
  current: number;
  total: number;
  rowKey: string;
  rowStatus: string;
  imported: number;
  updated: number;
  duplicated: number;
  errors: number;
  notFound: number;
  autoCreated: number;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client | null = null;
  notificaciones = signal<NotificacionVisita[]>([]);
  conectado = signal(false);
  private subscriptions = new Map<string, StompSubscription>();

  connect() {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/api/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.conectado.set(true);
        this.client?.subscribe('/topic/visitas', (message: IMessage) => {
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
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions.clear();
    this.client?.deactivate();
    this.conectado.set(false);
  }

  subscribeToImportProgress(sessionId: string, callback: (msg: ImportProgress) => void): () => void {
    if (!this.client?.active) {
      this.connect();
    }

    const topic = `/topic/import-progress/${sessionId}`;
    const checkAndSubscribe = () => {
      if (this.client?.active) {
        const sub = this.client.subscribe(topic, (message: IMessage) => {
          const msg: ImportProgress = JSON.parse(message.body);
          callback(msg);
        });
        this.subscriptions.set(topic, sub);
      } else {
        setTimeout(checkAndSubscribe, 100);
      }
    };
    checkAndSubscribe();

    return () => {
      const sub = this.subscriptions.get(topic);
      if (sub) {
        sub.unsubscribe();
        this.subscriptions.delete(topic);
      }
    };
  }

  getNotificaciones() {
    return this.notificaciones();
  }

  clearNotificaciones() {
    this.notificaciones.set([]);
  }
}
