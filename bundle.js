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

const container = document.querySelector("#gameBox");
const trophy = document.querySelector("#trophy");
const cross = document.querySelector("#cross");
const dialog = document.querySelector("#dialog-dark-rounded");
const canvas = document.querySelector("#canvas");
const startBtn = document.querySelector("#startBtn");
const disconnectBtn = document.querySelector("#disconnect");
const _connectionManager = new ConnectionManager();
let arr = [];
let joystick;

//### Init socket&snake ###//
_connectionManager.connect(`${IP.http}${IP.pupWlnIp}:${IP.port}`);
const _io = _connectionManager.io();
// let snake = new Snake(container, canvas, _io);
let snake = new Snake({ cnt: container, cnv: canvas, trophy: trophy, io: _io });

// JOYSTICK //
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

//### START SNAKE GAME ###//
snake.start();
//=======================//

//### Game over ###//
_io.on("gameover", _id => {
  console.log("enemy fallen ", _id);
  if (_id === snake.getclientID()) {
    /**
     *[X] - redirect to start site / auto disconnect / if room - can join again same room
     */
    // console.log("enemy fallen id", snake.getclientID());
    // Swal.fire({
    // title: "GAME OVER!",
    // confirmButtonText: "new game",
    // width: 600,
    // padding: "3em",
    // background: "#fff"
    // }).then(result => {
    // if (result.value) {
    // console.log(result.value);
    // let snake = new Snake(canvas, _io);
    // }
    // });
  }
});

