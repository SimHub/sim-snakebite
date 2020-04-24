import SnakePlayer from "./snake";
import GFX from "./gameEffects";
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
  private directionLock: boolean = false;
  private xEnd: number;
  private yEnd: number;
  private clientId: string = null;
  private clientRoom: string = null;
  // private enemyId: [] | string;
  private posX: number;
  private posY: number;
  // private snl: any;
  private FPS: number = 60;
  private snake: any;
  private snakeColor: string;
  private newEnemyIDs: [] = [];
  private enemyColors: [] = [];
  private snakeEnemies: any = new Set();
  private size: number;
  private appleSize: number;
  private apple: {} = {};
  private specialBite: {} = {};
  private speed: number = 200;
  private container: HTMLElement;
  private gradient: object;
  private combo: HTMLElement = document.querySelector("#combo");
  private comboTitle: HTMLElement = document.querySelector("#comboTitle");
  private comboFX: string = null;
  private timer: () => {};
  private setComboFX: (...args: any) => {};
  private setComboStyle: (...args: any) => {};
  private immortal: boolean = false;
  private lastApplePosition: {} = null;

  // PUBLIC //
  public score: number = 0;
  public comboScore: number = 0;
  public isPaused: boolean = false;

  constructor(sn: snakeProps) {
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

    this.direction = this.getRandomDirection();
    this.posX =
      Math.round(
        this.random(this.size, this.canvas.width - this.size) / this.size
      ) * this.size;
    this.posY =
      Math.round(
        this.random(this.size, this.canvas.height - this.size) / this.size
      ) * this.size;
    this.snakeColor = this.getRandomColor();
    this.snake = new SnakePlayer(
      this.posX,
      this.posY,
      null,
      null,
      this.snakeColor,
      this.comboFX,
      this.direction
    ).snake();
    this.socket.emit("snakeColor", this.snake[0].color);
    this.socket.on("snakeColor", (colors) => {
      this.enemyColors = colors;
    });

    /// socket con ///
    this.socket.on("clientId", (client) => {
      // console.log(client);
      this.clientId = client.id;
      this.clientRoom = client.room;
      this.snake[0].id = this.clientId;
      this.snake[0].room = this.clientRoom;
      this.socket.emit("enemyId", this.snake[0]);
      // console.log(this.snake[0]);
    });

    this.socket.on("enemyId", (id) => {
      // console.log(this.snakeColor);
      // console.log(this.enemyColors);
      this.snakeEnemies.clear();
      this.newEnemyIDs = id;
      [...this.newEnemyIDs].forEach((_id) => {
        // console.log(_id);
        if (_id.id !== this.clientId) {
          let snl = new SnakePlayer(
            _id.x,
            _id.y,
            _id.id,
            _id.room,
            _id.color,
            _id.comboFX,
            _id.direction
          ).enemySnake();
          this.snakeEnemies.add(snl);
        }
      });
      // console.log("new enemy - ", this.snakeEnemies);
    });

    this.socket.on("enemyDirection", (data) => {
      this.snakeEnemies.forEach((i, k) => {
        if (i[0].enemyId === data.id) {
          i[0].direction = data.direction;
        }
      });
    });

    // this.socket.on("comboFX-friend", ({ combo, id }) => {});

    this.socket.on("snakeTick", (enemy) => {
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
    this.socket.on("apple", (a) => {
      this.apple = a.apple;
      this.specialBite = a.specialBite;
    });

    this.socket.on("user disconnected", (enemyID) => {
      // console.log("someone has gone ", enemyID);
      this.snakeEnemies.forEach((enemy) => {
        if (enemy[0].enemyId === enemyID) {
          this.snakeEnemies.delete(enemy);
        }
      });
      // console.log(this.snakeEnemies);
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

    window.addEventListener("keydown", (e) => this.keyDown(e));
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
      specialBite: this.specialBite,
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

    ///SPECIAL BITE//////
    // this.context.fillStyle = "white";
    // this.context.shadowBlur = 50;
    // this.context.fillRect(
    // this.specialBite.x,
    // this.specialBite.y,
    // this.size,
    // this.size
    // );
    /////////

    //  ENEMY /////
    this.snakeEnemies.forEach((enemy, k) => {
      for (let i = 0; i < enemy.length; i += 1) {
        const s = enemy[i];
        this.setComboStyle(s.comboFX, s, i);
      }
    });
    ///////

    /// PLAYER /////
    for (let i = 0; i < this.snake.length; i += 1) {
      const s = this.snake[i];
      let snakeLength = this.snake.length;
      this.setComboStyle(s.comboFX, s, snakeLength);

      // this.setComboFX(this.snake);
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
        this.score++;
        this.lastApplePosition = { x: this.apple.x, y: this.apple.y };
        GFX.neonTFX(this.score.toString(), this.lastApplePosition);

        //** Todo : enemy tail logic

        this.speed *= 0.99;

        this.setApple();
        // const c = document.createElement('i');
        // console.log('PLAYER GOT APPLE', this.snake[i]);
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

        this.setComboFX(this.snake);
        // console.log(this.immortal);
        if (!this.immortal) {
          for (let j = 1; j < this.snake.length; j += 1) {
            if (
              this.snake[0].x === this.snake[j].x &&
              this.snake[0].y === this.snake[j].y
            ) {
              this.socket.emit("gameover", this.snake[0].id);
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
    if (this.combo.value == 100) {
      this.combo.style.animation = "combo 1s ease-in-out infinite";
      this.comboScore = 0;
      this.comboActivateEffect();
      this.snake[0].comboFX = this.comboFX;
      this.comboTitle.innerText = this.comboFX;
      // console.log("COMBO FX: ", this.comboFX);

      this.timer = setTimeout(() => {
        this.combo.style.animation = "";
        this.combo.value = 0;
        this.comboTitle.innerText = "combo";
        this.comboFX = null;
        this.snake[0].comboFX = this.comboFX;
        this.immortal = false;
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

    this.setApple(); // SET APPLE

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
      "#000000",
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
  setComboFX(snake) {
    // console.log(snake[0].comboFX);
    switch (snake[0].comboFX) {
      case "destroyer":
        // console.log(snake);
        this.snakeEnemies.forEach((enemy, k) => {
          const s = enemy;
          if (enemy[0].comboFX !== "immortal") {
            for (let j = 0; j < enemy.length; j += 1) {
              if (snake[0].x === s[j].x && snake[0].y === s[j].y) {
                console.log("GOTCHA: ", enemy[0].enemyId);
                this.socket.emit("gameover", enemy[0].enemyId);
              }
            }
          }
        });
        break;
      case "immortal":
        this.immortal = true;
        break;
      // case "friend":
      // this.snakeEnemies.forEach((enemy, k, set) => {
      // // const s = enemy;
      // console.log(set);
      // if (enemy.length > 1) {
      // for (let j = 0; j < enemy.length; j += 1) {
      // if (snake[0].x === enemy[j].x && snake[0].y === enemy[j].y) {
      // console.log(enemy[0].enemyId);
      // let id = enemy[0].enemyId;
      // this.socket.emit("comboFX-friend", { combo: "immortal", id });
      // }
      // }
      // }
      // }
      // });
      // console.log(this.snakeEnemies);
      // break;
      default:
        this.immortal = false;
    }
  }
  setComboStyle(comboFX: string, s: any, i: number) {
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
      case "immortal":
        // console.log(comboFX);
        this.context.fillStyle = s.color;
        this.context.fillRect(s.x, s.y, this.size, this.size);
        this.context.stroke();
        this.context.fillStyle = "rgba(255,255,255,0.1)";
        for (let j = 0; j < i; j++) {
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
    // let comboEffect = ["immortal", "destroyer", "friend"];
    let comboEffect = ["immortal", "destroyer"];
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
        ) * this.appleSize,
    };
  }
}
