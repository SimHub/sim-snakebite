import io from 'socket.io-client';

export default class ConnectionManager {
  private conn: any;

  constructor() {
    this.conn = null;
  }
  connect(url) {
    this.conn = io(url);
    this.conn.emit('init', 'client-ready');
    this.conn.on('init', msg => console.log(msg));
  }
  io() {
    return this.conn;
  }
}
