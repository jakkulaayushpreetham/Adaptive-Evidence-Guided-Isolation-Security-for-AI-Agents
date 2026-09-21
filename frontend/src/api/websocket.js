export class SOCWebSocket {
  constructor(onMessage, onStatusChange) {
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;
    this.socket = null;
    this.reconnectTimer = null;
    this.isConnected = false;
    this.hasReportedOutage = false;
  }

  connect() {
    if (
      this.socket
      && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/soc`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.hasReportedOutage = false;
        if (this.onStatusChange) this.onStatusChange(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMessage) this.onMessage(data);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        if (this.onStatusChange) this.onStatusChange(false);
        this.reconnect();
      };

      this.socket.onerror = (err) => {
        if (!this.hasReportedOutage) {
          console.info('Live backend connection unavailable; retrying in the background.');
          this.hasReportedOutage = true;
        }
        this.socket?.close();
      };
    } catch (e) {
      this.reconnect();
    }
  }

  reconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;

    const socket = this.socket;
    this.socket = null;
    if (!socket) return;

    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = () => {};

    if (socket.readyState === WebSocket.OPEN) {
      socket.close(1000, 'Client disconnected');
    } else if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = () => socket.close(1000, 'Client disconnected');
    }
  }
}
