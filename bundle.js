import "typeface-orbitron";
import "bulma/css/bulma.css";
import "bulma-badge/dist/css/bulma-badge.min.css";
import "./node_modules/nes.css/css/nes.css";
import "typeface-press-start-2p";
import Swal from "sweetalert2";
import "./scss/main.scss";
import Snake from "./game";
import ConnectionManager from "./ConnectionManager";
import IP from "./utils";

const canvas = document.querySelector("#canvas");
const startBtn = document.querySelector("#startBtn");
const disconnectBtn = document.querySelector("#disconnect");
const _connectionManager = new ConnectionManager();
let arr = [];

_connectionManager.connect(`http://${IP.pupWlnIp}:${IP.port}`);
const _io = _connectionManager.io();
let snake = new Snake(canvas, _io);
_io.on("gameover", _id => {
  console.log("enemy fallen ", _id);
  if (_id !== snake.getclientID()) {
    console.log("enemy fallen id", snake.getclientID());
    Swal.fire({
      title: "GAME OVER!",
      confirmButtonText: "new game",
      width: 600,
      padding: "3em",
      background: "#fff"
    }).then(result => {
      if (result.value) {
        console.log(result.value);
        let snake = new Snake(canvas, _io);
      }
    });
  }
});
// startBtn.addEventListener("click", function() {
// _io.emit("start", "GAME HAS STARTED");
// });
// disconnectBtn.addEventListener("click", function() {
// _io.emit("leave", "PLAYER HAS LEFT");
// });
