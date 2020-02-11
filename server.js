const express = require("express");
const app = express();
const http = require("http").Server(app);
const socketIO = require("socket.io");
const IP = require("./utils.ts");
const port = process.env.PORT || IP.port;
// const server = express()
const server = app.use(express.static("dist")).listen(IP.port, IP.ip, () => {
  console.log("Listening on " + IP.ip + ":" + port);
});
const io = socketIO(server);
//let setEnemyId = new Map();
let setEnemyId = [];
let clientID;
let clientIDs;
let count = 0;
let snakeArr = [];
let enemyColors = [];
let rooms = {};

app.get("/", function(req, res) {
  res.sendFile("dist/", { root: __dirname });
  console.log(res, req);
});

app.get("/:id", function(req, res) {
  let r = req.params.id;
  if (r.includes("game.html")) {
    Array.from(r).splice(0, 8);
  }
  console.log(r);
  rooms = { room: r };
  res.sendFile("dist/game.html", { root: __dirname });
  console.log(rooms);
});

function onConnection(socket) {
  socket.join(rooms.room);
  clientID = socket.client.id.substring(0, 5);
  console.log("Connect ", socket.client.id);
  console.log("Connect ", clientID);
  // console.log("CLIENTID:", clientID);
  // setEnemyId.set(count++, { enemyId: socket.client.id });
  setEnemyId.push(clientID);
  // setEnemyId.filter(item => item !== clientID);
  // console.log("AllIDS:", setEnemyId);

  socket.on("init", msg => {
    socket.emit("init", msg);
    socket.emit("clientId", { id: clientID, room: rooms.room });
    socket.on("enemyId", msg => {
      snakeArr.push(msg);
      console.log("AllIDS:", snakeArr);
      // io.emit("enemyId", setEnemyId);
      //socket.broadcast.emit("enemyId", msg);
      io.emit("enemyId", snakeArr);
      // socket.broadcast.emit("enemyId", snakeArr);
    });
  });
  socket.on("start", msg => {
    // console.log(msg);
    io.emit("start", msg);
  });
  socket.on("snakeColor", color => {
    enemyColors.push(color);
    io.emit("snakeColor", enemyColors);
  });
  socket.on("direction", direction => {
    io.emit("direction", { id: clientID, direction });
  });
  socket.on("enemyDirection", direction => {
    // console.log("ENEMY-DIRECTION-SERVER ", direction);
    socket.broadcast.emit("enemyDirection", direction);
  });
  socket.on("comboFX-friend", enemy => {
    io.emit("comboFX-friend", enemy);
  });
  socket.on("apple", apple => {
    // console.log("APPLE: ", apple);
    io.emit("apple", apple);
  });
  socket.on("snake", snake => {
    // console.log("SNAKE: ", snake);
    socket.emit("snake", snake);
    io.emit("snake", snake);
  });
  socket.on("snakeTick", snake => {
    socket.broadcast.emit("snakeTick", snake);
  });
  socket.on("tail", data => {
    socket.broadcast.emit("tail", data);
  });
  socket.on("leave", msg => {
    // ?
  });
  socket.on("gameover", playerId => {
    console.log("GAME OVER ID:", playerId);
    // snakeArr = snakeArr.filter(i => i.id === socket.client.id);
    snakeArr = snakeArr.filter(i => i.id !== playerId);
    // io.emit("gameover", clientID);
    console.log(snakeArr);
    io.emit("gameover", playerId);
    io.emit("enemyId", snakeArr);
  });

  ///
  socket.on("disconnect", function() {
    let disconnectClientID = socket.client.id.substring(0, 5);
    count = 0;
    socket.broadcast.emit("user disconnected", disconnectClientID);
    // console.log("disconnect ", socket.client.id);
    // console.log("disconnect ", disconnectClientID);
    // console.log(setEnemyId.filter(i => i != socket.client.id));
    // setEnemyId.filter(i => i != socket.client.id);

    // console.log(snakeArr.filter(i => i.id != socket.client.id));
    snakeArr = snakeArr.filter(i => i.id !== disconnectClientID);
    // io.emit("enemyId", snakeArr);
    console.log("SNAKEARR: ", snakeArr);
  });
}

io.on("connection", onConnection);

// http.listen(port, () => console.log("listening on port " + port));
