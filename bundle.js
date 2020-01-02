import "./node_modules/nes.css/css/nes.css";
import "typeface-press-start-2p";
import "./scss/main.scss";
import Snake from "./game";
import ConnectionManager from "./ConnectionManager";

const canvas = document.querySelector("#canvas");
const startBtn = document.querySelector("#startBtn");
const disconnectBtn = document.querySelector("#disconnect");
const _connectionManager = new ConnectionManager();
//_connectionManager.connect("http://192.168.2.104:3000");
_connectionManager.connect("http://localhost:3000");
// _connectionManager.connect("/game");
const _io = _connectionManager.io();
let snake = new Snake(canvas, _io);
startBtn.addEventListener("click", function() {
  _io.emit("start", "GAME HAS STARTED");
});
disconnectBtn.addEventListener("click", function() {
  _io.emit("leave", "PLAYER HAS LEFT");
});
