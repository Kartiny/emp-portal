// Simple WebSocket utility for discuss integration
export type WebSocketMessageHandler = (data: any) => void;

export class DiscussWebSocket {
  private socket: WebSocket | null = null;
  private url: string;
  private messageHandler: WebSocketMessageHandler;

  constructor(url: string, messageHandler: WebSocketMessageHandler) {
    this.url = url;
    this.messageHandler = messageHandler;
  }

  connect() {
    this.socket = new WebSocket(this.url);
    this.socket.onopen = () => {
      // Connection established
    };
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandler(data);
      } catch (e) {
        // Handle parse error
      }
    };
    this.socket.onerror = (event) => {
      // Handle error
    };
    this.socket.onclose = () => {
      // Handle close
    };
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
} 