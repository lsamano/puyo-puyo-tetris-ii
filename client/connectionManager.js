class ConnectionManager {
  constructor(tetrisManager) {
    this.conn = null;
    this.peers = new Map;
    this.tetrisManager = tetrisManager;
  }

  connect(address) {
    this.conn = new WebSocket(address);

    this.conn.addEventListener('open', event => {
      console.log('Connection established');
      this.initSession();
    });

    this.conn.addEventListener('message', event => {
      console.log('Received message,', event.data);
      this.receive(event.data);
    })
  }

  initSession() {
    const sessionId = window.location.hash.split('#')[1];
    if (sessionId) {
      this.send({
        type: 'join-session',
        id: sessionId
      })
    } else {
      this.send({
        type: 'create-session'
      });
    }
  }

  updateManager(peers) {
    const myId = peers.you;
    const clients = peers.clients.filter(id => myId !== id);
    clients.forEach(id => {
      if (!this.peers.has(id)) {
        const tetris = this.tetrisManager.createPlayer();
        this.peers.set(id, tetris);
      }
    });

    [...this.peers.entries()].forEach(([id, tetris]) => {
      if (clients.indexOf(id) === -1) {
        this.tetrisManager.removePlayer(tetris);
        this.peers.delete(id);
      }
    });

  }

  receive(message) {
    const data = JSON.parse(message)
    if (data.type === 'session-created') {
      window.location.hash = data.id;
    } else if (data.type === 'session-broadcast') {
      this.updateManager(data.peers);
    }
  }

  send(data) {
    const message = JSON.stringify(data);
    console.log(`Sending message ${message}`);
    this.conn.send(message);
  }
}
