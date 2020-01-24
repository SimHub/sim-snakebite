import SnakePlayer from "./snake";
interface snakeProps {
  cnt: HTMLElement;
  cnv: HTMLCanvasElement;
  trophy?: HTMLElement;
  io: object;
}
export default class Snake {
  private socket: object;
  private canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private trophy: HTMLElement;
  private direction: string;
  // private enemyDirection: string;
  private directionLock: boolean;
  private xEnd: number;
  private yEnd: number;
  private clientId: string;
  // private enemyId: [] | string;
  private posX: number;
  private posY: number;
  // private snl: any;
  private FPS: number;
  private snake: any;
  private snakeColor: string;
  private newEnemyIDs: [];
  private enemyColors: [];
  private snakeEnemies: any;
  private size: number;
  private appleSize: number;
  private apple: {};
  private specialBite: {};
  private speed: number;
  private container: HTMLElement;
  private gradient: object;
  private combo: HTMLElement;
  private comboTitle: HTMLElement;
  private comboFX: string;
  private destroyerImg: HTMLImageElement = new Image();
  private friendImg: HTMLImageElement = new Image();
  private timer:function (...args: any) => any;
  private setComboFX:function (...args: any) => any;

  // public //
  public score: number;
  public comboScore: number;
  public isPaused: boolean;

  constructor(sn: snakeProps) {
    // console.log(sn);
    this.combo = document.querySelector("#combo");
    this.comboTitle = document.querySelector("#comboTitle");
    this.comboFX = null;

    // this.destroyerImg = new Image();
    // this.destroyerImg.src = require("./img/tron_blue.png");
    this.destroyerImg.src = require("./img/destroyer.png");
    this.friendImg.src = require("./img/friend.png");

    this.socket = sn.io;
    this.trophy = sn.trophy;
    this.container = sn.cnt;
    this.canvas = sn.cnv;
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;

    this.context = this.canvas.getContext("2d");
    this.context.fillStyle = "white";
    this.size = Math.round(this.canvas.width / 50);
    this.appleSize = Math.round(this.canvas.width / 50);
    this.xEnd = Math.round(this.canvas.width / this.size) * this.size;
    this.yEnd = Math.round(this.canvas.height / this.size) * this.size;

    console.log(this.size);
    // console.log(this.socket);

    this.FPS = 60;
    this.score = 0;
    this.comboScore = 0;
    this.isPaused = false;
    this.clientId = null;
    // this.enemyId = null;
    this.directionLock = false;
    this.direction = this.getRandomDirection();
    // this.posX = Math.floor(Math.random() * this.canvas.width);
    // this.posY = Math.floor(Math.random() * this.canvas.height);
    this.posX =
      Math.round(
        this.random(this.size, this.canvas.width - this.size) / this.size
      ) * this.size;
    this.posY =
      Math.round(
        this.random(this.size, this.canvas.height - this.size) / this.size
      ) * this.size;
    this.enemyColors = [];
    this.snakeColor = this.getRandomColor();
    this.snake = new SnakePlayer(
      this.posX,
      this.posY,
      null,
      this.snakeColor,
      this.comboFX,
      this.direction
    ).snake();
    this.socket.emit("snakeColor", this.snake[0].color);
    this.socket.on("snakeColor", colors => {
      this.enemyColors = colors;
    });
    // console.log(this.snake[0].color);
    this.snakeEnemies = new Set();
    this.apple = {};
    this.specialBite = {};
    // this.enemyDirection = "left";
    this.speed = 200;
    this.newEnemyIDs = [];
    this.enemyChange = false;

    /// socket con ///
    this.socket.on("clientId", id => {
      this.clientId = id;
      this.snake[0].id = this.clientId;
      this.socket.emit("enemyId", this.snake[0]);
    });

    this.socket.on("enemyId", id => {
      // console.log(this.snakeColor);
      // console.log(this.enemyColors);
      this.snakeEnemies.clear();
      this.newEnemyIDs = id;
      [...this.newEnemyIDs].forEach(_id => {
        // console.log(_id);
        if (_id.id !== this.clientId) {
          let snl = new SnakePlayer(
            _id.x,
            _id.y,
            _id.id,
            _id.color,
            _id.comboFX,
            _id.direction
          ).enemySnake();
          this.snakeEnemies.add(snl);
        }
      });
      // console.log("new enemy - ", this.snakeEnemies);
    });

    this.socket.on("enemyDirection", data => {
      this.snakeEnemies.forEach((i, k) => {
        if (i[0].enemyId === data.id) {
          i[0].direction = data.direction;
        }
      });
    });

    this.socket.on("snakeTick", enemy => {
      let newEnemy = enemy.snake;
      newEnemy[0].id = enemy.id;
      newEnemy[0].enemyId = enemy.id;
      delete newEnemy[0].id;

      this.snakeEnemies.forEach((i, k) => {
        if (newEnemy[0].enemyId === i[0].enemyId) {
          newEnemy[0].color = i[0].color;
          for (let j = 0; j < newEnemy.length; j++) {
            i[j] = newEnemy[j];
          }
        }
      });
      // console.log('ENEMY ARR OUTSIDE', this.snakeEnemies);
    });
    this.socket.on("apple", a => {
      this.apple = a.apple;
      this.specialBite = a.specialBite;
    });

    this.socket.on("user disconnected", enemyID => {
      console.log("someone has gone ", enemyID);
      this.snakeEnemies.forEach(enemy => {
        console.log(enemy[0].enemyId, enemyID);
        if (enemy[0].enemyId === enemyID) {
          console.log(enemy[0].enemyId === enemyID);
          console.log(enemy);
          this.snakeEnemies.delete(enemy);
          console.log(this.snakeEnemies);
        }
      });
      console.log(this.snakeEnemies);
    });

    //#### START GAME ####/
    // this.socket.on('start', data => {
    // const startBtn: HTMLElement = document.querySelector('#startBtn');
    // startBtn.style.display = 'none';
    // this.start();
    // });
  }
  random(min, max) {
    return Math.random() * (max - min) + min;
  }
  start() {
    this.setApple(); // SET APPLE
    window.addEventListener("keydown", e => this.keyDown(e));
    window.setTimeout(() => {
      this.tick(), this.speed;
    }, 1000 / this.FPS); // LOOP
    window.requestAnimationFrame(() => this.draw());
    // window.addEventListener("resize", () => this.resize());
  }

  setApple() {
    this.apple.x = this.applePosition().x;
    this.apple.y = this.applePosition().y;
    this.specialBite.x = this.applePosition().x;
    this.specialBite.y = this.applePosition().y;
    this.socket.emit("apple", {
      apple: this.apple,
      specialBite: this.specialBite
    });
  }
  draw() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // APPLE ///
    this.context.fillStyle = "red";
    this.context.fillRect(this.apple.x, this.apple.y, this.size, this.size);
    this.context.clearRect(
      this.apple.x + 1.4,
      this.apple.y + 1.4,
      this.size - 2.7,
      this.size - 2.7
    );
    /////////

    ///SPECIAL BITE//////
    this.context.fillStyle = "white";
    this.context.shadowBlur = 50;
    this.context.fillRect(
      this.specialBite.x,
      this.specialBite.y,
      this.size,
      this.size
    );
    /////////

    //  ENEMY /////
    this.snakeEnemies.forEach((enemy, k) => {
      for (let i = 0; i < enemy.length; i += 1) {
        const s = enemy[i];


      this.setComboFX(s.comboFX,s,i);


        // this.context.fillStyle = s.color;
        // this.context.fillRect(s.x, s.y, this.size, this.size);
        // if (s.comboFX === "immortal") {
          // this.context.lineCap = "round"; //,'round','square'];
          // this.context.fillStyle = "rgba(255,255,255," + (i + 1) / 10 + ")";
          // for (let j = 0; j < s.length; j++) {
            // this.context.fillRect(s.x, s.y, this.size - 1, this.size - 1);
          // }
        // }
      }
    });
    ///////

    /// PLAYER /////
    for (let i = 0; i < this.snake.length; i += 1) {
      const s = this.snake[i];


      this.setComboFX(s.comboFX,s,i);
      // this.context.drawImage(
      // this.destroyerImg,
      // s.x,
      // s.y,
      // this.size,
      // this.size + 3
      // );

      // switch (this.comboFX) {
        // case "destroyer":
          // this.context.shadowBlur = 8;
          // this.context.shadowColor = "red";
          // this.context.shadowOffsetX = 0;
          // this.context.shadowOffsetY = 0;
          // this.context.lineWidth = 2;
          // this.context.strokeStyle = "red";
          // this.context.strokeRect(s.x, s.y, this.size, this.size);
          // this.context.fillStyle = s.color;
          // this.context.fillRect(s.x, s.y, this.size, this.size);
          // break;
        // case "friend":
          // this.context.shadowBlur = 8;
          // this.context.shadowColor = "white";
          // this.context.shadowOffsetX = 0;
          // this.context.shadowOffsetY = 0;
          // this.context.lineWidth = 2;
          // this.context.strokeStyle = "white";
          // this.context.strokeRect(s.x, s.y, this.size, this.size);
          // this.context.fillStyle = s.color;
          // this.context.fillRect(s.x, s.y, this.size, this.size);
          // break;
        // case "immortal":
          // this.context.lineCap = "round"; //,'round','square'];
          // this.context.fillStyle = "rgba(255,255,255," + (i + 1) / 10 + ")";
          // for (let j = 0; j < 4; j++) {
            // this.context.fillRect(s.x, s.y, this.size - 1, this.size - 1);
          // }
          // break;
        // default:
          // this.context.fillStyle = s.color;
          // this.context.fillRect(s.x, s.y, this.size, this.size);
      // }

      //*------------*\
      // this.context.fillStyle = s.color;
      // this.context.fillRect(s.x, s.y, this.size, this.size);
      // if (this.snake[0].comboFX === "immortal") {
      // this.context.lineCap = "round"; //,'round','square'];
      // this.context.fillStyle = "rgba(255,255,255," + (i + 1) / 10 + ")";
      // for (let j = 0; j < 4; j++) {
      // this.context.fillRect(s.x, s.y, this.size - 1, this.size - 1);
      // }
      // }
    }
    ///////////////

    if (!this.isPaused) window.requestAnimationFrame(() => this.draw());
  } // end draw

  tick() {
    for (let i = this.snake.length - 1; i >= 0; i--) {
      if (
        i == 0 &&
        this.snake[i].x === this.apple.x &&
        this.snake[i].y === this.apple.y
      ) {
        this.snake.push({});

        //** Todo : enemy tail logic

        this.speed *= 0.99;
        this.setApple();
        // const c = document.createElement('i');
        // console.log('PLAYER GOT APPLE', this.snake[i]);
        this.score++;
        this.comboScore++;
        this.appleBiteScore();
      }
      const s = this.snake[i];
      if (i == 0) {
        switch (this.direction) {
          case "right":
            if (s.x > this.canvas.width) s.x = 0;
            else s.x += this.size;
            break;
          case "down":
            if (s.y > this.canvas.height) s.y = 0;
            else s.y += this.size;
            break;
          case "left":
            if (s.x < 0) s.x = this.xEnd;
            else s.x -= this.size;
            break;
          case "up":
            if (s.y < 0) s.y = this.yEnd;
            else s.y -= this.size;
        }

        if (this.comboFX !== "immortal") {
          for (let j = 1; j < this.snake.length; j += 1) {
            if (
              this.snake[0].x === this.snake[j].x &&
              this.snake[0].y === this.snake[j].y
            ) {
              // alert("GAME OVER");
              this.socket.emit("gameover", this.snake[0]);
              // window.location.reload();
            }
          }
        }
      } else {
        this.snake[i].x = this.snake[i - 1].x;
        this.snake[i].y = this.snake[i - 1].y;

        // this.socket.emit('tail', this.snake);
        ///** Todo : enemy tail logic
      }
    }

    // this.socket.emit('snakeTick', this.snake[0]);
    this.socket.emit("snakeTick", { id: this.snake[0].id, snake: this.snake });

    window.setTimeout(() => this.tick(), this.speed);
    this.directionLock = false;
  }
  joystickControl(newDirection) {
    // console.log("logMobileDir: ", newDirection);
    if (!this.directionLock) {
      this.directionLock = true;

      let h = ["left", "right", "up", "down"];

      if (h.includes(newDirection)) {
        if (this.direction === "left" && newDirection !== "right") {
          this.direction = newDirection;
        }
        if (this.direction === "up" && newDirection !== "down") {
          this.direction = newDirection;
        }
        if (this.direction === "down" && newDirection !== "up") {
          this.direction = newDirection;
        }
        if (this.direction === "right" && newDirection !== "left") {
          this.direction = newDirection;
        }
      }
    }
  }
  keyDown(e) {
    if (!this.directionLock) {
      this.directionLock = true;
      const newDirection = e.key.substr(5).toLowerCase();

      let h = ["left", "right", "up", "down"];

      if (e.key === " ") {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
          this.draw();
        }
        // console.log(this.isPaused);
      }
      if (h.includes(newDirection)) {
        if (this.direction === "left" && newDirection !== "right") {
          this.direction = newDirection;
        }
        if (this.direction === "up" && newDirection !== "down") {
          this.direction = newDirection;
        }
        if (this.direction === "down" && newDirection !== "up") {
          this.direction = newDirection;
        }
        if (this.direction === "right" && newDirection !== "left") {
          this.direction = newDirection;
        }
      }
    }
  }
  getclientID() {
    return this.clientId;
  }
  appleBiteScore() {
    this.combo.value = ((100 * this.comboScore) / 12).toFixed(0);
    // if (this.combo.value == 17) {
    if (this.combo.value == 17) {
      this.combo.style.animation = "combo 1s ease-in-out infinite";
      this.comboScore = 0;
      this.comboActivateEffect();
      this.snake[0].comboFX = this.comboFX;
      this.comboTitle.innerText = this.comboFX;
      // console.log("COMBO FX: ", this.comboFX);

    this.timer =   setTimeout(() => {
        this.combo.style.animation = "";
        this.combo.value = 0;
        this.comboTitle.innerText = "combo";
        this.comboFX = null;
        this.snake[0].comboFX = this.comboFX;
        clearTimeout(this.timer);
      }, 20000);
    }
    this.trophy.innerText = this.score;
    // console.log(this.trophy.getAttribute("data-badge"));
  }
  resize() {
    // console.log('RESIZE');
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.xEnd = Math.round(this.canvas.width / this.size) * this.size;
    this.yEnd = Math.round(this.canvas.height / this.size) * this.size;

    this.setApple();
    this.draw();
  }
  getRandomDirection() {
    let items = ["up", "down", "left", "right"];
    return items[Math.floor(Math.random() * items.length)];
  }
  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let _hash = [
      "#9727F5",
      "#FF0000",
      "#722416",
      "#9E2574",
      "#4F0BCD",
      "#000000"
    ];
    var color = "#";
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    // console.log(color + " _");
    // console.log(this.enemyColors.length);
    if (
      _hash.includes(color) || this.enemyColors !== 0
        ? this.enemyColors.includes(color)
        : null
    ) {
      // console.log("FORBIDDEN COLOR");
      this.getRandomColor();
    } else {
      // console.log("GOOD COLOR");
      return color;
    }
  }
  setComboFX(comboFX,s,i){
      switch (comboFX) {
        case "destroyer":
          this.context.shadowBlur = 8;
          this.context.shadowColor = "red";
          this.context.shadowOffsetX = 0;
          this.context.shadowOffsetY = 0;
          this.context.lineWidth = 2;
          this.context.strokeStyle = "red";
          this.context.strokeRect(s.x, s.y, this.size, this.size);
          this.context.fillStyle = s.color;
          this.context.fillRect(s.x, s.y, this.size, this.size);
          break;
        case "friend":
          this.context.shadowBlur = 8;
          this.context.shadowColor = "white";
          this.context.shadowOffsetX = 0;
          this.context.shadowOffsetY = 0;
          this.context.lineWidth = 2;
          this.context.strokeStyle = "white";
          this.context.strokeRect(s.x, s.y, this.size, this.size);
          this.context.fillStyle = s.color;
          this.context.fillRect(s.x, s.y, this.size, this.size);
          break;
        case "immortal":
          this.context.lineCap = "round"; //,'round','square'];
          this.context.fillStyle = "rgba(255,255,255," + (i + 1) / 10 + ")";
          for (let j = 0; j < 4; j++) {
            this.context.fillRect(s.x, s.y, this.size - 1, this.size - 1);
          }
          break;
        default:
          this.context.shadowBlur = 0;
          this.context.shadowColor = "transparent";
          this.context.shadowOffsetX = 0;
          this.context.shadowOffsetY = 0;
          this.context.lineWidth = 0;
          this.context.strokeStyle = "transparent";
          this.context.fillStyle = s.color;
          this.context.fillRect(s.x, s.y, this.size, this.size);
      }

  }
  comboActivateEffect() {
    let comboEffect = ["immortal", "destroyer", "friend"];
    // let comboEffect = ["friend"];

    var randFx = comboEffect[Math.floor(Math.random() * comboEffect.length)];
    this.comboFX = randFx;
  }
  applePosition() {
    return {
      x:
        Math.round(
          this.random(this.appleSize, this.canvas.width - this.appleSize) /
            this.appleSize
        ) * this.appleSize,
      y:
        Math.round(
          this.random(this.appleSize, this.canvas.height - this.appleSize) /
            this.appleSize
        ) * this.appleSize
    };
  }
}
