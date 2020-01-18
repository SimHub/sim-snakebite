import "./node_modules/nes.css/css/nes.css";
import "typeface-press-start-2p";
import "bulma/css/bulma.css";
import "bulma-badge/dist/css/bulma-badge.min.css";
import "bulma-tooltip/dist/css/bulma-tooltip.min.css";
import "typeface-orbitron";
import Swal from "sweetalert2";
import nipplejs from "nipplejs";
import "./scss/main.scss";
import Snake from "./game";
import ConnectionManager from "./ConnectionManager";
import IP from "./utils";

const cross = document.querySelector("#cross");
const dialog = document.querySelector("#dialog-dark-rounded");
const canvas = document.querySelector("#canvas");
const startBtn = document.querySelector("#startBtn");
const disconnectBtn = document.querySelector("#disconnect");
const _connectionManager = new ConnectionManager();
let arr = [];

_connectionManager.connect(`http://${IP.pupWlnIp}:${IP.port}`);
const _io = _connectionManager.io();
const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
);
const iPad =
  (/iPad|iPhone|iPod/.test(navigator.platform) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) &&
  !window.MSStream;
let snake = new Snake(canvas, _io);
let joystick;
let isMobile = false;

console.log(iPad, mobile);
// if (
// mobile ||
// iPad
// ) {
// console.log("Is Mobile");
// isMobile = true;
const options = {
  static: {
    zone: document.getElementById("zone_joystick"),
    mode: "static",
    position: {
      left: "50%",
      top: "50%",
      lockX: true, // only move on the X axis
      lockY: true
    },
    color: "red"
  }
};
joystick = nipplejs.create(options);
joystick
  .on("start end", function(evt) {})
  .on("dir:up dir:left dir:down " + " dir:right", function(evt, data) {
    let move = evt.type.split(":")[1];
    // console.log(move);
    snake.joystickControl(move);
  });
// show joystickIcon
// document.querySelector("#joystickIcon").style.display = "block";
// document.querySelector("#keyboardIcon").style.display = "none";
// }

// START SNAKE GAME //
snake.start(isMobile);

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

// cross.addEventListener("click", () => {
// Swal.fire({
// confirmButtonText: "OK!",
// html: ` <p>▲ ◀︎ ▶︎ ▼</p> <br/>
// <div class="info-Box"><span class="combo">combo</span><p style="font-size:1.5em;font-weight:800"> +=12 bites you'll get a suprice ;)</p></div>
// `
// });
// });
